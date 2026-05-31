import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Calendar, Globe, Award, ShieldAlert, Sparkles, Trophy, 
  ChevronRight, BadgeCheck, Zap, Lock, Info, Database, ShieldCheck, LogIn, LogOut
} from 'lucide-react';
import { UserProfile, Achievement } from '../types';
import { StoreDB } from '../services/store';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';

interface ProfilePageProps {
  user: UserProfile;
  onRefreshUser: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function ProfilePage({ user, onRefreshUser, showToast }: ProfilePageProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<'achieve' | 'vip'>('achieve');
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSyncInfo, setShowSyncInfo] = useState(false);

  useEffect(() => {
    setAchievements(StoreDB.getAchievementsList());
    const unsubscribe = auth.onAuthStateChanged((fUser) => {
      setFirebaseUser(fUser);
    });

    // Capture Redirect result if any
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          showToast(`Logged into Google via Redirect: ${result.user.displayName}`, 'success');
          StoreDB.syncFromCloud(user.uid).then((cloudProfile) => {
            if (cloudProfile) {
              onRefreshUser();
              showToast('Cloud database synchronized successfully!', 'success');
            }
          });
        }
      })
      .catch((err) => {
        console.error("Redirect login result error:", err);
      });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async (useRedirect = false) => {
    setSyncing(true);
    setAuthError(null);
    try {
      if (useRedirect) {
        showToast("Redirecting to Google Sign-In...", "success");
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      const result = await signInWithPopup(auth, googleProvider);
      showToast(`Logged into Google: ${result.user.displayName}`, 'success');
      
      // Auto synchronize local state to Firebase Firestore safely!
      const cloudProfile = await StoreDB.syncFromCloud(user.uid);
      if (cloudProfile) {
        onRefreshUser();
        showToast('Cloud database synchronized successfully!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || String(err);
      if (errMsg.includes('popup-closed-by-user') || errMsg.includes('popup-blocked')) {
        errMsg = "Telegram nested iframe blocks popups. Please use 'Redirect Login' or open in Chrome/Safari browser.";
      }
      setAuthError(errMsg);
      showToast(errMsg, 'error');
      setShowSyncInfo(true);
    } finally {
      setSyncing(false);
    }
  };

  const handleGoogleLogout = async () => {
    setSyncing(true);
    try {
      await signOut(auth);
      showToast('Disconnected from Cloud backup.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const getMetricProgress = (ach: Achievement) => {
    switch (ach.metric) {
      case 'tasks': return user.completedTasksCount;
      case 'ads': return user.completedAdsCount;
      case 'surveys': return user.completedSurveysCount;
      case 'referrals': return user.referralCount;
      case 'earnings': return Math.floor(user.balance * 1000); // coin factor
      default: return 0;
    }
  };

  const vipTiers = StoreDB.getVipTiers();

  const handleBuyVIP = (level: number, price: number) => {
    if (user.vipLevel >= level) {
      showToast('You already own this VIP status or a higher tier.', 'error');
      return;
    }

    if (user.coins < price) {
      showToast(`Insufficient coins. You require ${price.toLocaleString()} Coins to purchase this level.`, 'error');
      return;
    }

    try {
      StoreDB.updateUser(user.uid, {
        coins: user.coins - price,
        vipLevel: level
      });
      showToast(`Congratulations! You upgraded to VIP level ${level}!`, 'success');
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div id="profile-page-tab" className="p-4 space-y-4 text-left">
      {/* 1. HERO BIO CARD */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full filter blur-lg" />

        <div className="relative">
          <img
            src={user.photoUrl}
            alt={user.firstName}
            className="w-16 h-16 rounded-full border-2 border-indigo-500 shadow-lg"
          />
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950 flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-slate-950 rounded-full animate-ping" />
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-extrabold text-slate-100 text-sm">@{user.username}</h3>
            {user.isPremium && <BadgeCheck className="w-4 h-4 text-sky-400 fill-sky-500" />}
          </div>
          <p className="text-xs text-indigo-400 uppercase font-bold tracking-tight">Level {user.level} Earning Pilot</p>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5" /> Est: {new Date(user.joinedAt).toLocaleDateString()} • <Globe className="w-3.5 h-3.5" /> {user.country}
          </span>
        </div>
      </div>

      {/* CLOUD SECURE BACKUP AND SYNC CENTER */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border flex-shrink-0 ${firebaseUser ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-950 border-slate-900 text-slate-505'}`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-100 flex items-center gap-1">
                Cloud Sync & Protection <span className="p-0.5 px-1.5 bg-emerald-950 text-emerald-400 text-[8px] font-bold rounded border border-emerald-900 leading-none">SECURE</span>
              </h4>
              <p className="text-[10px] text-slate-450 leading-relaxed mt-0.5">
                {firebaseUser ? `Linked Account: ${firebaseUser.email}` : 'Backup and secure your total coins balance, completed tasks and invite streaks across devices.'}
              </p>
            </div>
          </div>
        </div>

        {firebaseUser ? (
          <div className="flex flex-col gap-2.5 bg-slate-955 p-3 rounded-xl border border-indigo-950/30">
            <div className="flex items-center justify-between text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-[10.5px] text-emerald-305 font-mono font-bold">Durable Real-time Sync Active</span>
              </div>
              <button
                onClick={handleGoogleLogout}
                disabled={syncing}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-[10px] sm:text-xs uppercase font-extrabold tracking-tight rounded-lg border border-slate-800 transition flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
            <div className="text-[9.5px] text-emerald-400/90 font-mono text-left border-t border-slate-900 pt-1.5 flex items-center gap-1">
              <span>✔️ Your balance of <b>{user.coins.toLocaleString()} Coins</b> & progress are saved safely in Firestore.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Display Auth Error Warning beautifully if occurred */}
            {authError && (
              <div className="p-3 bg-rose-950/20 border border-rose-900/40 text-rose-300 rounded-xl text-[11px] leading-relaxed space-y-1 text-left font-mono">
                <p className="font-bold flex items-center gap-1 text-xs text-rose-400">
                  ⚠️ Google Connection Notice (গুগল কানেকশন নোটিস):
                </p>
                <p>
                  Telegram Mini Apps are nested inside iframes and prevent browser Popups automatically.
                </p>
                <p className="text-amber-300 font-bold">
                  সমাধান: নিচে থাকা "Sign in via Google Redirect (নিরাপদ রিডাইরেক্ট)" বোতামটি চাপুন, অথবা টেলিগ্রামের ৩-ডটে ক্লিক করে "Open in Browser" নির্বাচন করুন।
                </p>
                <p className="text-[10px] text-slate-450 mt-1 border-t border-slate-850 pt-1">
                  <b>Raw details:</b> {authError}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {/* Fallback 1: Redirect Mode (Highly recommended for iframe nested) */}
              <button
                onClick={() => handleGoogleLogin(true)}
                disabled={syncing}
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-550 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                <LogIn className="w-4 h-4" /> 🔗 Sign in via Google Redirect (নিরাপদ রিডাইরেক্ট)
              </button>

              {/* Standard Popup Button */}
              <button
                onClick={() => handleGoogleLogin(false)}
                disabled={syncing}
                className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-slate-350 border border-slate-850 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" /> Google Popup Mode (পপআপ ট্রাই করুন)
              </button>
            </div>

            {/* Instruction toggle */}
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850/50 text-[10px] text-slate-400 space-y-2 text-left">
              <span className="font-bold text-indigo-400 block uppercase tracking-wide font-mono">
                💡 How to Backup from Telegram (ব্যাকআপ করার নিয়ম):
              </span>
              <ul className="list-disc pl-3.5 space-y-1 leading-normal font-mono text-[9px]">
                <li>টেলিগ্রামের ভিতরে সরাসরি পপআপ ব্লক থাকে। তাই <b>"Google Redirect"</b> বাটনে ক্লিক করাই সবচেয়ে নিরাপদ ও সহজ।</li>
                <li>অথবা, উপরে ডান কোণায় <b>৩-ডটে (Three-dots)</b> ক্লিক করে <b>"Open in Browser" (ক্রোম বা সাফারিতে খোলেন)</b> করুন, তারপর যেকোনো বাটন দিয়ে সহজে কানেক্ট করে নিন।</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 2. SUB NAVIGATION FOR INNER TABS */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
        <button
          onClick={() => setActiveTab('achieve')}
          className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'achieve' ? 'bg-indigo-950 border border-indigo-500/10 text-indigo-300' : 'text-slate-500'
          }`}
        >
          🏆 Medals & Badges
        </button>
        <button
          onClick={() => setActiveTab('vip')}
          className={`flex-1 text-xs py-2 font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'vip' ? 'bg-indigo-950 border border-indigo-500/10 text-indigo-300' : 'text-slate-500'
          }`}
        >
          💎 VIP Upgrade Club
        </button>
      </div>

      {/* 3. ACH PANEL SECTOR */}
      <AnimatePresence mode="wait">
        {activeTab === 'achieve' ? (
          <motion.div
            key="achieve-panel"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-2.5"
          >
            {achievements.map(ach => {
              const currentProgress = getMetricProgress(ach);
              const progressPercentage = Math.min(100, Math.floor((currentProgress / ach.targetCount) * 100));
              const isUnlocked = currentProgress >= ach.targetCount;

              return (
                <div key={ach.id} className="bg-slate-900 border border-slate-850 p-3.5 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${
                        isUnlocked ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse' : 'bg-slate-950 text-slate-650 border-slate-900'
                      }`}>
                        <Award className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-205">{ach.title}</h4>
                        <p className="text-[10.5px] text-slate-450">{ach.description}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {currentProgress} / {ach.targetCount}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-950 h-1.5 mt-3.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-full transition-all" style={{ width: `${progressPercentage}%` }} />
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          /* VIP CLUB SECTOR */
          <motion.div
            key="vip-panel"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-2.5"
          >
            <div className="bg-indigo-950/15 border border-indigo-500/15 rounded-xl p-3 flex gap-2.5">
              <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <p className="text-[10.5px] text-indigo-300 leading-normal">
                VIP levels unlock direct bonuses: extra coins, high-multiplier referral streams, and exclusive priority support access! Use coins to buy VIP memberships.
              </p>
            </div>

            {vipTiers.map(tier => {
              const owned = user.vipLevel >= tier.level;
              return (
                <div
                  key={tier.level}
                  className={`border rounded-2xl p-3.5 flex items-center justify-between relative overflow-hidden transition ${
                    owned
                      ? 'bg-gradient-to-r from-slate-900 to-indigo-950/25 border-indigo-550/30'
                      : 'bg-slate-900/60 border-slate-850/80 grayscale'
                  }`}
                >
                  <div className="space-y-1 pr-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-slate-100">{tier.name}</span>
                      {owned && (
                        <span className="p-0.5 px-1.5 bg-indigo-500/10 text-indigo-400 rounded text-[8.5px] font-bold">
                          OWNED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-450 leading-relaxed truncate">{tier.desc}</p>
                    <span className="text-[11px] font-mono text-emerald-450 font-bold block">
                      Earnings multiplier: {tier.multi}
                    </span>
                  </div>

                  <div>
                    {owned ? (
                      <span className="p-1 px-3 text-[10.5px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg flex items-center gap-1">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuyVIP(tier.level, tier.cost)}
                        className="py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] rounded-lg cursor-pointer whitespace-nowrap"
                      >
                        Buy: {tier.cost === 0 ? 'Free' : `${tier.cost.toLocaleString()} 🟡`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
