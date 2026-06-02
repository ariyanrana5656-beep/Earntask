import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, Clock, ShieldAlert, Sparkles, Award, CheckCircle, Flame, Eye, Send, ExternalLink
} from 'lucide-react';
import { UserProfile, AdOffer } from '../types';
import { StoreDB, AD_OFFERS } from '../services/store';

const formatCooldown = (secs: number) => {
  if (secs <= 0) return '';
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${secs % 60}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
};

interface AdsOffersProps {
  user: UserProfile;
  onRefreshUser: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function AdsOffers({ user, onRefreshUser, showToast }: AdsOffersProps) {
  const [activeAd, setActiveAd] = useState<AdOffer | null>(null);
  const [timerLeft, setTimerLeft] = useState(0);
  const [isAdComplete, setIsAdComplete] = useState(false);
  const [adHistory, setAdHistory] = useState<{ id: string; timestamp: number; reward: number; format: string }[]>([]);
  const [cooldowns, setCooldowns] = useState<{ [adId: string]: number }>({});

  const [settings, setSettings] = useState(() => StoreDB.getSettings());
  const [adState, setAdState] = useState<'idle' | 'loading' | 'loaded' | 'failed' | 'completed'>('idle');
  const [isClaiming, setIsClaiming] = useState(false);

  const dailyLimit = settings.dailyAdsLimit ?? 25;

  const isSameDay = (t1: number, t2: number) => {
    if (!t1 || !t2) return false;
    const date1 = new Date(t1);
    const date2 = new Date(t2);
    return date1.getUTCFullYear() === date2.getUTCFullYear() &&
           date1.getUTCMonth() === date2.getUTCMonth() &&
           date1.getUTCDate() === date2.getUTCDate();
  };

  const todayCount = isSameDay(user.lastAdWatchedAt || 0, Date.now()) ? (user.todayAdsCount || 0) : 0;
  const remainingAds = Math.max(0, dailyLimit - todayCount);

  useEffect(() => {
    const unsubSettings = StoreDB.subscribeToSettings((updated) => {
      setSettings(updated);
    });
    return () => unsubSettings();
  }, []);

  // Filter and prepare ad offers
  const dynamicAdOffers: AdOffer[] = (() => {
    const customList = (settings.dynamicAds || []).filter(ad => ad.isActive !== false);
    if (customList.length === 0) {
      return AD_OFFERS;
    }
    return customList;
  })();

  useEffect(() => {
    const historyKey = `te_adhistory_${user.uid}`;
    const cdKey = `te_adcooldowns_${user.uid}`;
    
    try {
      setAdHistory(JSON.parse(localStorage.getItem(historyKey) || '[]'));
      const localCd = JSON.parse(localStorage.getItem(cdKey) || '{}');
      const mergedCd = { ...localCd, ...(user.adCooldowns || {}) };
      setCooldowns(mergedCd);
    } catch (e) {
      console.warn("localStorage restricted; initializing empty logs for ad center.", e);
      setAdHistory([]);
      setCooldowns(user.adCooldowns || {});
    }
  }, [user.uid, user.adCooldowns]);

  // Handle active running countdown timer
  useEffect(() => {
    if (!activeAd || timerLeft <= 0) {
      if (activeAd && timerLeft === 0 && adState === 'loaded') {
        setIsAdComplete(true);
        setAdState('completed');
      }
      return;
    }

    if (adState !== 'loaded') return;

    const interval = setInterval(() => {
      setTimerLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerLeft, activeAd, adState]);

  // Handle ticking down active cooling down ad lists
  useEffect(() => {
    const cdKeys = Object.keys(cooldowns);
    if (cdKeys.length === 0) return;

    const interval = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev };
        let flag = false;
        cdKeys.forEach(k => {
          if (next[k] > Date.now()) {
            flag = true;
          } else {
            delete next[k];
          }
        });
        if (flag) {
          try {
            localStorage.setItem(`te_adcooldowns_${user.uid}`, JSON.stringify(next));
          } catch (e) {}
          return next;
        }
        clearInterval(interval);
        return {};
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldowns, user.uid]);

  const handleWatchAd = (offer: AdOffer) => {
    if (todayCount >= dailyLimit) {
      showToast(`Daily Limit reached! You can watch up to ${dailyLimit} ads per 24 hours. Reset at UTC midnight.`, 'error');
      return;
    }

    if (cooldowns[offer.id] && cooldowns[offer.id] > Date.now()) {
      const remainSecs = Math.ceil((cooldowns[offer.id] - Date.now()) / 1000);
      showToast(`Ad is cooling down. Please wait ${remainSecs} seconds.`, 'error');
      return;
    }

    // Resolve redirection link to Telegram Ad bot (Prioritize offer configurations, else use system variables)
    const botUrl = offer.directUrl || (settings as any).telegramBotAdUrl || settings.telegramBotUrl || 'https://t.me/TaskEarnProBot';

    try {
      window.open(botUrl, '_blank');
      showToast('Sponsor Telegram bot campaign opened! Follow directions to earn rewards.', 'success');
    } catch (e) {
      console.warn("[ADS] Failed to launch popup window natively", e);
    }

    setActiveAd(offer);
    setAdState('loaded');
    setTimerLeft(offer.format === 'rewarded' ? 15 : offer.format === 'interstitial' ? 10 : 6);
    setIsAdComplete(false);
  };

  const handleCloseAdEarly = () => {
    if (adState !== 'completed') {
      showToast('❌ Ad close triggered too early. You earned 0 coins. Anti-abuse active.', 'error');
    }
    setActiveAd(null);
    setAdState('idle');
  };

  const handleClaimAdReward = () => {
    if (isClaiming || !activeAd || adState !== 'completed') return;

    setIsClaiming(true);
    try {
      const now = Date.now();
      const nextTodayCount = isSameDay(user.lastAdWatchedAt || 0, now) ? (user.todayAdsCount || 0) + 1 : 1;

      // Credit user
      const coinEarned = activeAd.reward * 10; // e.g. 1.5 multiplier -> 15 coins
      const nextCooldowns = { ...cooldowns, [activeAd.id]: Date.now() + activeAd.cooldownSeconds * 1000 };

      const updatedUser = {
        coins: user.coins + coinEarned,
        rewardPoints: user.rewardPoints + coinEarned,
        balance: user.balance + (activeAd.reward / 100),
        totalEarned: user.totalEarned + (activeAd.reward / 100),
        completedAdsCount: user.completedAdsCount + 1,
        xp: user.xp + 5,
        lastAdWatchedAt: now,
        todayAdsCount: nextTodayCount,
        adCooldowns: nextCooldowns
      };

      StoreDB.updateUser(user.uid, updatedUser);

      // Log transaction
      try {
        StoreDB.saveAdHistory(
          user.uid, 
          activeAd.network || 'TelegramBot', 
          activeAd.format, 
          activeAd.reward
        );
      } catch (dbErr) {
        console.error('[ADS] Error saving ad logs', dbErr);
      }

      // Cool down
      setCooldowns(nextCooldowns);
      try {
        localStorage.setItem(`te_adcooldowns_${user.uid}`, JSON.stringify(nextCooldowns));
      } catch (e) {}

      // Log session
      const nextHistory = [
        { id: `ad_log_${Date.now()}`, timestamp: Date.now(), reward: coinEarned, format: activeAd.format },
        ...adHistory
      ].slice(0, 10);
      setAdHistory(nextHistory);
      try {
        localStorage.setItem(`te_adhistory_${user.uid}`, JSON.stringify(nextHistory));
      } catch (e) {}

      showToast(`🎉 Claimed +${coinEarned} Coins successfully!`, 'success');
      onRefreshUser();
    } catch (e) {
      console.error('[ADS] Error claiming', e);
      showToast('Transacting error occurred.', 'error');
    } finally {
      setIsClaiming(false);
      setActiveAd(null);
      setAdState('idle');
    }
  };

  return (
    <div id="ads-center-layout" className="p-4 space-y-4">
      {/* Top Header Card */}
      <div className="bg-gradient-to-tr from-indigo-900/10 via-purple-950/25 to-slate-900 border border-purple-500/15 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-2 font-mono text-[10.5px] text-sky-400 font-bold uppercase tracking-wide">
          <Send className="w-3.5 h-3.5 text-sky-400 animate-pulse" /> Telegram Sponsor Bot Network
        </div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-1.5 leading-none">
          Sponsor Bots <Flame className="w-5 h-5 text-amber-500 animate-pulse fill-amber-500" />
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          টেলিগ্রাম স্পন্সর বিজ্ঞাপনের বোটগুলোতে জয়েন করে এডস দেখুন এবং আনলিমিটেড পয়েন্ট এবং কয়েন সংগ্রহ করুন!
        </p>

        {/* Small Analytics Row */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-550 block">Success Bot Tasks</span>
            <span className="text-sm font-extrabold text-slate-300 font-mono">{user.completedAdsCount} Bots Visited</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-550 block">Sponsor Coin Bonus</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">🟡 {user.completedAdsCount * 85} Coins</span>
          </div>
        </div>

        {/* Daily limit progress indicator */}
        <div className="mt-3 bg-indigo-950/10 border border-indigo-900/30 p-3 rounded-xl select-none text-left">
          <div className="flex justify-between items-center text-[10.5px] font-mono mb-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-400" /> Daily Limit (দৈনিক কাজের সীমা)
            </span>
            <span className="font-extrabold text-indigo-300">
              {todayCount} / {dailyLimit} Used ({remainingAds} left)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                remainingAds === 0 ? 'bg-rose-500' : remainingAds <= 5 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${Math.min(100, (todayCount / dailyLimit) * 100)}%` }}
            />
          </div>
          {remainingAds === 0 && (
            <p className="text-[9.5px] text-rose-455 italic mt-1.5 font-sans leading-none">
              ⚠️ Daily limit reached! Sponsor Center resets at UTC Midnight. Excellent work!
            </p>
          )}
        </div>
      </div>

      {/* Ads List Grid */}
      <h3 className="text-xs uppercase tracking-wider text-slate-500 font-mono">Sponsor Bot Campaigns</h3>
      <div className="grid grid-cols-1 gap-2.5">
        {dynamicAdOffers.map(offer => {
          const cdRemaining = cooldowns[offer.id] ? Math.ceil((cooldowns[offer.id] - Date.now()) / 1000) : 0;
          return (
            <div
              key={offer.id}
              className={`bg-slate-900/85 border rounded-2xl p-4 flex flex-col justify-between text-left transition relative overflow-hidden ${
                cdRemaining > 0 ? 'border-slate-850 opacity-60' : 'border-slate-800 hover:border-slate-750 hover:bg-slate-900/90'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1 pr-2">
                  <span className="text-[9.5px] font-mono p-1 px-1.5 rounded bg-slate-950 text-sky-400 font-bold border border-slate-850 uppercase inline-block">
                    🤖 TELEGRAM SPONSOR BOT
                  </span>
                  <h4 className="text-sm font-bold text-slate-200 mt-1.5 leading-snug">{offer.title}</h4>
                  <p className="text-[10px] text-slate-400 font-sans leading-normal">
                    বোট টি স্টার্ট করে টাস্ক ও এডস দেখুন। কাজ শেষে বোনাস কয়েন ক্লেইম করুন।
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-mono font-black text-amber-500 block">🟡 +{offer.reward * 10} Coins</span>
                  <span className="text-[9px] text-emerald-450 font-semibold uppercase block mt-0.5">Secure Link</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-850/60 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  Cooldown: 12 Hours
                </span>
                {cdRemaining > 0 ? (
                  <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 font-mono font-bold select-none">
                    <Clock className="w-3 h-3 text-amber-500" /> Locked: {formatCooldown(cdRemaining)}
                  </span>
                ) : (
                  <button
                    onClick={() => handleWatchAd(offer)}
                    className="py-1.5 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-550 hover:to-indigo-550 text-xs text-white font-bold rounded-xl cursor-pointer transition shadow flex items-center gap-1"
                  >
                    Open Bot & View Ads <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ad Watch History Log */}
      <div className="p-3 bg-slate-900/30 border border-slate-800/60 rounded-2xl">
        <h4 className="text-[11.5px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-400" /> Recent Bot Claims
        </h4>
        {adHistory.length === 0 ? (
          <p className="text-[10.5px] text-slate-500 italic text-center p-4">No bots claimed in this session yet.</p>
        ) : (
          <div className="space-y-1">
            {adHistory.map(log => (
              <div key={log.id} className="flex justify-between items-center text-[11px] py-1 px-2 hover:bg-slate-900/30 rounded">
                <span className="text-slate-400 capitalize">{log.format} Bot Visited</span>
                <span className="text-slate-500 font-mono text-[10px]">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-emerald-400 font-black">+ {log.reward} Pts</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Screen Ads Player Cinema Overlay */}
      <AnimatePresence>
        {activeAd && (() => {
          const currentAdDirectUrl = activeAd.directUrl || (settings as any).telegramBotAdUrl || settings.telegramBotUrl || 'https://t.me/TaskEarnProBot';

          return (
            <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col justify-between p-4 font-sans select-none overflow-hidden">
              {/* Top Bar with Timer and Close validation */}
              <div className="flex justify-between items-center bg-slate-900/60 border border-slate-800/50 p-2.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-sky-400 animate-pulse" />
                  <div>
                    <span className="text-[9px] text-slate-450 block font-mono">SPONSOR TELEGRAM CAMPAIGN</span>
                    <span className="text-xs text-white font-bold leading-tight truncate">{activeAd.title}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdComplete ? (
                    <span className="bg-emerald-500 text-slate-950 text-[10.5px] font-black px-2.5 py-1 rounded-lg animate-bounce font-mono">
                      READY
                    </span>
                  ) : (
                    <span className="bg-slate-950 border border-slate-850 font-mono text-amber-500 text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> {timerLeft}s
                    </span>
                  )}
                  <button
                    onClick={handleCloseAdEarly}
                    className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 font-extrabold text-xs text-slate-300 rounded border border-slate-700 cursor-pointer"
                  >
                    X
                  </button>
                </div>
              </div>

              {/* Central instruction with interactive redirect button */}
              <div className="flex flex-col items-center justify-center flex-1 py-10 relative">
                <div className="absolute inset-0 bg-indigo-500/5 mix-blend-color-dodge filter blur-3xl pointer-events-none" />
                
                <div className="w-full max-w-sm flex flex-col items-center justify-center space-y-6 text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center animate-pulse">
                    <Send className="w-8 h-8 text-sky-400" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase text-slate-200 tracking-wider">
                      Redirected to Sponsor Bot
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed px-2">
                      We categorized and redirected you to our sponsor's Telegram bot: <b className="text-sky-300">@{currentAdDirectUrl.split('/').pop()}</b>. Follow bot instructions (join channel or click start) to fulfill tasks.
                    </p>
                    <div className="p-3 bg-slate-900 border border-slate-850 rounded-2xl max-w-xs mx-auto text-center space-y-1.5 mt-2">
                      <p className="text-[11.5px] text-amber-400 font-bold leading-normal">
                        টেলিগ্রাম বিজ্ঞাপনে নিয়ে যাওয়া হয়েছে। নির্দেশনা মেনে বোটে জয়েন বা স্টার্ট করুন এবং পয়েন্ট পেতে নিচে দেওয়া টাইমার চলাকালীন অপেক্ষা করুন।
                      </p>
                    </div>
                  </div>

                  <a 
                    href={currentAdDirectUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full max-w-xs py-3.5 bg-sky-500 hover:bg-sky-450 text-slate-950 text-xs font-black rounded-2xl transition shadow-lg shadow-sky-500/15 flex items-center justify-center gap-1.5"
                  >
                    👉 Visit Sponsor Bot (টেলিগ্রাম এডস বোটে যান) <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Bottom confirmation Bar */}
              <div className="text-center space-y-2 p-2 max-w-sm mx-auto w-full">
                {adState === 'completed' && isAdComplete ? (
                  <button
                    onClick={handleClaimAdReward}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-emerald-500/20 cursor-pointer hover:opacity-95 transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-5 h-5 fill-slate-950 text-slate-950" /> CLAIM COIN REWARD (🟡 +{activeAd.reward * 10} Coins)
                  </button>
                ) : (
                  <div className="w-full py-3 bg-slate-900 border border-slate-850 rounded-2xl text-slate-500 font-bold text-xs text-center px-3 leading-tight select-none">
                    🔒 Complete {timerLeft}s remaining on active sponsor bot viewing to unlock claim
                  </div>
                )}
                <span className="text-[9.5px] font-mono text-slate-600 block flex items-center justify-center gap-1 select-none">
                  <ShieldAlert className="w-3.5 h-3.5 inline text-rose-500" /> SECURE PROTECTION SHIELD ENFORCED
                </span>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
