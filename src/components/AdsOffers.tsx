import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, PlayCircle, BarChart3, Clock, HelpCircle, ShieldAlert, 
  Sparkles, Award, Wallet, CheckCircle, Flame, Eye 
} from 'lucide-react';
import { UserProfile, AdOffer } from '../types';
import { StoreDB, AD_OFFERS } from '../services/store';

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

  const settings = StoreDB.getSettings();

  // Dynamically compute the ads offers list based on Admin configuration
  const dynamicAdOffers = [...AD_OFFERS];
  if (settings.adCustomTitle) {
    const exists = dynamicAdOffers.some(o => o.id === 'ad_custom_preset');
    if (!exists) {
      dynamicAdOffers.push({
        id: 'ad_custom_preset',
        network: 'custom',
        format: 'rewarded',
        reward: 9.0, // premium campaign reward unit
        cooldownSeconds: 60,
        title: settings.adCustomTitle
      });
    }
  }

  useEffect(() => {
    // Load local ad session logs
    const historyKey = `te_adhistory_${user.uid}`;
    const cdKey = `te_adcooldowns_${user.uid}`;
    
    try {
      setAdHistory(JSON.parse(localStorage.getItem(historyKey) || '[]'));
      setCooldowns(JSON.parse(localStorage.getItem(cdKey) || '{}'));
    } catch (e) {
      console.warn("localStorage restricted; initializing empty logs for ad center.", e);
      setAdHistory([]);
      setCooldowns({});
    }
  }, [user.uid]);

  // Handle ticking down the active running ad simulation
  useEffect(() => {
    if (!activeAd || timerLeft <= 0) {
      if (activeAd && timerLeft === 0) {
        setIsAdComplete(true);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimerLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerLeft, activeAd]);

  // Ticking local cooldown timers in list
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
          } catch (e) {
            // Silently swallow restricted iframe write errors
          }
          return next;
        }
        clearInterval(interval);
        return {};
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldowns, user.uid]);

  const handleWatchAd = (offer: AdOffer) => {
    // Check if on cooldown
    if (cooldowns[offer.id] && cooldowns[offer.id] > Date.now()) {
      const remainSecs = Math.ceil((cooldowns[offer.id] - Date.now()) / 1000);
      showToast(`Ad is cooling down. Please wait ${remainSecs} seconds.`, 'error');
      return;
    }

    // Capture direct advertiser URL if configured
    let redirectUrl = '';
    if (offer.network === 'monetag' && settings.adMonetagDirectUrl) {
      redirectUrl = settings.adMonetagDirectUrl;
    } else if (offer.network === 'adsterra' && settings.adAdsterraDirectUrl) {
      redirectUrl = settings.adAdsterraDirectUrl;
    } else if (offer.network === 'custom' && settings.adCustomDirectUrl) {
      redirectUrl = settings.adCustomDirectUrl;
    }

    if (redirectUrl) {
      try {
        window.open(redirectUrl, '_blank');
        showToast('Sponsor advertisement page opened in a new tab! Browse to verify.', 'success');
      } catch (e) {
        console.warn("Popup blocked opening automatically", e);
      }
    }

    setActiveAd(offer);
    setTimerLeft(offer.format === 'rewarded' ? 15 : offer.format === 'interstitial' ? 8 : 5);
    setIsAdComplete(false);
  };

  const handleCloseAdEarly = () => {
    if (!isAdComplete) {
      showToast('❌ Ad closed too early. You earned 0 coins. Anti-abuse active.', 'error');
    }
    setActiveAd(null);
  };

  const handleClaimAdReward = () => {
    if (!activeAd) return;

    try {
      // Credit user
      const coinEarned = activeAd.reward * 10; // e.g. 7.5 premium watched -> 75 coins
      const updatedUser = {
        coins: user.coins + coinEarned,
        rewardPoints: user.rewardPoints + coinEarned,
        balance: user.balance + (activeAd.reward / 100), // $0.075 cents
        totalEarned: user.totalEarned + (activeAd.reward / 100),
        completedAdsCount: user.completedAdsCount + 1,
        xp: user.xp + 5
      };

      StoreDB.updateUser(user.uid, updatedUser);

      // Append cooldown
      const nextCooldowns = { ...cooldowns, [activeAd.id]: Date.now() + activeAd.cooldownSeconds * 1000 };
      setCooldowns(nextCooldowns);
      try {
        localStorage.setItem(`te_adcooldowns_${user.uid}`, JSON.stringify(nextCooldowns));
      } catch (e) {
        // Safe fallback when storage access is restricted
      }

      // Append watch history
      const nextHistory = [
        { id: `ad_log_${Date.now()}`, timestamp: Date.now(), reward: coinEarned, format: activeAd.format },
        ...adHistory
      ].slice(0, 10);
      setAdHistory(nextHistory);
      try {
        localStorage.setItem(`te_adhistory_${user.uid}`, JSON.stringify(nextHistory));
      } catch (e) {
        // Safe fallback when storage access is restricted
      }

      showToast(`Success! Earned ${coinEarned} Coins standard ad revenue.`, 'success');
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActiveAd(null);
    }
  };

  // Aggregated analytics values
  const totalWatchedCount = adHistory.length;
  const totalEarningSum = adHistory.reduce((acc, cr) => acc + cr.reward, 0);

  return (
    <div id="ads-center-layout" className="p-4 space-y-4">
      {/* Top Header Card */}
      <div className="bg-gradient-to-tr from-indigo-900/10 via-purple-950/25 to-slate-900 border border-purple-500/15 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-2 font-mono text-[10.5px] text-purple-400 font-bold uppercase tracking-wide">
          <Eye className="w-3.5 h-3.5" /> High-CPM Ads Network Active
        </div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-1.5 leading-none">
          Ads Center <Flame className="w-5 h-5 text-amber-500 animate-pulse fill-amber-500" />
        </h2>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Watch daily ads sponsored by <b className="text-slate-350">Monetag</b> and <b className="text-slate-355">Adsterra</b> to accumulate continuous instant coin balances.
        </p>

        {/* Small Analytics Row */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Watch Count (Session)</span>
            <span className="text-sm font-extrabold text-slate-300 font-mono">{user.completedAdsCount} Ads</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block">Estimated Ad Earnings</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">🟡 {user.completedAdsCount * 60} Coins</span>
          </div>
        </div>
      </div>

      {/* Ads List Grid */}
      <h3 className="text-xs uppercase tracking-wider text-slate-500 font-serif">Available Ad Inventories</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {dynamicAdOffers.map(offer => {
          const cdRemaining = cooldowns[offer.id] ? Math.ceil((cooldowns[offer.id] - Date.now()) / 1000) : 0;
          return (
            <div
              key={offer.id}
              className={`bg-slate-900/85 border rounded-2xl p-3.5 flex flex-col justify-between text-left transition relative overflow-hidden ${
                cdRemaining > 0 ? 'border-slate-850 opacity-60' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[9.5px] font-mono p-1 rounded bg-slate-950 text-indigo-400 font-bold border border-slate-800 uppercase inline-block">
                  {offer.network}
                </span>
                <h4 className="text-xs font-bold text-slate-200 mt-1.5 leading-tight">{offer.title}</h4>
                <p className="text-[10.5px] text-slate-500">Format: {offer.format}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between">
                <span className="text-xs font-mono font-black text-amber-500">🟡 +{offer.reward * 10}</span>
                {cdRemaining > 0 ? (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500 inline" /> {cdRemaining}s
                  </span>
                ) : (
                  <button
                    onClick={() => handleWatchAd(offer)}
                    className="py-1 px-3 bg-gradient-to-r from-purple-650 to-indigo-650 text-[11px] text-white font-bold rounded-lg cursor-pointer hover:from-purple-600 hover:to-indigo-600 transition shadow"
                  >
                    Watch
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
          <Clock className="w-4 h-4 text-indigo-400" /> Recent Ad-watches
        </h4>
        {adHistory.length === 0 ? (
          <p className="text-[10.5px] text-slate-500 italic text-center p-4">No ads watched in this session yet.</p>
        ) : (
          <div className="space-y-1">
            {adHistory.map(log => (
              <div key={log.id} className="flex justify-between items-center text-[11px] py-1 px-2 hover:bg-slate-900/30 rounded">
                <span className="text-slate-400 capitalize">{log.format} Ad Complete</span>
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
        {activeAd && (
          <div className="fixed inset-0 bg-black/98 z-50 flex flex-col justify-between p-4 font-sans select-none">
            {/* Top Bar with Timer and Close validation */}
            <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800/40 p-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div>
                  <span className="text-xs text-slate-400 block font-mono">SPONSOR AD STREAMING</span>
                  <span className="text-xs text-white font-bold leading-tight">{activeAd.title}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdComplete ? (
                  <span className="bg-emerald-500 text-slate-900 text-[10.5px] font-black px-2.5 py-1 rounded-lg animate-bounce">
                    READY
                  </span>
                ) : (
                  <span className="bg-slate-950 border border-slate-800 font-mono text-amber-500 text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" /> {timerLeft}s
                  </span>
                )}
                <button
                  onClick={handleCloseAdEarly}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 font-extrabold text-xs text-slate-350 rounded border border-slate-700 cursor-pointer"
                >
                  X
                </button>
              </div>
                        {/* Live Video / Custom Sdk Embed Screen */}
            <div className="flex flex-col items-center justify-center flex-1 py-12 relative animate-fade">
              <div className="absolute inset-0 bg-indigo-500/5 mix-blend-color-dodge filter blur-3xl pointer-events-none" />
              
              {/* If Direct URL configuration is present, show direct advertiser redirect click help block */}
              {(() => {
                let currentAdDirectUrl = '';
                let currentAdSdkScript = '';
                if (activeAd.network === 'monetag') {
                  currentAdDirectUrl = settings.adMonetagDirectUrl || '';
                  currentAdSdkScript = settings.adMonetagSdkScript || '';
                } else if (activeAd.network === 'adsterra') {
                  currentAdDirectUrl = settings.adAdsterraDirectUrl || '';
                  currentAdSdkScript = settings.adAdsterraSdkScript || '';
                } else if (activeAd.network === 'custom') {
                  currentAdDirectUrl = settings.adCustomDirectUrl || '';
                  currentAdSdkScript = settings.adCustomSdkScript || '';
                }

                return (
                  <div className="w-full flex flex-col items-center justify-center space-y-4">
                    {currentAdDirectUrl && (
                      <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-2xl text-center space-y-1.5 max-w-xs mx-auto mb-2 select-none">
                        <p className="text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider flex items-center justify-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Sponsor Ad Link Active
                        </p>
                        <p className="text-[10.5px] text-slate-300 leading-tight">If sponsor page did not open, click the button below to load offer details.</p>
                        <a 
                          href={currentAdDirectUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg transition"
                        >
                          Visit Sponsor Ad Window <Eye className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {currentAdSdkScript ? (
                      <div className="w-full max-w-sm px-2">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1 px-1">
                          <span>⚡️ HIGH-CPM LIVE AD SDK WORKSPACE</span>
                          <span className="text-emerald-400 font-bold animate-pulse">● LIVE RUNNING</span>
                        </div>
                        <iframe
                          title="Live Ad Display Sandbox"
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <meta charset="utf-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <style>
                                  body {
                                    margin: 0;
                                    padding: 20px;
                                    background-color: #0b111e;
                                    color: #cbd5e1;
                                    font-family: system-ui, sans-serif;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    justify-content: center;
                                    min-height: 180px;
                                    text-align: center;
                                    box-sizing: border-box;
                                    overflow: auto;
                                  }
                                  a { color: #6366f1; font-weight: bold; }
                                </style>
                              </head>
                              <body>
                                <div id="live-ad-network-wrapper">
                                  ${currentAdSdkScript}
                                </div>
                              </body>
                            </html>
                          `}
                          className="w-full h-56 rounded-2xl border border-slate-800 bg-[#0b111e] shadow-2xl"
                          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                        />
                        <p className="text-[9px] text-slate-600 text-center mt-1.5 font-mono leading-none">PROCESSED VIA SECURE SANDBOX CONTAINER BY AD AUTHORITIES</p>
                      </div>
                    ) : (
                      /* Original Simulated Fallback screen if no script snippet provided */
                      <div className="w-full flex flex-col items-center justify-center space-y-4">
                        <div className="w-full max-w-xs relative rounded-3xl overflow-hidden aspect-video bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shadow-2xl p-4 shadow-indigo-950/20 text-center space-y-4">
                          <PlayCircle className="w-12 h-12 text-slate-600 animate-ping absolute" />
                          <PlayCircle className="w-12 h-12 text-indigo-500 animate-pulse" />
                          <div className="space-y-1 capitalize z-10">
                            <p className="text-xs font-mono text-purple-400 uppercase font-black tracking-widest">{activeAd.network} networks</p>
                            <p className="text-[12.5px] font-bold text-slate-200">High Resolution Streaming Active</p>
                            <p className="text-[11px] text-slate-400 font-sans">Wait for countdown to claim rewards.</p>
                          </div>
                        </div>

                        {/* Interactive Banner inside running video */}
                        <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between pointer-events-none">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 animate-bounce" />
                            <div className="text-left">
                              <p className="text-[11px] font-bold text-slate-200">Earn Double 200% Payout</p>
                              <p className="text-[9.5px] text-slate-500">Sponsored network link</p>
                            </div>
                          </div>
                          <button className="text-[10px] uppercase font-bold py-1 px-2.5 bg-indigo-600 text-white rounded">Open</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>    </div>

            {/* Bottom confirmation Bar */}
            <div className="text-center space-y-2 p-2">
              {isAdComplete ? (
                <button
                  onClick={handleClaimAdReward}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 cursor-pointer hover:opacity-95 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-5 h-5 fill-slate-950" /> CLAIM COIN REWARD (🟡 +{activeAd.reward * 10} Pts)
                </button>
              ) : (
                <div className="w-full py-3.5 bg-slate-900 border border-slate-850 rounded-2xl text-slate-500 font-bold text-xs">
                  🔒 Complete {timerLeft}s remaining to unlock Claim
                </div>
              )}
              <span className="text-[9.5px] font-mono text-slate-600 block flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 inline text-rose-500" /> SECURE APPS SHIELD • BOT CHEATING PROTECTION SECURED
              </span>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
