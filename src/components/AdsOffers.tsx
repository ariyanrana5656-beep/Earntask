import { useState, useEffect, useRef } from 'react';
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

interface NativelyInjectedAdProps {
  scriptHtml: string;
  directUrl?: string;
  network: string;
  format: string;
  onStateChange: (state: 'loading' | 'loaded' | 'failed' | 'completed') => void;
}

function NativelyInjectedAd({ 
  scriptHtml, 
  directUrl, 
  network, 
  format,
  onStateChange 
}: NativelyInjectedAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadAttempt, setLoadAttempt] = useState(1);
  const [isBlockedOrDelayed, setIsBlockedOrDelayed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !scriptHtml) return;

    setIsLoading(true);
    setIsBlockedOrDelayed(false);
    onStateChange('loading');

    // 1. Security Check & Whitelist Filtering
    const networkLower = network?.trim().toLowerCase() || '';
    const ALLOWED_NETWORKS = ['monetag', 'gigapub', 'adsterra', 'propeller'];
    
    if (!ALLOWED_NETWORKS.includes(networkLower)) {
      const errMsg = `Rejected untrusted network script: "${networkLower}". Only whitelisted ad platforms are permitted.`;
      console.error('[ADS] Error', errMsg);
      setIsBlockedOrDelayed(true);
      setIsLoading(false);
      onStateChange('failed');
      return;
    }

    // 2. Safely Parse Script HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(scriptHtml, 'text/html');
    const scriptTags = Array.from(doc.querySelectorAll('script'));

    if (scriptTags.length === 0) {
      const errMsg = 'Failed parsing SDK Script node. Verify your configuration code.';
      console.error('[ADS] Error', errMsg);
      setIsBlockedOrDelayed(true);
      setIsLoading(false);
      onStateChange('failed');
      return;
    }

    // 3. Extract Zone/Placement ID across all scripts
    let resolvedZoneId = '';
    
    for (const script of scriptTags) {
      const zoneId = script.getAttribute('data-zone') || script.getAttribute('data-placement') || '';
      const srcVal = script.getAttribute('src') || '';
      const queryZone = srcVal.match(/[?&](id|z|zone|placement)=([^&#]+)/);
      const textZone = script.textContent ? script.textContent.match(/zoneId|placementId|id['"]?\s*:\s*['"]?(\d+)/i) : null;
      
      const foundId = zoneId || (queryZone ? queryZone[2] : (textZone ? textZone[1] : ''));
      if (foundId) {
        resolvedZoneId = foundId;
        break;
      }
    }
    
    // Check for Adsterra special key pattern or propeller
    if (!resolvedZoneId) {
      for (const script of scriptTags) {
        const textContent = script.textContent || '';
        const adsterraKey = textContent.match(/'key'\s*:\s*['"](\w+)['"]/i);
        if (adsterraKey) {
          resolvedZoneId = adsterraKey[1];
          break;
        }
        const src = script.getAttribute('src') || '';
        const folderMatch = src.match(/highperformanceformat\.com\/([a-zA-Z0-9]+)\/invoke\.js/);
        if (folderMatch) {
          resolvedZoneId = folderMatch[1];
          break;
        }
      }
    }

    // Default fallback to prevent crash, especially for mock / preview settings or specific networks
    if (!resolvedZoneId) {
      if (networkLower === 'adsterra') {
        resolvedZoneId = 'adsterra_placement';
      } else if (networkLower === 'propeller') {
        resolvedZoneId = 'propeller_placement';
      } else {
        resolvedZoneId = 'custom_placement';
      }
    }

    console.log('[ADS] Zone Found', resolvedZoneId);

    // 4. Map Container Automatically (Ad Container Manager)
    let sdkTargetId = '';
    for (const script of scriptTags) {
      const dataSdk = script.getAttribute('data-sdk');
      if (dataSdk) {
        sdkTargetId = dataSdk;
        break;
      }
    }
    if (!sdkTargetId) {
      sdkTargetId = `show_${resolvedZoneId}`;
    }
    
    // Clear the container ref
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    // Append the mapped custom targeting container
    const targetingDiv = document.createElement('div');
    targetingDiv.id = sdkTargetId;
    targetingDiv.className = "w-full min-h-[140px] flex items-center justify-center text-center";
    containerRef.current?.appendChild(targetingDiv);

    // Confirm container exists
    const containerExists = document.getElementById(sdkTargetId);
    if (!containerExists) {
      console.error('[ADS] Error', `Target container #${sdkTargetId} could not be mounted in DOM.`);
      setIsBlockedOrDelayed(true);
      setIsLoading(false);
      onStateChange('failed');
      return;
    }

    // 5. Injected script tag creation & loading handles
    let loadTimeout: NodeJS.Timeout;
    let fallbackCleanup: (() => void) | null = null;

    const startLoadingInstance = () => {
      console.log(`[ADS] Scripts Injected (Attempt ${loadAttempt}/3) for Zone: ${resolvedZoneId}`);
      
      const clonedScripts: HTMLScriptElement[] = [];

      scriptTags.forEach((sTag, idx) => {
        const newScript = document.createElement('script');
        newScript.setAttribute('data-ad-injected', 'true');
        newScript.setAttribute('data-attempt', loadAttempt.toString());
        newScript.setAttribute('data-index', idx.toString());

        // Assign attributes
        Array.from(sTag.attributes).forEach(attr => {
          let val = attr.value;
          if (val.startsWith('//')) {
            val = 'https:' + val;
          }
          newScript.setAttribute(attr.name, val);
        });

        if (sTag.textContent) {
          newScript.textContent = sTag.textContent;
        } else {
          newScript.async = true;
        }

        const scriptSrc = sTag.getAttribute('src') || '';

        // If the script has a source, bind onload/onerror to help detect SDK load success
        if (scriptSrc) {
          newScript.onload = () => {
            console.log(`[ADS] SDK Script loaded: ${scriptSrc} (${networkLower})`);
          };
          newScript.onerror = () => {
            console.warn(`[ADS] Error loading script: ${scriptSrc}`);
          };
        }

        try {
          containerRef.current?.appendChild(newScript);
          clonedScripts.push(newScript);
        } catch (err) {
          console.warn('[ADS] Error attaching script context', err);
        }
      });

      // Start render polling to see if the ad content becomes active
      let checksCount = 0;
      const renderPoll = setInterval(() => {
        checksCount++;
        
        const targetEl = document.getElementById(sdkTargetId);
        
        // Verify targeted node contains nested DOM nodes or if there is general frame content inside containerRef
        const hasTargetInnerNodes = targetEl && targetEl.children.length > 0;
        
        const hasContainerOtherNodes = containerRef.current && (
          containerRef.current.querySelector('iframe') || 
          containerRef.current.querySelector('a') ||
          containerRef.current.querySelectorAll(':not(script)').length > 1
        );

        const isMonetagActive = (window as any).hasOwnProperty('Monetag') || (window as any).hasOwnProperty('show_' + resolvedZoneId);
        const isGigaPubActive = (window as any).hasOwnProperty('giga') || (window as any).hasOwnProperty('gp_' + resolvedZoneId);
        const isAdsterraActive = networkLower === 'adsterra' && (window as any).hasOwnProperty('atOptions');

        if (hasTargetInnerNodes || hasContainerOtherNodes || isMonetagActive || isGigaPubActive || isAdsterraActive) {
          clearInterval(renderPoll);
          clearTimeout(loadTimeout);
          setIsLoading(false);
          console.log('[ADS] Ad Rendered Successfully', format);
          onStateChange('loaded');
        } else if (checksCount >= 25) { // 5 seconds polling limit
          clearInterval(renderPoll);
          console.warn('[ADS] Polling Timeout', `Ad elements failed to populate targeting DOM. Attempt ${loadAttempt} failed.`);
          handleLoadFailure();
        }
      }, 200);

      fallbackCleanup = () => clearInterval(renderPoll);

      // Safeguard total loader runtime per attempt
      loadTimeout = setTimeout(() => {
        console.warn('[ADS] Error', `Timeout reached loading ${networkLower} ad.`);
        handleLoadFailure();
      }, 6000);
    };

    const handleLoadFailure = () => {
      clearTimeout(loadTimeout);
      if (fallbackCleanup) fallbackCleanup();

      if (loadAttempt < 3) {
        console.log(`[ADS] Retrying loading in 1.5 seconds... Active attempt: ${loadAttempt + 1}`);
        setTimeout(() => {
          setLoadAttempt(prev => prev + 1);
        }, 1500);
      } else {
        setIsLoading(false);
        setIsBlockedOrDelayed(true);
        onStateChange('failed');
      }
    };

    startLoadingInstance();

    return () => {
      clearTimeout(loadTimeout);
      if (fallbackCleanup) fallbackCleanup();
    };
  }, [scriptHtml, loadAttempt]);

  return (
    <div className="relative w-full min-h-[220px] flex flex-col items-center justify-center p-4 bg-[#090d16] border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
      {/* Loader */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090d16] z-10 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider animate-pulse text-center px-4">
            Connecting Ad Server (বিজ্ঞাপন লোড হচ্ছে) [Attempt {loadAttempt}/3]...
          </p>
        </div>
      )}

      {/* Blocked/Failed Panel */}
      {isBlockedOrDelayed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090d16]/98 z-10 p-4 space-y-3 overflow-y-auto scrollbar-none">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-mono font-black uppercase tracking-wider animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" /> Ad Blocked / Sandbox Restriction DETECTED
          </div>
          
          <div className="space-y-1 select-none text-center">
            <h5 className="text-[11.5px] font-black text-rose-400">
              ⚠️ বিজ্ঞাপন লোড হতে সমস্যা হচ্ছে? (Ad Loading Issue?)
            </h5>
            <p className="text-[10px] text-slate-400 leading-normal px-2">
              টেলিগ্রাম ইন-অ্যাপ আইফ্রেম আইসোলেশনের জন্য অথবা ব্রাউজারে <b>Ad-Blocker/Shields</b> থাকায় এড লোড হয়নি।
            </p>
          </div>

          <div className="w-full p-2.5 bg-slate-950 rounded-xl space-y-1 text-left text-[9.5px] text-slate-400 font-mono border border-slate-900 leading-tight">
            <p className="text-amber-400 font-bold text-[10px] uppercase tracking-wide">💡 Easy Solutions (সহজ সমাধান):</p>
            <p>1. Open App in Chrome or Safari (ক্লিক করুন ডান পাশের ৩-ডট মেনু &gt; Open in Browser) এবং সরাসরি বিজ্ঞাপন দেখুন।</p>
            <p>2. আপনার ফোনে কোনো এড-ব্লকার থাকলে তা বন্ধ করুন।</p>
            <p>3. iPhone-এ Safari Content Blocker বন্ধ রাখুন।</p>
          </div>

          {directUrl && (
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-[11px] font-black font-mono tracking-wide flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
            >
              🔗 Load Sponsor Direct Link (সরাসরি দেখুন)
            </a>
          )}
        </div>
      )}

      {/* Target Wrapper Mapped (For Mapped Custom ID injection by SDKs) */}
      <div 
        ref={containerRef} 
        id={`ad-container-${network?.trim().toLowerCase()}-${format?.trim().toLowerCase()}`}
        className="w-full h-full flex flex-col items-center justify-center min-h-[140px]" 
      />
    </div>
  );
}

export default function AdsOffers({ user, onRefreshUser, showToast }: AdsOffersProps) {
  const [activeAd, setActiveAd] = useState<AdOffer | null>(null);
  const [timerLeft, setTimerLeft] = useState(0);
  const [isAdComplete, setIsAdComplete] = useState(false);
  const [adHistory, setAdHistory] = useState<{ id: string; timestamp: number; reward: number; format: string }[]>([]);
  const [cooldowns, setCooldowns] = useState<{ [adId: string]: number }>({});

  const [settings, setSettings] = useState(() => StoreDB.getSettings());
  const [adNetworks, setAdNetworks] = useState(() => StoreDB.getAdNetworks());
  const [adState, setAdState] = useState<'idle' | 'loading' | 'loaded' | 'failed' | 'completed'>('idle');

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
    const unsubAdNetworks = StoreDB.subscribeToAdNetworks((updated) => {
      setAdNetworks(updated);
    });
    return () => {
      unsubSettings();
      unsubAdNetworks();
    };
  }, []);

  // Merge the active configurations from modern Firebase adNetwork settings block
  const dynamicAdOffers: AdOffer[] = (() => {
    const list: AdOffer[] = [];
    
    // 1. If Monetag is enabled, populate official production placements dynamically
    if (adNetworks.monetag?.enabled) {
      if (adNetworks.monetag.bannerZoneId) {
        list.push({
          id: 'monetag_prod_banner',
          network: 'monetag',
          format: 'banner',
          reward: 1.5,
          cooldownSeconds: 20,
          title: 'Monetag CPM Banner (বিজ্ঞাপন ব্যানার)',
          sdkScript: `<script src="https://libtl.com/sdk.js" data-zone="${adNetworks.monetag.bannerZoneId}" data-sdk="show_${adNetworks.monetag.bannerZoneId}"></script>`,
          directUrl: `https://delivery.monetag.com/direct/link?id=${adNetworks.monetag.bannerZoneId}`
        });
      }
      if (adNetworks.monetag.rewardedZoneId) {
        list.push({
          id: 'monetag_prod_rewarded',
          network: 'monetag',
          format: 'rewarded',
          reward: 4.5,
          cooldownSeconds: 45,
          title: 'Monetag Premium Rewarded Video (ভিডিও বিজ্ঞাপন)',
          sdkScript: `<script src="https://libtl.com/sdk.js" data-zone="${adNetworks.monetag.rewardedZoneId}" data-sdk="show_${adNetworks.monetag.rewardedZoneId}"></script>`,
          directUrl: `https://delivery.monetag.com/direct/link?id=${adNetworks.monetag.rewardedZoneId}`
        });
      }
      if (adNetworks.monetag.interstitialZoneId) {
        list.push({
          id: 'monetag_prod_interstitial',
          network: 'monetag',
          format: 'interstitial',
          reward: 3.0,
          cooldownSeconds: 30,
          title: 'Monetag Interstitial Unit (পপ-আপ বিজ্ঞাপন)',
          sdkScript: `<script src="https://libtl.com/sdk.js" data-zone="${adNetworks.monetag.interstitialZoneId}" data-sdk="show_${adNetworks.monetag.interstitialZoneId}"></script>`,
          directUrl: `https://delivery.monetag.com/direct/link?id=${adNetworks.monetag.interstitialZoneId}`
        });
      }
    }

    // 2. If GigaPub is enabled, populate official GigaPub production placements dynamically
    if (adNetworks.gigapub?.enabled) {
      if (adNetworks.gigapub.bannerPlacementId) {
        list.push({
          id: 'gigapub_prod_banner',
          network: 'gigapub',
          format: 'banner',
          reward: 1.8,
          cooldownSeconds: 25,
          title: 'GigaPub High-Fill Banner (জিকাপাব ব্যানার)',
          sdkScript: `<script src="https://giga.pub/sdk.js" data-placement="${adNetworks.gigapub.bannerPlacementId}" data-sdk="gp_${adNetworks.gigapub.bannerPlacementId}"></script>`
        });
      }
      if (adNetworks.gigapub.rewardedPlacementId) {
        list.push({
          id: 'gigapub_prod_rewarded',
          network: 'gigapub',
          format: 'rewarded',
          reward: 5.0,
          cooldownSeconds: 50,
          title: 'GigaPub Rewarded Smart Video (রিওয়ার্ডেড ভিডিও)',
          sdkScript: `<script src="https://giga.pub/sdk.js" data-placement="${adNetworks.gigapub.rewardedPlacementId}" data-sdk="gp_${adNetworks.gigapub.rewardedPlacementId}"></script>`
        });
      }
      if (adNetworks.gigapub.videoPlacementId) {
        list.push({
          id: 'gigapub_prod_video',
          network: 'gigapub',
          format: 'video',
          reward: 3.8,
          cooldownSeconds: 40,
          title: 'GigaPub Interactive Video Stream (ভিডিও রিল)',
          sdkScript: `<script src="https://giga.pub/sdk.js" data-placement="${adNetworks.gigapub.videoPlacementId}" data-sdk="gp_${adNetworks.gigapub.videoPlacementId}"></script>`
        });
      }
    }

    // 3. Keep any custom dynamic ads or presets active and filter inactive placements
    const customList = (settings.dynamicAds || []).filter(ad => ad.isActive !== false);
    if (customList.length > 0) {
      customList.forEach(customAd => {
        if (!list.some(item => item.id === customAd.id)) {
          list.push(customAd);
        }
      });
    }

    // 4. Default baseline fallback if absolutely none is enabled
    if (list.length === 0) {
      return AD_OFFERS;
    }

    return list;
  })();

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

  useEffect(() => {
    console.log('[ADS] Inventory Loaded', dynamicAdOffers);
  }, [dynamicAdOffers]);

  // Handle ticking down the active running ad simulation
  useEffect(() => {
    if (!activeAd || timerLeft <= 0) {
      if (activeAd && timerLeft === 0 && adState === 'loaded') {
        setIsAdComplete(true);
        setAdState('completed');
      }
      return;
    }

    // Only tick down if the ad has successfully finished loading in DOM
    if (adState !== 'loaded') return;

    const interval = setInterval(() => {
      setTimerLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerLeft, activeAd, adState]);

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

  const getAdScriptOfOffer = (offer: AdOffer) => {
    if (offer.sdkScript) return offer.sdkScript;

    const net = offer.network?.trim().toLowerCase();
    const resolvedZoneId = (net === 'monetag' ? adNetworks.monetag?.bannerZoneId || adNetworks.monetag?.rewardedZoneId || adNetworks.monetag?.interstitialZoneId 
                         : net === 'gigapub' ? adNetworks.gigapub?.bannerPlacementId || adNetworks.gigapub?.rewardedPlacementId || adNetworks.gigapub?.videoPlacementId 
                         : '');

    if (net === 'monetag' && resolvedZoneId) {
      return `<script src="https://libtl.com/sdk.js" data-zone="${resolvedZoneId}" data-sdk="show_${resolvedZoneId}"></script>`;
    } else if (net === 'gigapub' && resolvedZoneId) {
      return `<script src="https://giga.pub/sdk.js" data-placement="${resolvedZoneId}" data-sdk="gp_${resolvedZoneId}"></script>`;
    } else if (net === 'adsterra') {
      const placementKey = settings.adAdsterraDirectUrl || "adsterra_fallback";
      return `<script type="text/javascript">
	atOptions = {
		'key' : '${placementKey}',
		'format' : 'iframe',
		'height' : 90,
		'width' : 728,
		'params' : {}
	};
</script>
<script type="text/javascript" src="//www.highperformanceformat.com/${placementKey}/invoke.js"></script>`;
    } else if (net === 'propeller') {
      const propellerZone = (settings as any).adPropellerZoneId || "123456";
      return `<script>(function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),'https://groscolorss.com/sdk.js',${propellerZone},document.body||document.documentElement)</script>`;
    }

    return '';
  };

  const handleWatchAd = (offer: AdOffer) => {
    // Check if daily limit was reached
    if (todayCount >= dailyLimit) {
      showToast(`Daily Limit reached! You can watch up to ${dailyLimit} ads per 24 hours. Reset at UTC midnight.`, 'error');
      return;
    }

    // Check if on cooldown
    if (cooldowns[offer.id] && cooldowns[offer.id] > Date.now()) {
      const remainSecs = Math.ceil((cooldowns[offer.id] - Date.now()) / 1000);
      showToast(`Ad is cooling down. Please wait ${remainSecs} seconds.`, 'error');
      return;
    }

    const scriptToUse = getAdScriptOfOffer(offer);
    if (!scriptToUse) {
      showToast('No active advertiser campaign or script configured for this banner.', 'error');
      return;
    }

    // Capture direct advertiser URL if configured
    let redirectUrl = offer.directUrl || '';
    if (!redirectUrl) {
      if (offer.network === 'monetag' && settings.adMonetagDirectUrl) {
        redirectUrl = settings.adMonetagDirectUrl;
      } else if (offer.network === 'adsterra' && settings.adAdsterraDirectUrl) {
        redirectUrl = settings.adAdsterraDirectUrl;
      } else if (offer.network === 'custom' && settings.adCustomDirectUrl) {
        redirectUrl = settings.adCustomDirectUrl;
      }
    }

    if (redirectUrl) {
      try {
        window.open(redirectUrl, '_blank');
        showToast('Sponsor advertisement page opened in a new tab! Browse to verify.', 'success');
      } catch (e) {
        console.warn("[ADS] Popup blocked opening automatically", e);
      }
    }

    setAdState('idle');
    setActiveAd({
      ...offer,
      sdkScript: scriptToUse
    });
    setTimerLeft(offer.format === 'rewarded' ? 15 : offer.format === 'interstitial' ? 8 : 5);
    setIsAdComplete(false);
  };

  const handleCloseAdEarly = () => {
    if (adState !== 'completed') {
      showToast('❌ Ad close callback received. You earned 0 coins. Anti-abuse active.', 'error');
      console.warn('[ADS] Error: Ad skipped or closed too early.');
    }
    setActiveAd(null);
    setAdState('idle');
  };

  const handleClaimAdReward = () => {
    if (!activeAd || adState !== 'completed') return;

    try {
      const now = Date.now();
      const nextTodayCount = isSameDay(user.lastAdWatchedAt || 0, now) ? (user.todayAdsCount || 0) + 1 : 1;

      // Credit user
      const coinEarned = activeAd.reward * 10; // e.g. 7.5 premium watched -> 75 coins
      const updatedUser = {
        coins: user.coins + coinEarned,
        rewardPoints: user.rewardPoints + coinEarned,
        balance: user.balance + (activeAd.reward / 100), // $0.075 cents
        totalEarned: user.totalEarned + (activeAd.reward / 100),
        completedAdsCount: user.completedAdsCount + 1,
        xp: user.xp + 5,
        lastAdWatchedAt: now,
        todayAdsCount: nextTodayCount
      };

      console.log('[ADS] Reward Granted', activeAd.reward);
      
      StoreDB.updateUser(user.uid, updatedUser);

      // Save to Firebase general adHistory log collection
      try {
        StoreDB.saveAdHistory(
          user.uid, 
          activeAd.network as any, 
          activeAd.format, 
          activeAd.reward
        );
      } catch (dbErr) {
        console.error('[ADS] Error storing secure transaction', dbErr);
      }

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

      showToast(`🎉 Reward claim successful! Received +${coinEarned} Coins.`, 'success');
      onRefreshUser();
    } catch (e) {
      console.error('[ADS] Error during reward transaction processing', e);
      showToast('Transaction processing error. Try again.', 'error');
    } finally {
      setActiveAd(null);
      setAdState('idle');
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

        {/* Daily limit progress indicator */}
        <div className="mt-3 bg-indigo-950/10 border border-indigo-900/30 p-3 rounded-xl select-none text-left">
          <div className="flex justify-between items-center text-[10.5px] font-mono mb-1.5">
            <span className="text-slate-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-indigo-400" /> Daily Limit Progress (দৈনিক বিজ্ঞাপন সীমা)
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
              ⚠️ Daily limit reached! Ad center access resets at UTC Midnight. Excellent work!
            </p>
          )}
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
            </div>

            {/* Live Video / Custom Sdk Embed Screen */}
            <div className="flex flex-col items-center justify-center flex-1 py-12 relative animate-fade">
              <div className="absolute inset-0 bg-indigo-500/5 mix-blend-color-dodge filter blur-3xl pointer-events-none" />
              
              {/* If Direct URL configuration is present, show direct advertiser redirect click help block */}
              {(() => {
                let currentAdDirectUrl = activeAd.directUrl || '';
                let currentAdSdkScript = activeAd.sdkScript || '';

                if (!currentAdDirectUrl) {
                  if (activeAd.network === 'monetag') {
                    currentAdDirectUrl = settings?.adMonetagDirectUrl || '';
                  } else if (activeAd.network === 'adsterra') {
                    currentAdDirectUrl = settings?.adAdsterraDirectUrl || '';
                  } else if (activeAd.network === 'custom') {
                    currentAdDirectUrl = settings?.adCustomDirectUrl || '';
                  }
                }

                if (!currentAdSdkScript) {
                  currentAdSdkScript = getAdScriptOfOffer(activeAd);
                }

                // Sanitize and resolve protocol-relative URLs (e.g. //libtl.com -> https://libtl.com)
                let preparedSdkScript = currentAdSdkScript;
                if (preparedSdkScript) {
                  preparedSdkScript = preparedSdkScript.replace(
                    /(src=['"])\/\/([^'"]+)/g,
                    '$1https://$2'
                  );
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

                    {preparedSdkScript ? (
                      <div className="w-full max-w-sm px-2">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1 px-1">
                          <span>⚡️ HIGH-CPM LIVE AD SDK WORKSPACE</span>
                          <span className="text-emerald-400 font-bold animate-pulse">● LIVE RUNNING</span>
                        </div>
                        <NativelyInjectedAd 
                          scriptHtml={preparedSdkScript} 
                          directUrl={currentAdDirectUrl}
                          network={activeAd.network}
                          format={activeAd.format}
                          onStateChange={(state) => setAdState(state)}
                        />
                        <p className="text-[9px] text-slate-600 text-center mt-1.5 font-mono leading-none">PROCESSED VIA NATIVE ACTIVE WINDOW INTEGRATION BY AD AUTHORITIES</p>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center justify-center space-y-2">
                        <div className="w-full max-w-xs rounded-2xl bg-amber-950/20 border border-amber-500/20 p-4 text-center">
                          <p className="text-sm font-bold text-amber-400">⚠️ Live Ad Script Missing</p>
                          <p className="text-[11px] text-slate-400 mt-1">Please enter a valid active script tag or zone ID in the Admin Panel to display ads.</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Bottom confirmation Bar */}
            <div className="text-center space-y-2 p-2">
              {adState === 'completed' && isAdComplete ? (
                <button
                  onClick={handleClaimAdReward}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 cursor-pointer hover:opacity-95 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-5 h-5 fill-slate-950" /> CLAIM COIN REWARD (🟡 +{activeAd.reward * 10} Pts)
                </button>
              ) : adState === 'failed' ? (
                <div className="w-full py-3.5 bg-rose-950/20 border border-rose-900/30 text-rose-400 font-bold text-center text-xs rounded-2xl p-2 select-none">
                  ❌ Ad Loading Failed. Reward is locked. Please click direct sponsor link above or open in browser.
                </div>
              ) : adState === 'loading' ? (
                <div className="w-full py-3.5 bg-slate-900 border border-slate-850 rounded-2xl text-indigo-400 font-bold text-xs animate-pulse text-center p-2">
                  ⏳ Connecting SDK Server... Please wait
                </div>
              ) : (
                <div className="w-full py-3.5 bg-slate-900 border border-slate-850 rounded-2xl text-slate-500 font-bold text-xs text-center p-2">
                  🔒 Complete {timerLeft}s remaining or let the SDK render to unlock Claim
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
