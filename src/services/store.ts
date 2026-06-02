import { 
  UserProfile, Task, TaskSubmission, AdOffer, SurveyOffer, 
  WithdrawalRequest, SupportTicket, LeaderboardEntry, Achievement, 
  PromoCode, Contest, AppNotification, Language, TelegramUser, VipTier, DepositRequest,
  TaskType, AdNetworkSettings, AdHistoryEntry
} from '../types';
import { 
  firestore, auth, handleFirestoreError, OperationType, 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, onSnapshot 
} from './firebase';

// Default tasks for task center
const DEFAULT_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Subscribe to TaskEarn Pro Channel',
    description: 'Join our official Telegram Channel to get latest earning updates and promo codes!',
    type: 'telegram_join',
    reward: 15.0,
    rewardPoints: 150,
    xpReward: 20,
    url: 'https://t.me/TaskEarnPro',
    verificationType: 'manual',
    cooldownHours: 0,
    dailyLimit: 1,
    countryFilters: [],
    deviceFilters: [],
    isActive: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 't2',
    title: 'Watch Ads & Win Big',
    description: 'Watch a rewarded video ad for 15 seconds to receive immediate coin credit.',
    type: 'watch_ad',
    reward: 8.0,
    rewardPoints: 80,
    xpReward: 10,
    url: '#ads',
    verificationType: 'auto',
    cooldownHours: 0.1, // 6 minutes
    dailyLimit: 20,
    countryFilters: [],
    deviceFilters: [],
    isActive: true,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 't3',
    title: 'Install Sponsor App',
    description: 'Download and install Cryptocoin App, open it for 30 seconds. New users only.',
    type: 'app_install',
    reward: 120.0,
    rewardPoints: 1200,
    xpReward: 150,
    url: 'https://play.google.com/store',
    verificationType: 'manual',
    cooldownHours: 48,
    dailyLimit: 1,
    countryFilters: [],
    deviceFilters: ['mobile'],
    isActive: true,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 't4',
    title: 'Subscribe to YouTube Earning Channel',
    description: 'Subscribe to our major sponsor and hit liked on the latest video.',
    type: 'youtube_subscribe',
    reward: 25.0,
    rewardPoints: 250,
    xpReward: 40,
    url: 'https://youtube.com',
    verificationType: 'manual',
    cooldownHours: 0,
    dailyLimit: 1,
    countryFilters: [],
    deviceFilters: [],
    isActive: true,
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 't5',
    title: 'Visit Tech Blog - 30s',
    description: 'Read the latest tech blog post and stay for 30 seconds. Automated check.',
    type: 'website_visit',
    reward: 10.0,
    rewardPoints: 100,
    xpReward: 15,
    url: 'https://example.com/blog',
    verificationType: 'auto',
    cooldownHours: 24,
    dailyLimit: 1,
    countryFilters: [],
    deviceFilters: [],
    isActive: true,
    createdAt: Date.now(),
  }
];

// Achievements & VIP Tiers Definition
const DEFAULT_VIP_TIERS: VipTier[] = [
  { level: 0, name: 'Standard Earner', multi: '1.0x', desc: 'No multiplier benefits.', cost: 0 },
  { level: 1, name: 'Bronze Supporter', multi: '1.1x', desc: 'Direct 10% bonus payouts.', cost: 1500 },
  { level: 2, name: 'Silver Champ', multi: '1.2x', desc: '20% extra coins on ads & video tasks.', cost: 3000 },
  { level: 3, name: 'Gold VIP partner', multi: '1.3x', desc: '30% extra coins & automated support.', cost: 5000 },
  { level: 4, name: 'Platinum Tycoon', multi: '1.4x', desc: '40% extra earnings & priority payout queues.', cost: 10000 },
  { level: 5, name: 'Diamond Legend', multi: '1.5x', desc: '50% extra coins, exclusive tasks access.', cost: 25000 }
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_1',
    title: 'Earning Rookie',
    description: 'Complete your first 5 tasks successfully',
    targetCount: 5,
    metric: 'tasks',
    rewardCoins: 50,
    rewardXP: 100,
  },
  {
    id: 'ach_2',
    title: 'Ads Enthusiast',
    description: 'Watch 25 rewarded ads',
    targetCount: 25,
    metric: 'ads',
    rewardCoins: 100,
    rewardXP: 200,
  },
  {
    id: 'ach_3',
    title: 'Master Referrer',
    description: 'Invite 10 active referrals',
    targetCount: 10,
    metric: 'referrals',
    rewardCoins: 250,
    rewardXP: 500,
  },
  {
    id: 'ach_4',
    title: 'Survey Champ',
    description: 'Complete 3 survey walls',
    targetCount: 3,
    metric: 'surveys',
    rewardCoins: 150,
    rewardXP: 300,
  },
  {
    id: 'ach_5',
    title: 'Wealthbuilder',
    description: 'Accumulate a total of $10 worth of coins',
    targetCount: 10000,
    metric: 'earnings',
    rewardCoins: 500,
    rewardXP: 1000,
  }
];

const ACHIEVEMENTS_LIST: Achievement[] = DEFAULT_ACHIEVEMENTS;


// Default dynamic configuration
const DEFAULT_CONTESTS: Contest[] = [
  {
    id: 'c1',
    title: 'Weekly Task Contest',
    type: 'tasks',
    startDate: Date.now() - 86400000 * 3,
    endDate: Date.now() + 86400000 * 4,
    prizePool: 5000,
    isActive: true,
  },
  {
    id: 'c2',
    title: 'Mega Referral Race',
    type: 'referral',
    startDate: Date.now() - 86400000 * 1,
    endDate: Date.now() + 86400000 * 15,
    prizePool: 25000,
    isActive: true,
  }
];

// Ad Network offers
export const AD_OFFERS: AdOffer[] = [
  { id: 'ad_bot_monetag', network: 'monetag', format: 'rewarded', reward: 8.5, cooldownSeconds: 43200, title: '🎁 Mega Monetag Ad Earn Bot', directUrl: 'https://t.me/MonetagAdEarn1_bot' },
  { id: 'ad_bot_clicks', network: 'gigapub', format: 'popup', reward: 10.0, cooldownSeconds: 43200, title: '🔥 High-Paying Telegram Click Ad Bot', directUrl: 'https://t.me/GigaClickAd2_bot' },
  { id: 'ad_bot_sponsor', network: 'propeller', format: 'rewarded', reward: 6.0, cooldownSeconds: 43200, title: '👉 Official Sponsor Ads Bot', directUrl: 'https://t.me/OfficialSponsorAd7_bot' },
  { id: 'ad_bot_survey', network: 'adsterra', format: 'interstitial', reward: 12.0, cooldownSeconds: 43200, title: '💎 Adsterra Daily Premium Claims Bot', directUrl: 'https://t.me/AdsterraClaim9_bot' },
  { id: 'ad_bot_promoter', network: 'custom', format: 'banner', reward: 5.0, cooldownSeconds: 43200, title: '🚀 Partner Promoters Advertisement Bot', directUrl: 'https://t.me/PartnerPromoRobot' }
];

// Survey CPA Wall
export const SURVEY_OFFERS: SurveyOffer[] = [
  { id: 's1', title: 'OpinionWorld General Survey', provider: 'CPA Offerwall', payout: 75.0, estimatedMinutes: 8, cooldownMinutes: 60, countryFilters: [] },
  { id: 's2', title: 'InBrain Quick Profile Check', provider: 'OpinionWalls', payout: 35.0, estimatedMinutes: 3, cooldownMinutes: 15, countryFilters: [] },
  { id: 's3', title: 'BitLabs Gamified Trivia Panel', provider: 'BitLabs Direct', payout: 150.0, estimatedMinutes: 12, cooldownMinutes: 120, countryFilters: [] }
];

// Mock Other Users for Leaderboard realism
const MOCK_LEADER_USERS: LeaderboardEntry[] = [
  { uid: 'u_lead1', username: 'CryptoKing_99', photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', totalEarned: 13950, referralCount: 78, xp: 4500, level: 12 },
  { uid: 'u_lead2', username: 'Nadim_bhai', photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', totalEarned: 11200, referralCount: 61, xp: 3800, level: 10 },
  { uid: 'u_lead3', username: 'Fatima_K', photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', totalEarned: 9550, referralCount: 43, xp: 2900, level: 8 },
  { uid: 'u_lead4', username: 'RanaStyle', photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', totalEarned: 8400, referralCount: 30, xp: 2100, level: 6 },
  { uid: 'u_lead5', username: 'Samira_Active', photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150', totalEarned: 7600, referralCount: 22, xp: 1950, level: 5 }
];

// Simulated Local Database State Interface
interface LocalDB {
  users: { [uid: string]: UserProfile };
  tasks: Task[];
  submissions: TaskSubmission[];
  withdrawals: WithdrawalRequest[];
  tickets: SupportTicket[];
  promoCodes: PromoCode[];
  contests: Contest[];
  notifications: AppNotification[];
  depositRequests?: DepositRequest[];
  systemSettings: {
    commissionL1: number;
    commissionL2: number;
    commissionL3: number;
    maintenanceMode: boolean;
    telegramBotUrl: string;
    announcement: string;
    minReferrals?: number;
    adMonetagDirectUrl?: string;
    adMonetagSdkScript?: string;
    adAdsterraDirectUrl?: string;
    adAdsterraSdkScript?: string;
    adCustomDirectUrl?: string;
    adCustomSdkScript?: string;
    adCustomTitle?: string;
    gameSectionEnabled?: boolean;
    gameSpinCost?: number;
    gameSpinRewardMultiplier?: number;
    supportLink?: string;
    depositWalletAddress?: string;
    minDepositAmount?: number;
    dynamicAds?: AdOffer[];
    dailyAdsLimit?: number;
  };
  vipTiers: VipTier[];
  achievements: Achievement[];
  adNetworks?: AdNetworkSettings;
}

const STORAGE_KEY = 'taskearn_pro_db_v2';

// Standard Initial state builder for DB
const buildInitialDB = (): LocalDB => {
  const adminId = 'tg_admin_user';
  const firstUser: UserProfile = {
    uid: adminId,
    telegramId: '2837492837',
    username: 'ariyanrana_pro',
    firstName: 'Ariyan',
    lastName: 'Rana',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    language: 'en',
    isPremium: true,
    joinedAt: Date.now() - 86400000 * 10,
    country: 'Bangladesh',
    balance: 450.0, // Preloaded dummy starting balances for cool gameplay demo!
    pendingBalance: 50.0,
    coins: 4500,
    rewardPoints: 850,
    totalEarned: 600.0,
    totalWithdrawn: 100.0,
    referralEarned: 45.0,
    referredBy: null,
    referralCode: 'ARIYAN88',
    referralCount: 15,
    completedTasksCount: 18,
    completedAdsCount: 35,
    completedSurveysCount: 4,
    xp: 2250,
    level: 7,
    vipLevel: 3, // GOLD VIP for developer
    rank: 4,
    lastCheckIn: Date.now() - 43200000, // half day ago
    checkInStreak: 5,
    isBanned: false
  };

  const code1: PromoCode = {
    id: 'promo_welcome',
    code: 'WELCOME500',
    rewardValue: 500, // 500 coins!
    usageLimit: 1000,
    usedCount: 124,
    expiresAt: Date.now() + 86400000 * 30,
    usedBy: []
  };

  const code2: PromoCode = {
    id: 'promo_vip',
    code: 'VIPGOLD',
    rewardValue: 2000,
    usageLimit: 50,
    usedCount: 2,
    expiresAt: Date.now() + 86400000 * 5,
    usedBy: []
  };

  const mockTickets: SupportTicket[] = [
    {
      id: 'ticket_1',
      userId: adminId,
      subject: 'Binance Payout Verification Delay',
      category: 'wallet',
      status: 'answered',
      createdAt: Date.now() - 4 * 3600000,
      messages: [
        { senderId: adminId, senderName: 'Ariyan Rana', text: 'Hi, my Binance Pay request for $10 is pending for over 6 hours. Can you check?', timestamp: Date.now() - 4 * 3600000 },
        { senderId: 'system_admin', senderName: 'TaskEarn Pro Agent', text: 'Hello Ariyan! Your payout request has been verified and approved. It was processed automatically. Please check your Binance app.', timestamp: Date.now() - 3.5 * 3600000 }
      ]
    }
  ];

  const mockWithdrawals: WithdrawalRequest[] = [
    {
      id: 'w_1',
      userId: adminId,
      username: 'ariyanrana_pro',
      method: 'BinancePay',
      accountDetails: 'ariyanpay@binance',
      amount: 45.0,
      status: 'approved',
      requestedAt: Date.now() - 86450000,
      processedAt: Date.now() - 86300000
    },
    {
      id: 'w_2',
      userId: adminId,
      username: 'ariyanrana_pro',
      method: 'Nagad',
      accountDetails: '+8801712345678',
      amount: 15.0,
      status: 'pending',
      requestedAt: Date.now() - 1200000
    }
  ];

  const mockSubmissions: TaskSubmission[] = [
    {
      id: 's_sub1',
      taskId: 't1',
      userId: adminId,
      telegramUsername: 'ariyanrana_pro',
      submittedAt: Date.now() - 86400000,
      status: 'approved',
      screenshotUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 's_sub2',
      taskId: 't4',
      userId: adminId,
      telegramUsername: 'ariyanrana_pro',
      submittedAt: Date.now() - 20000000,
      status: 'pending',
      screenshotUrl: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&q=80&w=400'
    }
  ];

  const mockNotifications: AppNotification[] = [
    {
      id: 'n_1',
      title: '🎁 Daily Streak Bonus Claimed!',
      message: 'You have claimed your Day 5 check-in reward. Keep the streak active to earn double coins on Day 7.',
      category: 'reward',
      timestamp: Date.now() - 3600000 * 2,
      read: false
    },
    {
      id: 'n_2',
      title: '🚀 Admin Update: Promo Code Live',
      message: 'New promo code WELCOME500 is now active. Redeem it immediately in the Promo screen for 500 Coins!',
      category: 'system',
      timestamp: Date.now() - 3600000 * 12,
      read: true
    }
  ];

  return {
    users: { [adminId]: firstUser },
    tasks: DEFAULT_TASKS,
    submissions: mockSubmissions,
    withdrawals: mockWithdrawals,
    tickets: mockTickets,
    promoCodes: [code1, code2],
    contests: DEFAULT_CONTESTS,
    notifications: mockNotifications,
    depositRequests: [],
    systemSettings: {
      commissionL1: 15,
      commissionL2: 7,
      commissionL3: 3,
      maintenanceMode: false,
      telegramBotUrl: 'https://t.me/TaskEarnProBot',
      announcement: '🔥 Massive Update! Binance auto-withdrawal processing is online. Earn double points on all YouTube Watch tasks today!',
      minReferrals: 0,
      adMonetagDirectUrl: '',
      adMonetagSdkScript: '',
      adAdsterraDirectUrl: '',
      adAdsterraSdkScript: '',
      adCustomDirectUrl: '',
      adCustomSdkScript: '',
      adCustomTitle: '',
      gameSectionEnabled: true,
      gameSpinCost: 100,
      gameSpinRewardMultiplier: 1.0,
      supportLink: 'https://t.me/TaskEarnProSupport',
      depositWalletAddress: 'bKash/Nagad/Rocket (Personal): +8801700112233\nBinance Pay UID: 73927492',
      minDepositAmount: 2.0,
      dailyAdsLimit: 25,
      dynamicAds: [
        { id: 'ad_monetag_banner_preset', network: 'monetag', format: 'banner', reward: 1.5, cooldownSeconds: 30, title: 'Instant Monetag Banner', sdkScript: `<script src='//libtl.com/sdk.js' data-zone='11082183' data-sdk='show_11082183'></script>`, isActive: true },
        { id: 'ad_adsterra_socialbar_preset', network: 'adsterra', format: 'popup', reward: 3.0, cooldownSeconds: 45, title: 'Adsterra Social Bar', sdkScript: '', directUrl: '', isActive: true },
        { id: 'ad_gigapub_preset', network: 'gigapub', format: 'rewarded', reward: 4.5, cooldownSeconds: 60, title: 'GigaPub High-Paying Video', sdkScript: '', directUrl: '', isActive: true }
      ]
    },
    vipTiers: DEFAULT_VIP_TIERS,
    achievements: DEFAULT_ACHIEVEMENTS,
    adNetworks: {
      monetag: {
        enabled: false,
        bannerZoneId: "",
        rewardedZoneId: "",
        interstitialZoneId: ""
      },
      gigapub: {
        enabled: false,
        bannerPlacementId: "",
        rewardedPlacementId: "",
        videoPlacementId: ""
      }
    }
  };
};

let memoryDB: LocalDB | null = null;

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("Storage access is restricted; falling back to in-memory store.", e);
    return null;
  }
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("Storage access is restricted; unable to write to localStorage.", e);
  }
};

export const getDB = (): LocalDB => {
  const cached = safeGetItem(STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const defaultDb = buildInitialDB();
      
      // Ensure EVERY key from LocalDB exists in our parsed object
      const keys: (keyof LocalDB)[] = [
        'users', 'tasks', 'submissions', 'withdrawals', 'tickets', 
        'promoCodes', 'contests', 'notifications', 'depositRequests', 
        'systemSettings', 'vipTiers', 'achievements'
      ];
      
      for (const key of keys) {
        if (parsed[key] === undefined || parsed[key] === null) {
          (parsed as any)[key] = defaultDb[key];
        }
      }
      
      // Ensure specific arrays/maps are never empty if vital
      if (!parsed.users || Object.keys(parsed.users).length === 0) parsed.users = defaultDb.users;
      if (!parsed.tasks || parsed.tasks.length === 0) parsed.tasks = DEFAULT_TASKS;
      if (!parsed.promoCodes || parsed.promoCodes.length === 0) parsed.promoCodes = defaultDb.promoCodes;
      if (!parsed.vipTiers || parsed.vipTiers.length === 0) parsed.vipTiers = DEFAULT_VIP_TIERS;
      if (!parsed.achievements || parsed.achievements.length === 0) parsed.achievements = DEFAULT_ACHIEVEMENTS;
      if (!parsed.depositRequests) parsed.depositRequests = [];
      
      // Deep merge system settings to prevent individual flag undefined errors
      parsed.systemSettings = { ...defaultDb.systemSettings, ...parsed.systemSettings };
      
      return parsed;
    } catch (err) {
      console.error("Error migrating/loading cached store:", err);
      if (memoryDB) return memoryDB;
      const defaultDb = buildInitialDB();
      saveDB(defaultDb);
      return defaultDb;
    }
  } else {
    if (memoryDB) return memoryDB;
    const defaultDb = buildInitialDB();
    saveDB(defaultDb);
    return defaultDb;
  }
};

export const saveDB = (db: LocalDB) => {
  memoryDB = db;
  safeSetItem(STORAGE_KEY, JSON.stringify(db));
};

// Helper to interact with the Local DB engine
export const StoreDB = {
  // Config
  getSettings: () => {
    const s = getDB().systemSettings;
    return {
      gameSectionEnabled: s.gameSectionEnabled !== undefined ? s.gameSectionEnabled : true,
      gameSpinCost: s.gameSpinCost !== undefined ? s.gameSpinCost : 100,
      gameSpinRewardMultiplier: s.gameSpinRewardMultiplier !== undefined ? s.gameSpinRewardMultiplier : 1.0,
      supportLink: s.supportLink || 'https://t.me/TaskEarnProSupport',
      dailyAdsLimit: s.dailyAdsLimit !== undefined ? s.dailyAdsLimit : 25,
      coinsPerDollar: (s as any).coinsPerDollar !== undefined ? (s as any).coinsPerDollar : 1000,
      telegramBotAdUrl: (s as any).telegramBotAdUrl || 'https://t.me/TaskEarnProBot',
      ...s,
      dynamicAds: (() => {
        const defaultAds = [
          { id: 'ad_monetag_banner_preset', network: 'monetag', format: 'banner', reward: 1.5, cooldownSeconds: 30, title: 'Instant Monetag Banner', sdkScript: `<script src='//libtl.com/sdk.js' data-zone='11082183' data-sdk='show_11082183'></script>`, isActive: true },
          { id: 'ad_adsterra_socialbar_preset', network: 'adsterra', format: 'popup', reward: 3.0, cooldownSeconds: 45, title: 'Adsterra Social Bar', sdkScript: '', directUrl: '', isActive: true },
          { id: 'ad_gigapub_preset', network: 'gigapub', format: 'rewarded', reward: 4.5, cooldownSeconds: 60, title: 'GigaPub High-Paying Video', sdkScript: '', directUrl: '', isActive: true }
        ];
        if (!s.dynamicAds || s.dynamicAds.length === 0) {
          return defaultAds;
        }
        const mergedList = [...s.dynamicAds];
        defaultAds.forEach(defAd => {
          if (!mergedList.some(item => item.id === defAd.id)) {
            mergedList.push(defAd);
          }
        });
        return mergedList;
      })()
    };
  },
  updateSettings: (settings: Partial<LocalDB['systemSettings']>) => {
    const dbState = getDB();
    dbState.systemSettings = { ...dbState.systemSettings, ...settings };
    saveDB(dbState);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'settings', 'system'), dbState.systemSettings, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'settings/system'));
    }
    return dbState.systemSettings;
  },

  getAdNetworks: (): AdNetworkSettings => {
    const db = getDB();
    const defaultAdNetworks: AdNetworkSettings = {
      monetag: {
        enabled: false,
        bannerZoneId: "",
        rewardedZoneId: "",
        interstitialZoneId: ""
      },
      gigapub: {
        enabled: false,
        bannerPlacementId: "",
        rewardedPlacementId: "",
        videoPlacementId: ""
      }
    };
    if (!db.adNetworks) {
      db.adNetworks = defaultAdNetworks;
    }
    // Deep merge to ensure all properties exist
    db.adNetworks = {
      monetag: { ...defaultAdNetworks.monetag, ...db.adNetworks.monetag },
      gigapub: { ...defaultAdNetworks.gigapub, ...db.adNetworks.gigapub }
    };
    return db.adNetworks;
  },

  updateAdNetworks: (adNetworks: Partial<AdNetworkSettings>) => {
    const dbState = getDB();
    const current = StoreDB.getAdNetworks();
    const next: AdNetworkSettings = {
      monetag: { ...current.monetag, ...adNetworks.monetag },
      gigapub: { ...current.gigapub, ...adNetworks.gigapub }
    };
    dbState.adNetworks = next;
    saveDB(dbState);

    console.log("[FIREBASE] Saving adNetworks settings to Firestore 'settings/adNetworks'.");
    if (auth.currentUser) {
      setDoc(doc(firestore, 'settings', 'adNetworks'), next, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, 'settings/adNetworks'));
    }
    return next;
  },

  subscribeToSettings: (callback: (settings: any) => void) => {
    let unsub = () => {};
    try {
      const docRef = doc(firestore, 'settings', 'system');
      unsub = onSnapshot(docRef, (snap) => {
        if (snap && snap.exists()) {
          const cloudSettings = snap.data();
          const dbState = getDB();
          dbState.systemSettings = { ...dbState.systemSettings, ...cloudSettings };
          saveDB(dbState);
          callback(StoreDB.getSettings());
        }
      }, (err) => {
        console.error("Settings real-time listener error", err);
      });
    } catch (e) {
      console.warn("Could not register settings real-time listener", e);
    }
    return unsub;
  },

  subscribeToAdNetworks: (callback: (adNetworks: any) => void) => {
    let unsub = () => {};
    try {
      const docRef = doc(firestore, 'settings', 'adNetworks');
      unsub = onSnapshot(docRef, (snap) => {
        if (snap && snap.exists()) {
          const cloudAdNetworks = snap.data();
          const dbState = getDB();
          dbState.adNetworks = { ...dbState.adNetworks, ...cloudAdNetworks };
          saveDB(dbState);
          callback(StoreDB.getAdNetworks());
        }
      }, (err) => {
        console.error("adNetworks real-time listener error", err);
      });
    } catch (e) {
      console.warn("Could not register adNetworks real-time listener", e);
    }
    return unsub;
  },

  saveAdHistory: async (userId: string, network: 'monetag' | 'gigapub', format: string, reward: number) => {
    const dbState = getDB();
    const entry = {
      id: `ad_history_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      network,
      format,
      reward,
      timestamp: Date.now()
    };
    
    // Store in local storage or memory history as well
    const historyKey = `te_adhistory_${userId}`;
    let hist: any[] = [];
    try {
      hist = JSON.parse(localStorage.getItem(historyKey) || '[]');
    } catch {
      hist = [];
    }
    // Record visual Coins earned (reward is standard dollars e.g. 0.08 -> coins earned is reward * 10 -> wait, let's keep it uniform so we have coins amount)
    const coinsEarned = Math.round(reward * 10);
    hist.unshift({ id: entry.id, timestamp: entry.timestamp, reward: coinsEarned, format });
    try {
      localStorage.setItem(historyKey, JSON.stringify(hist.slice(0, 10)));
    } catch (e) {
      // ignore
    }

    // Save to Firestore
    if (auth.currentUser) {
      setDoc(doc(firestore, 'adHistory', entry.id), entry)
        .then(() => {
          console.log(`[FIREBASE] Ad watch history registered in Firestore 'adHistory/${entry.id}'.`);
        })
        .catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `adHistory/${entry.id}`);
        });
    }
    
    return entry;
  },

  getEstimatedCountry: (): string => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        const lower = tz.toLowerCase();
        if (lower.includes('dhaka') || lower.includes('barisal') || lower.includes('chittagong') || lower.includes('sylhet')) return 'Bangladesh';
        if (lower.includes('calcutta') || lower.includes('kolkata') || lower.includes('delhi') || lower.includes('mumbai') || lower.includes('bangalore') || lower.includes('chennai') || lower.includes('india')) return 'India';
        if (lower.includes('karachi') || lower.includes('lahore') || lower.includes('islamabad') || lower.includes('pakistan')) return 'Pakistan';
        if (lower.includes('kathmandu')) return 'Nepal';
        if (lower.includes('colombo')) return 'Sri Lanka';
        if (lower.includes('riyadh') || lower.includes('jeddah') || lower.includes('saudi')) return 'Saudi Arabia';
        if (lower.includes('dubai') || lower.includes('abudhabi') || lower.includes('emirates')) return 'United Arab Emirates';
        if (lower.includes('london') || lower.includes('belfast') || lower.includes('dublin')) return 'United Kingdom';
        if (lower.includes('berlin') || lower.includes('paris') || lower.includes('rome') || lower.includes('madrid')) return 'Europe';
        if (lower.includes('america') || lower.includes('new_york') || lower.includes('chicago') || lower.includes('los_angeles')) return 'United States';
      }
    } catch (e) {}

    // Fallback to local user language settings
    try {
      const lang = (navigator.language || '').toLowerCase();
      if (lang.startsWith('bn')) return 'Bangladesh';
      if (lang.startsWith('hi')) return 'India';
      if (lang.startsWith('ar')) return 'United Arab Emirates';
      if (lang.startsWith('ur')) return 'Pakistan';
    } catch (e) {}

    return 'Bangladesh';
  },

  // Users
  getUser: (uid: string): UserProfile | null => {
    const db = getDB();
    return db.users[uid] || null;
  },
  
  createOrUpdateTelegramUser: (tgUser: TelegramUser, referralCodeInput?: string): UserProfile => {
    const db = getDB();
    const uid = `tg_${tgUser.id}`;
    if (db.users[uid]) {
      // Update existing
      db.users[uid].username = tgUser.username || `user_${tgUser.id}`;
      db.users[uid].firstName = tgUser.first_name;
      db.users[uid].lastName = tgUser.last_name || '';
      if (tgUser.photo_url) db.users[uid].photoUrl = tgUser.photo_url;
      db.users[uid].isPremium = !!tgUser.is_premium;
      saveDB(db);
      return db.users[uid];
    }

    // Process referrer if specified and exists
    let referredBy: string | null = null;
    if (referralCodeInput) {
      const referrerUser = Object.values(db.users).find(
        u => u.referralCode.toLowerCase() === referralCodeInput.trim().toLowerCase()
      );
      if (referrerUser) {
        referredBy = referrerUser.uid;
        referrerUser.referralCount += 1;
        // Credit registration lead invite reward
        referrerUser.coins += 200; // 200 coins for invite
        referrerUser.xp += 50;
        db.users[referrerUser.uid] = referrerUser;
      }
    }

    // Creating profile
    const refCode = tgUser.username ? tgUser.username.slice(0, 6).toUpperCase() + Math.floor(Math.random() * 90 + 10) : `TE${Math.floor(100000 + Math.random() * 900000)}`;
    const newProfile: UserProfile = {
      uid,
      telegramId: tgUser.id,
      username: tgUser.username || `user_${tgUser.id}`,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name || '',
      photoUrl: tgUser.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${tgUser.id}`,
      language: (tgUser.language_code === 'bn' || tgUser.language_code === 'ar' || tgUser.language_code === 'hi') ? tgUser.language_code as Language : 'en',
      isPremium: !!tgUser.is_premium,
      joinedAt: Date.now(),
      country: StoreDB.getEstimatedCountry(),
      balance: 1.0, // Registration gift: $1.00 or 100 coins
      pendingBalance: 0,
      coins: 1000,
      rewardPoints: 100,
      totalEarned: 1.0,
      totalWithdrawn: 0,
      referralEarned: 0,
      referredBy,
      referralCode: refCode,
      referralCount: 0,
      completedTasksCount: 0,
      completedAdsCount: 0,
      completedSurveysCount: 0,
      xp: 10,
      level: 1,
      vipLevel: 0,
      rank: Object.keys(db.users).length + 5,
      lastCheckIn: 0,
      checkInStreak: 0,
      isBanned: false
    };

    db.users[uid] = newProfile;
    // Notify user of welcome gift
    const welcomeNoti: AppNotification = {
      id: `n_welcome_${Date.now()}`,
      title: '🎁 Welcome Gift Credited!',
      message: 'TaskEarn Pro has welcomed you with a free balance of 1000 Coins ($1.00 value) to jumpstart your earning journey!',
      category: 'reward',
      timestamp: Date.now(),
      read: false,
      userId: uid
    };
    db.notifications.unshift(welcomeNoti);

    saveDB(db);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'users', uid), newProfile)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${uid}`));
      setDoc(doc(firestore, 'notifications', welcomeNoti.id), welcomeNoti)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${welcomeNoti.id}`));
    }
    return newProfile;
  },

  updateUser: (uid: string, fields: Partial<UserProfile>): UserProfile => {
    const dbState = getDB();
    if (!dbState.users[uid]) throw new Error(`User ${uid} not found`);
    dbState.users[uid] = { ...dbState.users[uid], ...fields };
    saveDB(dbState);
    if (auth.currentUser && auth.currentUser.uid === uid) {
      setDoc(doc(firestore, 'users', uid), dbState.users[uid], { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${uid}`));
    }
    return dbState.users[uid];
  },

  getAllUsers: () => Object.values(getDB().users),

  // Tasks
  getTasks: () => getDB().tasks.filter(t => t.isActive && (!t.creatorId || t.adminStatus === 'approved')),
  getAllAdminTasks: () => getDB().tasks,
  getUserCreatedTasks: (userId: string) => getDB().tasks.filter(t => t.creatorId === userId),
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => {
    const dbState = getDB();
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}`,
      createdAt: Date.now()
    };
    dbState.tasks.unshift(newTask);
    saveDB(dbState);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'tasks', newTask.id), newTask)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `tasks/${newTask.id}`));
    }
    return newTask;
  },
  submitUserTaskCampaign: (userId: string, taskData: { title: string, description: string, url: string, type: TaskType, totalCompletions: number, rewardPerCompletion: number, payMethod: 'coins' | 'usd' }) => {
    const db = getDB();
    const user = db.users[userId];
    if (!user) throw new Error('User account not found');

    const totalCostCoins = taskData.totalCompletions * taskData.rewardPerCompletion;
    if (taskData.payMethod === 'coins') {
      if (user.coins < totalCostCoins) throw new Error(`Insufficient Coins balance. You need ${totalCostCoins} coins but have only ${user.coins} coins.`);
      user.coins -= totalCostCoins;
    } else {
      const scaleCostUsd = totalCostCoins / 1000; // E.g., 1000 coins = $1.00 USD value
      if (user.balance < scaleCostUsd) throw new Error(`Insufficient USD balance. You need $${scaleCostUsd.toFixed(2)} USD but have only $${user.balance.toFixed(2)} USD.`);
      user.balance -= scaleCostUsd;
    }

    const newTask: Task = {
      id: `task_user_${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      type: taskData.type,
      reward: taskData.rewardPerCompletion,
      rewardPoints: 5,
      xpReward: 3,
      url: taskData.url,
      verificationType: 'manual', // User-created tasks are manually approved by submittor/admin
      cooldownHours: 24,
      dailyLimit: 1,
      countryFilters: [],
      deviceFilters: [],
      isActive: false, // Inactive until approved by admin
      createdAt: Date.now(),
      creatorId: userId,
      adminApproved: false,
      adminStatus: 'pending',
      totalBudgetCoins: totalCostCoins,
      paymentMethodUsed: taskData.payMethod
    };

    db.tasks.unshift(newTask);
    db.users[userId] = user;
    saveDB(db);

    if (auth.currentUser) {
      setDoc(doc(firestore, 'users', userId), user, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
      setDoc(doc(firestore, 'tasks', newTask.id), newTask)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `tasks/${newTask.id}`));
    }
    return { task: newTask, user };
  },
  approveUserTaskCampaign: (taskId: string, adminNote?: string) => {
    const db = getDB();
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Campaign not found');

    task.adminApproved = true;
    task.adminStatus = 'approved';
    task.isActive = true; // Set live immediately
    task.rejectionNote = adminNote || 'Approved by system administrator.';

    db.tasks = db.tasks.map(t => t.id === taskId ? task : t);
    saveDB(db);

    if (auth.currentUser) {
      setDoc(doc(firestore, 'tasks', taskId), task, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `tasks/${taskId}`));
    }
    return task;
  },
  rejectUserTaskCampaign: (taskId: string, adminNote: string) => {
    const db = getDB();
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Campaign not found');

    task.adminApproved = false;
    task.adminStatus = 'rejected';
    task.isActive = false;
    task.rejectionNote = adminNote || 'Rejected by system administrator.';

    // Refund resources if not already refunded
    if (task.creatorId && task.totalBudgetCoins) {
      const user = db.users[task.creatorId];
      if (user) {
        if (task.paymentMethodUsed === 'coins') {
          user.coins += task.totalBudgetCoins;
        } else {
          const refundUsd = task.totalBudgetCoins / 1000;
          user.balance += refundUsd;
        }
        db.users[task.creatorId] = user;
        if (auth.currentUser) {
          setDoc(doc(firestore, 'users', task.creatorId), user, { merge: true })
            .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${task.creatorId}`));
        }
      }
    }

    db.tasks = db.tasks.map(t => t.id === taskId ? task : t);
    saveDB(db);

    if (auth.currentUser) {
      setDoc(doc(firestore, 'tasks', taskId), task, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `tasks/${taskId}`));
    }
    return task;
  },
  updateTask: (taskId: string, fields: Partial<Task>) => {
    const dbState = getDB();
    dbState.tasks = dbState.tasks.map(t => t.id === taskId ? { ...t, ...fields } : t);
    saveDB(dbState);
    const updated = dbState.tasks.find(t => t.id === taskId);
    if (auth.currentUser && updated) {
      setDoc(doc(firestore, 'tasks', taskId), updated, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `tasks/${taskId}`));
    }
    return updated;
  },
  deleteTask: (taskId: string) => {
    const dbState = getDB();
    dbState.tasks = dbState.tasks.filter(t => t.id !== taskId);
    saveDB(dbState);
    if (auth.currentUser) {
      deleteDoc(doc(firestore, 'tasks', taskId))
        .catch(err => handleFirestoreError(err, OperationType.DELETE, `tasks/${taskId}`));
    }
  },

  // Submissions (Task Center verify actions)
  getSubmissions: () => getDB().submissions,
  getUserSubmissions: (userId: string) => getDB().submissions.filter(s => s.userId === userId),
  getUserReferrals: (userId: string) => Object.values(getDB().users).filter(u => u.referredBy === userId),
  submitTask: (taskId: string, userId: string, tgUsername: string, screenshotUrl?: string, textProof?: string) => {
    const db = getDB();
    const task = db.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');

    const newSub: TaskSubmission = {
      id: `sub_${Date.now()}`,
      taskId,
      userId,
      telegramUsername: tgUsername,
      submittedAt: Date.now(),
      screenshotUrl,
      textProof,
      status: task.verificationType === 'auto' ? 'approved' : 'pending'
    };

    db.submissions.unshift(newSub);

    // If auto verified, credit developer directly
    if (newSub.status === 'approved') {
      const user = db.users[userId];
      if (user) {
        user.coins += task.rewardPoints;
        user.rewardPoints += task.rewardPoints;
        user.balance += task.reward;
        user.totalEarned += task.reward;
        user.completedTasksCount += 1;
        user.xp += task.xpReward;
        
        // Auto Level up triggers
        const xpNeeded = user.level * 500;
        if (user.xp >= xpNeeded) {
          user.level += 1;
          user.xp = user.xp - xpNeeded;
          db.notifications.unshift({
            id: `n_level_${Date.now()}`,
            title: `🎉 Leveled Up to Lvl ${user.level}!`,
            message: `Congratulations! You unlocked Level ${user.level} and gained a bonus of 200 Reward Points.`,
            category: 'reward',
            timestamp: Date.now(),
            read: false
          });
        }

        // Process referral commissions L1
        if (user.referredBy) {
          const l1User = db.users[user.referredBy];
          if (l1User) {
            const l1Com = (task.reward * (db.systemSettings.commissionL1 / 100));
            l1User.balance += l1Com;
            l1User.referralEarned += l1Com;
            l1User.totalEarned += l1Com;
            l1User.coins += Math.ceil(task.rewardPoints * (db.systemSettings.commissionL1 / 100));

            // Level 2 Commission
            if (l1User.referredBy) {
              const l2User = db.users[l1User.referredBy];
              if (l2User) {
                const l2Com = (task.reward * (db.systemSettings.commissionL2 / 100));
                l2User.balance += l2Com;
                l2User.referralEarned += l2Com;
                l2User.totalEarned += l2Com;
                l2User.coins += Math.ceil(task.rewardPoints * (db.systemSettings.commissionL2 / 100));

                // Level 3 Commission
                if (l2User.referredBy) {
                  const l3User = db.users[l2User.referredBy];
                  if (l3User) {
                    const l3Com = (task.reward * (db.systemSettings.commissionL3 / 100));
                    l3User.balance += l3Com;
                    l3User.referralEarned += l3Com;
                    l3User.totalEarned += l3Com;
                    l3User.coins += Math.ceil(task.rewardPoints * (db.systemSettings.commissionL3 / 100));
                  }
                }
              }
            }
          }
        }

        // Check achievement triggers
        (db.achievements || ACHIEVEMENTS_LIST).forEach(ach => {
          let currentProgVal = 0;
          if (ach.metric === 'tasks') currentProgVal = user.completedTasksCount;
          else if (ach.metric === 'earnings') currentProgVal = Math.floor(user.balance * 1000);
          
          if (currentProgVal === ach.targetCount) {
            user.coins += ach.rewardCoins;
            user.xp += ach.rewardXP;
            db.notifications.unshift({
              id: `ach_noti_${Date.now()}_${ach.id}`,
              title: `🏆 Achievement Medal Unlocked: ${ach.title}`,
              message: `You completed "${ach.description}" and earned ${ach.rewardCoins} coins!`,
              category: 'reward',
              timestamp: Date.now(),
              read: false
            });
          }
        });

        // Save back user
        db.users[userId] = user;
      }
    }

    saveDB(db);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'submissions', newSub.id), newSub)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `submissions/${newSub.id}`));
      if (db.users[userId]) {
        setDoc(doc(firestore, 'users', userId), db.users[userId], { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
      }
    }
    return newSub;
  },

  processSubmission: (subId: string, status: 'approved' | 'rejected', reason?: string) => {
    const db = getDB();
    const sub = db.submissions.find(s => s.id === subId);
    if (!sub) throw new Error('Submission not found');
    
    // Safety check - prevent multiple edits
    if (sub.status !== 'pending') return sub;

    sub.status = status;
    if (reason) sub.rejectionReason = reason;

    if (status === 'approved') {
      const task = db.tasks.find(t => t.id === sub.taskId);
      const user = db.users[sub.userId];
      if (task && user) {
        user.coins += task.rewardPoints;
        user.rewardPoints += task.rewardPoints;
        user.balance += task.reward;
        user.totalEarned += task.reward;
        user.completedTasksCount += 1;
        user.xp += task.xpReward;

        // Level UP
        const xpNeeded = user.level * 500;
        if (user.xp >= xpNeeded) {
          user.level += 1;
          user.xp -= xpNeeded;
        }

        // Level 1 Referral commission trigger
        if (user.referredBy) {
          const referrer = db.users[user.referredBy];
          if (referrer) {
            const comAmt = task.reward * (db.systemSettings.commissionL1 / 100);
            referrer.balance += comAmt;
            referrer.referralEarned += comAmt;
            referrer.coins += Math.ceil(task.rewardPoints * (db.systemSettings.commissionL1 / 100));
            db.users[referrer.uid] = referrer;
          }
        }

        db.users[user.uid] = user;
        
        db.notifications.unshift({
          id: `n_approved_${Date.now()}`,
          title: `✅ Task Approved: ${task.title}`,
          message: `Your task screenshot was verified. Credited $${task.reward} & +${task.rewardPoints} points successfully!`,
          category: 'task',
          timestamp: Date.now(),
          read: false
        });
      }
    } else {
      // Notify rejected
      db.notifications.unshift({
        id: `n_rejected_${Date.now()}`,
        title: `❌ Task Rejected`,
        message: `Your task submission was not approved. Reason: ${reason || 'Invalid screenshot of verification.'}`,
        category: 'task',
        timestamp: Date.now(),
        read: false
      });
    }

    saveDB(db);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'submissions', subId), sub, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `submissions/${subId}`));
      if (db.users[sub.userId]) {
        setDoc(doc(firestore, 'users', sub.userId), db.users[sub.userId], { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${sub.userId}`));
      }
    }
    return sub;
  },

  // Withdrawals
  getWithdrawals: () => getDB().withdrawals,
  getUserWithdrawals: (userId: string) => getDB().withdrawals.filter(w => w.userId === userId),
  requestWithdrawal: (userId: string, method: WithdrawalRequest['method'], account: string, amount: number) => {
    const db = getDB();
    const user = db.users[userId];
    if (!user) throw new Error('User not found');
    if (user.balance < amount) throw new Error('Insufficient balance');

    // Validate minimum referrals constraint
    const minReferrals = db.systemSettings.minReferrals || 0;
    if (user.referralCount < minReferrals) {
      throw new Error(`Minimum ${minReferrals} referrals are required to request withdrawal. Active referrals: ${user.referralCount} (পেমেন্ট উইথড্র করতে কমপক্ষে ${minReferrals} টি একটিভ রেফারেল লাগবে আপনার। বর্তমান রেফারেল: ${user.referralCount} টি)`);
    }

    // Deduct balance and queue pending
    user.balance -= amount;
    user.totalWithdrawn += amount;
    user.pendingBalance += amount;
    db.users[userId] = user;

    const newReq: WithdrawalRequest = {
      id: `w_req_${Date.now()}`,
      userId,
      username: user.username,
      method,
      accountDetails: account,
      amount,
      status: 'pending',
      requestedAt: Date.now()
    };

    db.withdrawals.unshift(newReq);
    const withNoti: AppNotification = {
      id: `n_payout_${Date.now()}`,
      title: '⏳ Withdrawal Pending',
      message: `Your withdrawal request of $${amount.toFixed(2)} via ${method} is submitted to Admin Queue.`,
      category: 'withdrawal',
      timestamp: Date.now(),
      read: false,
      userId
    };
    db.notifications.unshift(withNoti);

    saveDB(db);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'withdrawals', newReq.id), newReq)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `withdrawals/${newReq.id}`));
      setDoc(doc(firestore, 'users', userId), user, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
      setDoc(doc(firestore, 'notifications', withNoti.id), withNoti)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${withNoti.id}`));
    }
    return newReq;
  },
  processWithdraw: (withdrawId: string, status: 'approved' | 'rejected') => {
    const db = getDB();
    const req = db.withdrawals.find(w => w.id === withdrawId);
    if (!req) throw new Error('Request not found');
    if (req.status !== 'pending') return req;

    const user = db.users[req.userId];
    req.status = status;
    req.processedAt = Date.now();

    if (user) {
      user.pendingBalance -= req.amount;
      
      if (status === 'rejected') {
        // Refund user balance
        user.balance += req.amount;
        user.totalWithdrawn -= req.amount;
        db.notifications.unshift({
          id: `n_payrej_${Date.now()}`,
          title: '❌ Withdrawal Request Rejected',
          message: `Your request of $${req.amount.toFixed(2)} was rejected. Money refunded to account balance.`,
          category: 'withdrawal',
          timestamp: Date.now(),
          read: false
        });
      } else {
        db.notifications.unshift({
          id: `n_payapp_${Date.now()}`,
          title: '🎉 Payout Disbursed Successfully!',
          message: `Your withdrawal of $${req.amount.toFixed(2)} via ${req.method} is approved and processed!`,
          category: 'withdrawal',
          timestamp: Date.now(),
          read: false
        });
      }
      db.users[req.userId] = user;
    }

    saveDB(db);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'withdrawals', withdrawId), req, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `withdrawals/${withdrawId}`));
      if (user) {
        setDoc(doc(firestore, 'users', req.userId), user, { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${req.userId}`));
      }
    }
    return req;
  },

  // Promo Code redeem
  redeemPromo: (userId: string, codeStr: string): { success: boolean; message: string; coins?: number } => {
    const dbState = getDB();
    const user = dbState.users[userId];
    if (!user) return { success: false, message: 'User profile not found.' };

    const promo = dbState.promoCodes.find(p => p.code.toUpperCase() === codeStr.trim().toUpperCase());
    if (!promo) return { success: false, message: 'Invalid promo code.' };
    if (promo.expiresAt < Date.now()) return { success: false, message: 'Promo code expired.' };
    if (promo.usedCount >= promo.usageLimit) return { success: false, message: 'Promo code usage limit reached.' };
    if (promo.usedBy.includes(userId)) return { success: false, message: 'You have already redeemed this promo code.' };

    promo.usedCount += 1;
    promo.usedBy.push(userId);
    
    // Credit user reward
    user.coins += promo.rewardValue;
    user.rewardPoints += promo.rewardValue;
    dbState.users[userId] = user;

    dbState.notifications.unshift({
      id: `n_promo_${Date.now()}`,
      title: '🔥 Promo Code Redeemed!',
      message: `You successfully redeemed code "${promo.code}" and earned ${promo.rewardValue} free coins!`,
      category: 'reward',
      timestamp: Date.now(),
      read: false
    });

    saveDB(dbState);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'promoCodes', promo.id), promo, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `promoCodes/${promo.id}`));
      setDoc(doc(firestore, 'users', userId), user, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${userId}`));
    }
    return { success: true, message: `Promo redeemed! +${promo.rewardValue} Coins added to wallet.`, coins: promo.rewardValue };
  },

  createPromo: (code: string, reward: number, limit: number, expDays: number) => {
    const dbState = getDB();
    const newPromo: PromoCode = {
      id: `promo_${Date.now()}`,
      code: code.trim().toUpperCase(),
      rewardValue: reward,
      usageLimit: limit,
      usedCount: 0,
      expiresAt: Date.now() + 86400000 * expDays,
      usedBy: []
    };
    dbState.promoCodes.unshift(newPromo);
    saveDB(dbState);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'promoCodes', newPromo.id), newPromo)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `promoCodes/${newPromo.id}`));
    }
    return newPromo;
  },
  getPromos: () => getDB().promoCodes,
  deletePromo: (promoId: string) => {
    const dbState = getDB();
    dbState.promoCodes = dbState.promoCodes.filter(p => p.id !== promoId);
    saveDB(dbState);
    if (auth.currentUser) {
      deleteDoc(doc(firestore, 'promoCodes', promoId))
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `promoCodes/${promoId}`));
    }
  },

  // Support Tickets
  getTickets: () => getDB().tickets,
  getUserTickets: (userId: string) => getDB().tickets.filter(t => t.userId === userId),
  createTicket: (userId: string, subject: string, category: SupportTicket['category'], firstMsg: string) => {
    const db = getDB();
    const user = db.users[userId];
    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}`,
      userId,
      subject,
      category,
      status: 'open',
      createdAt: Date.now(),
      messages: [
        {
          senderId: userId,
          senderName: user ? `${user.firstName} ${user.lastName}` : 'User',
          text: firstMsg,
          timestamp: Date.now()
        }
      ]
    };
    db.tickets.unshift(newTicket);
    saveDB(db);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'tickets', newTicket.id), newTicket)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `tickets/${newTicket.id}`));
    }
    return newTicket;
  },
  replyTicket: (ticketId: string, senderId: string, senderName: string, text: string) => {
    const db = getDB();
    db.tickets = db.tickets.map(t => {
      if (t.id === ticketId) {
        const isUserReply = t.userId === senderId;
        return {
          ...t,
          status: isUserReply ? 'open' : 'answered',
          messages: [...t.messages, { senderId, senderName, text, timestamp: Date.now() }]
        };
      }
      return t;
    });
    saveDB(db);
    const updated = db.tickets.find(t => t.id === ticketId);
    if (auth.currentUser && updated) {
      setDoc(doc(firestore, 'tickets', ticketId), updated, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `tickets/${ticketId}`));
    }
    return updated;
  },

  // Alerts & Notifications
  getNotifications: () => getDB().notifications,
  addNotification: (notification: AppNotification) => {
    const db = getDB();
    db.notifications.unshift(notification);
    saveDB(db);
    return notification;
  },
  markAllNotificationsRead: () => {
    const db = getDB();
    db.notifications = db.notifications.map(n => ({ ...n, read: true }));
    saveDB(db);
  },

  // Achievements Progress List
  getAchievementsList: () => {
    return getDB().achievements || DEFAULT_ACHIEVEMENTS;
  },
  updateAchievement: (updatedAch: Achievement) => {
    const db = getDB();
    if (!db.achievements) db.achievements = [...DEFAULT_ACHIEVEMENTS];
    const idx = db.achievements.findIndex(a => a.id === updatedAch.id);
    if (idx !== -1) {
      db.achievements[idx] = updatedAch;
    } else {
      db.achievements.push(updatedAch);
    }
    saveDB(db);
  },
  addAchievement: (ach: Achievement) => {
    const db = getDB();
    if (!db.achievements) db.achievements = [...DEFAULT_ACHIEVEMENTS];
    db.achievements.push(ach);
    saveDB(db);
  },
  deleteAchievement: (id: string) => {
    const db = getDB();
    if (!db.achievements) db.achievements = [...DEFAULT_ACHIEVEMENTS];
    db.achievements = db.achievements.filter(a => a.id !== id);
    saveDB(db);
  },

  // VIP Tiers
  getVipTiers: () => {
    return getDB().vipTiers || DEFAULT_VIP_TIERS;
  },
  updateVipTier: (updatedTier: VipTier) => {
    const db = getDB();
    if (!db.vipTiers) db.vipTiers = [...DEFAULT_VIP_TIERS];
    const idx = db.vipTiers.findIndex(t => t.level === updatedTier.level);
    if (idx !== -1) {
      db.vipTiers[idx] = updatedTier;
    } else {
      db.vipTiers.push(updatedTier);
    }
    saveDB(db);
  },
  addVipTier: (tier: VipTier) => {
    const db = getDB();
    if (!db.vipTiers) db.vipTiers = [...DEFAULT_VIP_TIERS];
    db.vipTiers.push(tier);
    saveDB(db);
  },
  deleteVipTier: (level: number) => {
    const db = getDB();
    if (!db.vipTiers) db.vipTiers = [...DEFAULT_VIP_TIERS];
    db.vipTiers = db.vipTiers.filter(t => t.level !== level);
    saveDB(db);
  },

  // Deposits (জমা)
  getDepositRequests: (): DepositRequest[] => {
    const db = getDB();
    return db.depositRequests || [];
  },
  getUserDepositRequests: (userId: string): DepositRequest[] => {
    const db = getDB();
    return (db.depositRequests || []).filter(r => r.userId === userId);
  },
  submitDepositRequest: (userId: string, amount: number, method: string, txId: string): DepositRequest => {
    const db = getDB();
    if (!db.depositRequests) db.depositRequests = [];
    
    // Check if txId already exists to avoid double submissions
    const exists = db.depositRequests.some(r => r.txId.trim().toLowerCase() === txId.trim().toLowerCase() && r.status !== 'rejected');
    if (exists) {
      throw new Error('This Transaction ID has already been submitted for verification.');
    }

    const user = db.users[userId];
    const newReg: DepositRequest = {
      id: `dep_${Date.now()}`,
      userId,
      username: user ? user.username : 'Unknown User',
      amount,
      method,
      txId: txId.trim(),
      status: 'pending',
      submittedAt: Date.now()
    };

    db.depositRequests.unshift(newReg);
    saveDB(db);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'depositRequests', newReg.id), newReg)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `depositRequests/${newReg.id}`));
    }
    return newReg;
  },
  approveDepositRequest: (id: string, adminNote?: string) => {
    const db = getDB();
    if (!db.depositRequests) db.depositRequests = [];
    const index = db.depositRequests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Deposit request not found!');
    
    const req = db.depositRequests[index];
    if (req.status !== 'pending') throw new Error('Request has already been processed.');

    req.status = 'approved';
    req.reviewedAt = Date.now();
    req.adminNote = adminNote;

    const user = db.users[req.userId];
    if (user) {
      // Add balance to user
      user.balance += req.amount;
      
      // If user's withdraw was locked and they deposited at least the min amount (or simply any approved deposit to unlock)
      const minAmt = db.systemSettings.minDepositAmount || 0;
      if (user.withdrawLocked && req.amount >= minAmt) {
        user.withdrawLocked = false;
        
        // Notify user about unlock
        const noti: AppNotification = {
          id: `n_unlock_${Date.now()}`,
          title: '🔓 Withdraw Locked Released!',
          message: `Your deposit of $${req.amount.toFixed(2)} has been approved and your withdraw lock is successfully lifted! Enjoy your payouts.`,
          category: 'reward',
          timestamp: Date.now(),
          read: false,
          userId: req.userId
        };
        db.notifications.unshift(noti);
        if (auth.currentUser) {
          setDoc(doc(firestore, 'notifications', noti.id), noti)
            .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${noti.id}`));
        }
      } else {
        // Standard deposit notification
        const noti: AppNotification = {
          id: `n_dep_${Date.now()}`,
          title: '💰 Deposit Approved!',
          message: `Your deposit of $${req.amount.toFixed(2)} via ${req.method} is approved. Balance credited successfully!`,
          category: 'reward',
          timestamp: Date.now(),
          read: false,
          userId: req.userId
        };
        db.notifications.unshift(noti);
        if (auth.currentUser) {
          setDoc(doc(firestore, 'notifications', noti.id), noti)
            .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${noti.id}`));
        }
      }
      
      db.users[req.userId] = user;
      if (auth.currentUser) {
        setDoc(doc(firestore, 'users', user.uid), user, { merge: true })
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }
    }

    saveDB(db);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'depositRequests', req.id), req, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `depositRequests/${req.id}`));
    }
  },
  rejectDepositRequest: (id: string, adminNote?: string) => {
    const db = getDB();
    if (!db.depositRequests) db.depositRequests = [];
    const index = db.depositRequests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Deposit request not found!');
    
    const req = db.depositRequests[index];
    if (req.status !== 'pending') throw new Error('Request has already been processed.');

    req.status = 'rejected';
    req.reviewedAt = Date.now();
    req.adminNote = adminNote;

    const noti: AppNotification = {
      id: `n_dep_rej_${Date.now()}`,
      title: '❌ Deposit Rejected',
      message: `Your deposit of $${req.amount.toFixed(2)} was rejected. Reason: ${adminNote || 'Invalid transaction ID/proof'}`,
      category: 'system',
      timestamp: Date.now(),
      read: false,
      userId: req.userId
    };
    db.notifications.unshift(noti);

    saveDB(db);
    if (auth.currentUser) {
      setDoc(doc(firestore, 'depositRequests', req.id), req, { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `depositRequests/${req.id}`));
      setDoc(doc(firestore, 'notifications', noti.id), noti)
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `notifications/${noti.id}`));
    }
  },

  // Get Leaderboards
  getLeaderboard: (type: 'weekly' | 'all') => {
    const db = getDB();
    // Sort all registered users by total earned
    const activeLeaderboard: LeaderboardEntry[] = Object.values(db.users).map(u => ({
      uid: u.uid,
      username: u.username,
      photoUrl: u.photoUrl,
      totalEarned: u.totalEarned,
      referralCount: u.referralCount,
      xp: u.xp,
      level: u.level
    }));

    // Generate real-time dynamic growth/accumulating metrics for mock users over time
    // E.g., increments depend on historical hour offsets so they continuously grow
    const baseHour = Math.floor(Date.now() / 3600000); // changes every hour
    const dynamicCompetitors = MOCK_LEADER_USERS.map((mock, idx) => {
      const incrementEarned = (baseHour % 1000) * (3.5 + idx) + (idx * 25);
      const incrementRefs = Math.floor((baseHour % 300) / (idx + 2)) + Math.floor(baseHour / 1200) % 25;
      const incrementXp = (baseHour % 1500) * (5 + idx);
      return {
        ...mock,
        totalEarned: mock.totalEarned + incrementEarned,
        referralCount: mock.referralCount + incrementRefs,
        xp: mock.xp + incrementXp
      };
    });

    // Merge registered actual users with dynamic mock competitors
    const merged = [...activeLeaderboard, ...dynamicCompetitors];
    
    // De-duplicate: Ensure that the same user (by UID or by username) is never listed multiple times
    const seenUids = new Set<string>();
    const seenUsernames = new Set<string>();
    const uniqueLeaderboard: LeaderboardEntry[] = [];
    
    for (const entry of merged) {
      const lowerUsername = entry.username.trim().toLowerCase();
      if (!seenUids.has(entry.uid) && !seenUsernames.has(lowerUsername)) {
        seenUids.add(entry.uid);
        seenUsernames.add(lowerUsername);
        uniqueLeaderboard.push(entry);
      }
    }
    
    if (type === 'weekly') {
      // Sort primarily by xp to simulate dynamic weekly ranking
      return uniqueLeaderboard.sort((a, b) => b.xp - a.xp).slice(0, 15);
    } else {
      // Sort by total earnings
      return uniqueLeaderboard.sort((a, b) => b.totalEarned - a.totalEarned).slice(0, 15);
    }
  },

  syncFromCloud: async (userId: string): Promise<UserProfile | null> => {
    if (!auth.currentUser) return null;
    try {
      const state = getDB();
      
      // 1. Fetch user doc
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const cloudUser = userSnap.data() as UserProfile;
        state.users[userId] = cloudUser;
      } else if (state.users[userId]) {
        // Does not exist on cloud, upload existing local shape
        await setDoc(userRef, state.users[userId]);
      }
      
      // 2. Fetch tasks
      const tasksSnap = await getDocs(collection(firestore, 'tasks'));
      if (!tasksSnap.empty) {
        const cloudTasks: Task[] = [];
        tasksSnap.forEach(docSnap => {
          cloudTasks.push(docSnap.data() as Task);
        });
        state.tasks = cloudTasks;
      } else {
        // Upload default tasks
        const batch = writeBatch(firestore);
        state.tasks.forEach(t => {
          batch.set(doc(firestore, 'tasks', t.id), t);
        });
        await batch.commit();
      }

      // 3. Fetch Promo Codes
      const promoSnap = await getDocs(collection(firestore, 'promoCodes'));
      if (!promoSnap.empty) {
        const cloudPromos: PromoCode[] = [];
        promoSnap.forEach(docSnap => {
          cloudPromos.push(docSnap.data() as PromoCode);
        });
        state.promoCodes = cloudPromos;
      } else {
        const batch = writeBatch(firestore);
        state.promoCodes.forEach(p => {
          batch.set(doc(firestore, 'promoCodes', p.id), p);
        });
        await batch.commit();
      }
      
      // 4. Settings
      const settingsSnap = await getDoc(doc(firestore, 'settings', 'system'));
      if (settingsSnap.exists()) {
        state.systemSettings = settingsSnap.data() as LocalDB['systemSettings'];
      } else {
        await setDoc(doc(firestore, 'settings', 'system'), state.systemSettings);
      }
      
      // 5. Ad Networks settings
      const adNetworksSnap = await getDoc(doc(firestore, 'settings', 'adNetworks'));
      if (adNetworksSnap.exists()) {
        state.adNetworks = adNetworksSnap.data() as AdNetworkSettings;
      } else {
        const defaultAdNetworks: AdNetworkSettings = {
          monetag: { enabled: false, bannerZoneId: "", rewardedZoneId: "", interstitialZoneId: "" },
          gigapub: { enabled: false, bannerPlacementId: "", rewardedPlacementId: "", videoPlacementId: "" }
        };
        state.adNetworks = defaultAdNetworks;
        await setDoc(doc(firestore, 'settings', 'adNetworks'), defaultAdNetworks);
      }
      
      saveDB(state);
      return state.users[userId] || null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'syncFromCloud');
      return null;
    }
  }
};
