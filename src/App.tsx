import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Home, CheckSquare, Tv, Gift, Users, Landmark, 
  HelpCircle, User, Settings, Lock, Sparkles, BellRing, Bell, Star, AlertTriangle 
} from 'lucide-react';
import { UserProfile, TelegramUser, Language } from './types';
import { StoreDB } from './services/store';

// Importing Custom Layout Subcomponents
import AestheticFrame from './components/AestheticFrame';
import Dashboard from './components/Dashboard';
import TaskCenter from './components/TaskCenter';
import AdsOffers from './components/AdsOffers';
import RewardsCenter from './components/RewardsCenter';
import ReferralTab from './components/ReferralTab';
import WalletWithdraw from './components/WalletWithdraw';
import ProfilePage from './components/ProfilePage';
import SupportCenter from './components/SupportCenter';
import AdminPanel from './components/AdminPanel';

// Dictionary data translation for Multi-Language System
const DICTIONARY: { [key in Language]: { [key: string]: string } } = {
  en: {
    home: 'Home',
    tasks: 'Tasks',
    ads: 'Ads Center',
    rewards: 'Rewards',
    referral: 'Affiliates',
    wallet: 'Wallet',
    profile: 'Profile',
    support: 'Support',
    admin: 'Admin Console',
    balance: 'Total Balance',
    completedTasks: 'Completed Tasks',
    inviteFriends: 'Invite',
    streak: 'Daily Streak',
    withdraw: 'Withdraw Cash',
    congrats: 'Congratulations'
  },
  bn: {
    home: 'হোম',
    tasks: 'টাস্ক সেন্টার',
    ads: 'বিজ্ঞাপন সেন্টার',
    rewards: 'পুরস্কার',
    referral: 'রেফার',
    wallet: 'ওয়ালেট',
    profile: 'প্রোফাইল',
    support: 'সাপোর্ট',
    admin: 'এডমিন প্যানেল',
    balance: 'মোট ব্যালেন্স',
    completedTasks: 'সম্পন্ন টাস্ক',
    inviteFriends: 'আমন্ত্রণ',
    streak: 'ডেইলি স্ট্রিক',
    withdraw: 'ক্যাশ উত্তোলন',
    congrats: 'অভিনন্দন'
  },
  hi: {
    home: 'मुख्य पृष्ठ',
    tasks: 'कार्य केंद्र',
    ads: 'विज्ञापन केंद्र',
    rewards: 'पुरस्कार',
    referral: 'रेफरल',
    wallet: 'बटुआ',
    profile: 'प्रोफ़ाइल',
    support: 'सहायता',
    admin: 'अव्यवस्था पैनल',
    balance: 'कुल शेष राशि',
    completedTasks: 'पूरे किए गए कार्य',
    inviteFriends: 'आमंत्रित करें',
    streak: 'दैनिक स्ट्रीक',
    withdraw: 'रकम निकासी',
    congrats: 'बधाई हो'
  },
  ar: {
    home: 'الرئيسية',
    tasks: 'المهام',
    ads: 'مركز الإعلانات',
    rewards: 'المكافآت',
    referral: 'الإحالات',
    wallet: 'المحفظة',
    profile: 'الحساب',
    support: 'الدعم الفني',
    admin: 'لوحة التحكم',
    balance: 'الرصيد الإجمالي',
    completedTasks: 'المهام المكتملة',
    inviteFriends: 'أدعُ الأصدقاء',
    streak: 'التسجيل اليومي',
    withdraw: 'سحب الأموال',
    congrats: 'تهانينا لكم'
  }
};

// Simulation tester presets
const MOCK_PROFILES: TelegramUser[] = [
  { id: '2837492837', username: 'ariyanrana_pro', first_name: 'Ariyan', last_name: 'Rana', is_premium: true, language_code: 'en' },
  { id: '9920384820', username: 'nadim_active', first_name: 'Nadim', last_name: 'Bhai', is_premium: false, language_code: 'bn' },
  { id: '1004829381', username: 'samira_uae', first_name: 'Samira', last_name: 'K', is_premium: true, language_code: 'ar' },
  { id: '2283049280', username: 'rahul_india', first_name: 'Rahul', last_name: 'Sharma', is_premium: false, language_code: 'hi' }
];

export default function App() {
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');
  const [activePage, setActivePage] = useState<string>('home');
  const [activeSimProfileIdx, setActiveSimProfileIdx] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [sysSettings, setSysSettings] = useState(() => StoreDB.getSettings());
  
  useEffect(() => {
    const unsub = StoreDB.subscribeToSettings((updated) => {
      setSysSettings(updated);
    });
    return unsub;
  }, []);
  
  // Custom toast alert
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showSimSelector, setShowSimSelector] = useState(false);

  // Trigger sound-free tactile alerts
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Initial login handler with Telegram Mini App auto-detect bindings
  useEffect(() => {
    try {
      // Collect parameters from official Telegram Mini App WebApp SDK if available
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        if (typeof tg.ready === 'function') tg.ready();
        if (typeof tg.expand === 'function') tg.expand();
        
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
          const profile = StoreDB.createOrUpdateTelegramUser({
            id: String(tgUser.id),
            username: tgUser.username,
            first_name: tgUser.first_name || 'User',
            last_name: tgUser.last_name || '',
            is_premium: !!tgUser.is_premium,
            language_code: tgUser.language_code || 'en',
            photo_url: tgUser.photo_url || ''
          });
          setCurrentUser(profile);
          setCurrentLang(profile.language);
          return;
        }
      }
    } catch (e) {
      console.warn("Telegram WebApp SDK safely caught exception on init:", e);
    }

    // Default simulation login loader
    handleRefreshUser();
  }, [activeSimProfileIdx]);

  // Dynamic Real Geolocation correction
  useEffect(() => {
    if (currentUser) {
      // 1. Timezone-based fast correction
      const currentEst = StoreDB.getEstimatedCountry();
      if (currentUser.country === 'United States' && currentEst !== 'United States') {
        const revised = StoreDB.updateUser(currentUser.uid, { country: currentEst });
        setCurrentUser(revised);
      }
      
      // 2. High-precision background GeoIP check
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data && data.country_name && currentUser.country !== data.country_name) {
            const revised = StoreDB.updateUser(currentUser.uid, { country: data.country_name });
            setCurrentUser(revised);
            console.log(`[GEOIP] Profile country corrected to ${data.country_name} dynamically.`);
          }
        })
        .catch(err => {
          console.log("[GEOIP] Silent GeoIP check skipped or blocked:", err.message);
        });
    }
  }, [currentUser?.uid]);

  const handleRefreshUser = () => {
    try {
      const selectedSim = MOCK_PROFILES[activeSimProfileIdx];
      // Check if referral param of custom register is in URL E.g. ?ref=ARIYAN88
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref') || undefined;

      const profile = StoreDB.createOrUpdateTelegramUser(selectedSim, refParam);
      setCurrentUser(profile);
      setCurrentLang(profile.language);
    } catch (e) {
      console.error("handleRefreshUser failed, executing clean fallback profile load:", e);
      // Hard fallback profile
      const fallbackProfile: UserProfile = {
        uid: 'tg_fallback_user',
        telegramId: '2837492837',
        username: 'ariyan_rana',
        firstName: 'Ariyan',
        lastName: 'Rana',
        photoUrl: '',
        language: 'en',
        isPremium: true,
        joinedAt: Date.now() - 86400000,
        country: 'Bangladesh',
        balance: 100.0,
        pendingBalance: 10.0,
        coins: 1000,
        rewardPoints: 100,
        totalEarned: 110.0,
        totalWithdrawn: 0,
        referralEarned: 0,
        referredBy: null,
        referralCode: 'ARIYAN88',
        referralCount: 0,
        completedTasksCount: 0,
        completedAdsCount: 0,
        completedSurveysCount: 0,
        xp: 100,
        level: 1,
        vipLevel: 1,
        rank: 1,
        lastCheckIn: 0,
        checkInStreak: 0,
        isBanned: false
      };
      setCurrentUser(fallbackProfile);
      setCurrentLang('en');
    }
  };

  const handleToggleSimProfile = () => {
    const nextIdx = (activeSimProfileIdx + 1) % MOCK_PROFILES.length;
    setActiveSimProfileIdx(nextIdx);
    setShowSimSelector(false);
    triggerToast(`Logged in under simulate profile: @${MOCK_PROFILES[nextIdx].username}`, 'success');
  };

  const handleSetLanguage = (lang: Language) => {
    if (currentUser) {
      const updated = StoreDB.updateUser(currentUser.uid, { language: lang });
      setCurrentUser(updated);
      setCurrentLang(lang);
      triggerToast(`Language switched to: ${lang.toUpperCase()}`, 'success');
    }
  };

  // Dynamically inject configured Ad network SDK scripts to the main page body
  useEffect(() => {
    if (!sysSettings) return;

    const injectScript = (scriptStr: string | undefined, networkName: string) => {
      if (!scriptStr) return;
      const id = `global-ad-script-${networkName}`;
      
      // Compare content to find if dynamic settings updated
      const existing = document.getElementById(id);
      if (existing) {
        if (existing.getAttribute('data-raw-content') === scriptStr) {
          return;
        }
        existing.remove();
        const subScripts = document.querySelectorAll(`[id^="${id}-"]`);
        subScripts.forEach(el => el.remove());
      }

      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(scriptStr, 'text/html');
        const scriptTags = doc.querySelectorAll('script');

        scriptTags.forEach((sTag, idx) => {
          const wrapper = document.createElement('div');
          wrapper.id = `${id}-${idx}`;
          wrapper.style.display = 'none';

          const newScript = document.createElement('script');
          
          // Copy all attributes
          Array.from(sTag.attributes).forEach(attr => {
            let val = attr.value;
            // Standardize protocol-relative links (e.g. //libtl.com -> https://libtl.com)
            if (attr.name === 'src' && val.startsWith('//')) {
              val = 'https:' + val;
            }
            newScript.setAttribute(attr.name, val);
          });

          // Inline scripts support
          if (sTag.textContent) {
            newScript.textContent = sTag.textContent;
          }

          wrapper.appendChild(newScript);
          document.body.appendChild(wrapper);
          console.log(`[Ad Injector] Dynamically injected ${networkName} SDK script`);
        });

        // Save raw content trace
        const marker = document.createElement('meta');
        marker.id = id;
        marker.setAttribute('data-raw-content', scriptStr);
        document.head.appendChild(marker);
      } catch (e) {
        console.error(`Failed to inject dynamic ${networkName} ad script:`, e);
      }
    };

    // Dynamically loop and inject ALL user-defined active ad scripts
    const activeAds = sysSettings.dynamicAds || [];
    activeAds.forEach((ad) => {
      if (ad.isActive !== false && ad.sdkScript) {
        injectScript(ad.sdkScript, ad.id);
      }
    });

    injectScript(sysSettings.adMonetagSdkScript, 'legacy-monetag');
    injectScript(sysSettings.adAdsterraSdkScript, 'legacy-adsterra');
    injectScript(sysSettings.adCustomSdkScript, 'legacy-custom');
  }, [viewMode, sysSettings]);

  // Translation function helper
  const t = (key: string) => {
    return DICTIONARY[currentLang]?.[key] || DICTIONARY['en']?.[key] || key;
  };

  const isMaintenance = sysSettings?.maintenanceMode === true;

  if (!currentUser) return null;

  return (
    <AestheticFrame
      activeSimUser={currentUser.username}
      onToggleUser={() => setShowSimSelector(true)}
      viewMode={viewMode}
      onChangeViewMode={(mode) => {
        setViewMode(mode);
        // Reset activePage to home if switching modes to avoid stuck states
        setActivePage('home');
      }}
    >
      {viewMode === 'admin' ? (
        <div className="flex-1 overflow-y-auto">
          <AdminPanel
            onRefreshUser={handleRefreshUser}
            showToast={triggerToast}
            onExitAdmin={() => setViewMode('user')}
            onToggleUserSim={() => setShowSimSelector(true)}
          />
        </div>
      ) : isMaintenance ? (
        <div className="flex-1 flex flex-col justify-between overflow-y-auto min-h-full">
          {/* Subtle header so that clicking Logo 10 times can still open code settings */}
          <header className="p-3 bg-slate-900 bg-opacity-92 border-b border-slate-850 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-501 to-purple-650 flex items-center justify-center font-bold text-white shadow shadow-indigo-600/20">
                <Star className="w-4 h-4 fill-white text-white animate-spin" />
              </div>
              <div 
                onClick={() => {
                  const updated = logoClickCount + 1;
                  if (updated >= 10) {
                    setViewMode('admin');
                    setLogoClickCount(0);
                    triggerToast('🔓 Welcome Back, Administrator!', 'success');
                  } else {
                    setLogoClickCount(updated);
                  }
                }}
                className="cursor-pointer select-none"
              >
                <h1 className="text-xs font-black tracking-wide text-slate-100 flex items-center gap-1 leading-none">
                  TaskEarn Pro <span className="p-0.5 px-1 bg-red-950 text-rose-500 text-[8.5px] rounded border border-red-900">OFFLINE</span>
                </h1>
                <p className="text-[10px] text-slate-400 leading-none mt-1">
                  Database Mainframe Lock
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 leading-none">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline" />
              <span className="text-[9px] font-mono text-rose-455 font-bold uppercase tracking-wider">MAINTENANCE</span>
            </div>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-450 border border-rose-900/30 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-sm">
              <h2 className="text-base font-black text-slate-100 uppercase tracking-widest">SYSTEM UNDER UPGRADE</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                We are currently building and optimizing our high-speed payout database node. All your earned coins, completed tasks, and wallet balance are perfectly secure.
              </p>
              <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                পেমেন্ট সিস্টেম ও ডাটাবেজ অপটিমাইজেশন চলছে। আপনার অর্জিত কয়েন এবং ওয়ালেট ব্যালেন্স সম্পূর্ণ সুরক্ষিত আছে। আপডেট শেষ হওয়া মাত্রই সম্পূর্ণ সার্ভিস পুনরায় চালু করা হবে। ধন্যবাদ!
              </p>
            </div>

            {sysSettings.announcement && (
              <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-2xl max-w-sm text-left relative overflow-hidden">
                <span className="text-[8.5px] font-bold text-indigo-400 uppercase tracking-widest font-mono block mb-1">📢 Admin Announcement Note</span>
                <p className="text-[11px] text-slate-350 leading-normal">{sysSettings.announcement}</p>
              </div>
            )}

            {sysSettings.telegramBotUrl && (
              <a
                href={sysSettings.telegramBotUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-650 hover:bg-slate-950 text-white font-heavy text-xs rounded-xl border border-indigo-905 transition active:scale-95 cursor-pointer shadow-lg"
              >
                Join Telegram Support Chat
              </a>
            )}
          </div>
          
          <div className="p-4 text-center text-[10px] text-slate-650 font-mono">
            Powered by TaskEarn Pro Ecosystem • Version 2.4.1
          </div>
        </div>
      ) : (
        <>
          {/* 2. PREMIUM SLIDING NAVIGATION HEADER */}
      <header className="p-3 bg-slate-900 bg-opacity-92 border-b border-slate-850 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          {/* Badge */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-501 to-purple-650 flex items-center justify-center font-bold text-white shadow shadow-indigo-600/20">
            <Star className="w-4 h-4 fill-white text-white animate-spin" />
          </div>
          <div 
            onClick={() => {
              const updated = logoClickCount + 1;
              if (updated >= 10) {
                setViewMode('admin');
                setLogoClickCount(0);
                triggerToast('🔓 Welcome Back, Administrator!', 'success');
              } else {
                setLogoClickCount(updated);
              }
            }}
            className="cursor-pointer select-none animate-fade"
          >
            <h1 className="text-xs font-black tracking-wide text-slate-100 flex items-center gap-1 leading-none">
              TaskEarn Pro <span className="p-0.5 px-1 bg-indigo-950 text-indigo-400 text-[8.5px] rounded border border-indigo-900">PRO</span>
            </h1>
            <p className="text-[10px] text-slate-400 leading-none mt-1">
              {t('balance')}: <b className="text-slate-201 font-mono">${currentUser.balance.toFixed(2)}</b>
            </p>
          </div>
        </div>

        {/* Language selector turned off as requested */}
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
          <span className="text-[9.5px] font-mono text-emerald-450 font-bold tracking-tight uppercase">SECURED</span>
        </div>
      </header>

      {/* 3. SCROLLABLE ACTIVE CONTENT VIEW */}
      <div className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          {activePage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <Dashboard
                user={currentUser}
                onRefreshUser={handleRefreshUser}
                showToast={triggerToast}
                setActivePage={setActivePage}
              />
            </motion.div>
          )}

          {activePage === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <TaskCenter
                user={currentUser}
                onRefreshUser={handleRefreshUser}
                showToast={triggerToast}
              />
            </motion.div>
          )}

          {activePage === 'ads' && (
            <motion.div
              key="ads"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AdsOffers
                user={currentUser}
                onRefreshUser={handleRefreshUser}
                showToast={triggerToast}
              />
            </motion.div>
          )}

          {activePage === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RewardsCenter
                user={currentUser}
                onRefreshUser={handleRefreshUser}
                showToast={triggerToast}
              />
            </motion.div>
          )}

          {activePage === 'referrals' && (
            <motion.div
              key="referrals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ReferralTab
                user={currentUser}
                showToast={triggerToast}
              />
            </motion.div>
          )}

          {activePage === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <WalletWithdraw
                user={currentUser}
                onRefreshUser={handleRefreshUser}
                showToast={triggerToast}
              />
            </motion.div>
          )}

          {activePage === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <ProfilePage
                user={currentUser}
                onRefreshUser={handleRefreshUser}
                showToast={triggerToast}
              />
            </motion.div>
          )}

          {activePage === 'support' && (
            <motion.div
              key="support"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <SupportCenter
                user={currentUser}
                showToast={triggerToast}
              />
            </motion.div>
          )}


        </AnimatePresence>
      </div>

      {/* 4. SOLID FIXED GLASS NAVIGATION BAR (GLOWING FOOTER) */}
      <nav className="absolute bottom-0 inset-x-0 bg-slate-900 bg-opacity-95 backdrop-blur-md border-t border-slate-850 px-3 py-2 flex justify-between items-center z-30 shadow-2xl">
        <button
          onClick={() => setActivePage('home')}
          className={`flex flex-col items-center gap-1 select-none flex-1 transition cursor-pointer ${
            activePage === 'home' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <Home className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">{t('home')}</span>
        </button>

        <button
          onClick={() => setActivePage('tasks')}
          className={`flex flex-col items-center gap-1 select-none flex-1 transition cursor-pointer ${
            activePage === 'tasks' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <CheckSquare className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">{t('tasks')}</span>
        </button>

        <button
          onClick={() => setActivePage('ads')}
          className={`flex flex-col items-center gap-1 select-none flex-1 transition cursor-pointer ${
            activePage === 'ads' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <Tv className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">Ads</span>
        </button>

        <button
          onClick={() => setActivePage('rewards')}
          className={`flex flex-col items-center gap-1 select-none flex-1 transition cursor-pointer ${
            activePage === 'rewards' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <Gift className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">Game</span>
        </button>

        <button
          onClick={() => setActivePage('wallet')}
          className={`flex flex-col items-center gap-1 select-none flex-1 transition cursor-pointer ${
            activePage === 'wallet' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <Landmark className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">Wallet</span>
        </button>

        {/* Expanders Drawer links button */}
        <button
          onClick={() => setActivePage(activePage === 'support' || activePage === 'profile' ? 'home' : 'profile')}
          className={`flex flex-col items-center gap-1 select-none flex-1 transition cursor-pointer ${
            activePage === 'profile' || activePage === 'support' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-355'
          }`}
        >
          <User className="w-4.5 h-4.5" />
          <span className="text-[10px] font-bold">More</span>
        </button>
      </nav>

      {/* Floating expanded menu overlay if 'More' options selected */}
      {(activePage === 'profile' || activePage === 'support') && (
        <div className="absolute bottom-16 inset-x-4 bg-slate-950/98 border border-slate-800 rounded-2xl p-2 flex gap-1.5 z-20 animate-fade shadow-xl">
          <button
            onClick={() => setActivePage('profile')}
            className={`flex-1 py-2 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 ${
              activePage === 'profile' ? 'bg-indigo-950 text-indigo-305 border border-indigo-805/30' : 'text-slate-400'
            }`}
          >
            My PROFILE
          </button>
          <button
            onClick={() => setActivePage('support')}
            className={`flex-1 py-2 rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1 ${
              activePage === 'support' ? 'bg-indigo-950 text-indigo-305 border border-indigo-805/30' : 'text-slate-400'
            }`}
          >
            CUSTOMER Care
          </button>
        </div>
      )}
    </>
  )}

      {/* 5. SIDE DRAWER FOR CHANGING SIMULATION PROFILES */}
      <AnimatePresence>
        {showSimSelector && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-slate-900 border-t border-slate-750 p-5 rounded-t-3xl shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-4" />
              <div className="space-y-1 text-center mb-5">
                <h3 className="text-sm font-black text-slate-100">Toggle Telegram Sim Profiler</h3>
                <p className="text-[11px] text-slate-500">
                  Swap simulated tester context identities immediately to test translation, balances, premium checks, and admin controls!
                </p>
              </div>

              <div className="space-y-2">
                {MOCK_PROFILES.map((prof, idx) => (
                  <button
                    key={prof.id}
                    onClick={() => {
                      setActiveSimProfileIdx(idx);
                      setShowSimSelector(false);
                      triggerToast(`Identity Swapped to @${prof.username}`, 'success');
                    }}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between border cursor-pointer text-left transition ${
                      activeSimProfileIdx === idx 
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-305' 
                        : 'bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-350'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold font-mono">@{prof.username} {prof.is_premium ? '🌟' : ''}</p>
                      <p className="text-[10px] text-slate-500 capitalize">
                        Language: {prof.language_code.toUpperCase()} • Name: {prof.first_name}
                      </p>
                    </div>
                    {activeSimProfileIdx === idx && (
                      <span className="p-1 bg-indigo-500/10 text-indigo-400 text-[10px] rounded-md font-bold">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowSimSelector(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 transition text-slate-300 font-bold text-xs rounded-2xl mt-4 cursor-pointer"
              >
                Close Selector
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. TOAST FLOATING ALERTS POPUP */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs pointer-events-none"
          >
            <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-2.5 border backdrop-blur ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-955 bg-opacity-92 border-rose-500/30 text-rose-300'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse flex-shrink-0" />
              <p className="text-xs font-bold leading-normal text-left">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AestheticFrame>
  );
}
