export type Language = 'en' | 'bn' | 'ar' | 'hi';

export interface TelegramUser {
  id: string;
  username?: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface UserProfile {
  uid: string;
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  language: Language;
  isPremium: boolean;
  joinedAt: number;
  country: string;
  
  // Wallet & Earnings
  balance: number;       // USD or equivalent coins
  pendingBalance: number;
  coins: number;
  rewardPoints: number;
  totalEarned: number;
  totalWithdrawn: number;
  referralEarned: number;
  
  // Referral Program
  referredBy: string | null;
  referralCode: string;
  referralCount: number;
  
  // Stats
  completedTasksCount: number;
  completedAdsCount: number;
  completedSurveysCount: number;
  xp: number;
  level: number;
  vipLevel: number; // 0 = standard, 1 = Bronze, 2 = Silver, 3 = Gold, 4 = Platinum, 5 = Diamond
  rank: number;
  
  // Streaks
  lastCheckIn: number; // timestamp
  checkInStreak: number;
  isBanned: boolean;
  withdrawLocked?: boolean;
  lastGamePlayedAt?: number;
  lastAdWatchedAt?: number;
  todayAdsCount?: number;
}

export type TaskType = 
  | 'website_visit' 
  | 'watch_ad' 
  | 'watch_video' 
  | 'survey' 
  | 'app_install' 
  | 'telegram_join' 
  | 'telegram_bot' 
  | 'facebook_like' 
  | 'instagram_follow' 
  | 'tiktok_like' 
  | 'youtube_subscribe' 
  | 'twitter_follow' 
  | 'custom';

export type VerificationType = 'auto' | 'manual';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  reward: number; // Coins or USD
  rewardPoints: number;
  xpReward: number;
  url: string;
  verificationType: VerificationType;
  cooldownHours: number;
  dailyLimit: number;
  countryFilters: string[]; // empty array = all
  deviceFilters: ('mobile' | 'desktop')[]; // empty = all
  isActive: boolean;
  createdAt: number;
  creatorId?: string;
  adminApproved?: boolean;
  adminStatus?: 'pending' | 'approved' | 'rejected';
  rejectionNote?: string;
  totalBudgetCoins?: number;
  paymentMethodUsed?: 'coins' | 'usd';
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId: string;
  telegramUsername: string;
  submittedAt: number;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

export interface AdOffer {
  id: string;
  network: 'monetag' | 'adsterra' | 'gigapub' | 'propeller' | 'custom' | string;
  format: 'banner' | 'popup' | 'rewarded' | 'interstitial' | string;
  reward: number;
  cooldownSeconds: number;
  title: string;
  directUrl?: string;
  sdkScript?: string;
  isActive?: boolean;
}

export interface SurveyOffer {
  id: string;
  title: string;
  provider: string;
  payout: number;
  estimatedMinutes: number;
  cooldownMinutes: number;
  countryFilters: string[];
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  username: string;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'BinancePay' | 'BinanceUSDT' | 'Payeer' | 'FaucetPay' | 'PerfectMoney';
  accountDetails: string; // e.g., wallet address or phone number
  amount: number; // USD
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  processedAt?: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: 'wallet' | 'task' | 'bug' | 'other';
  status: 'open' | 'answered' | 'closed';
  createdAt: number;
  messages: {
    senderId: string;
    senderName: string;
    text: string;
    timestamp: number;
  }[];
}

export interface LeaderboardEntry {
  uid: string;
  username: string;
  photoUrl: string;
  totalEarned: number;
  referralCount: number;
  xp: number;
  level: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  metric: 'tasks' | 'ads' | 'surveys' | 'referrals' | 'earnings';
  rewardCoins: number;
  rewardXP: number;
}

export interface PromoCode {
  id: string;
  code: string;
  rewardValue: number; // positive points / coins
  usageLimit: number;
  usedCount: number;
  expiresAt: number;
  usedBy: string[]; // user IDs
}

export interface Contest {
  id: string;
  title: string;
  type: 'referral' | 'earnings' | 'tasks';
  startDate: number;
  endDate: number;
  prizePool: number;
  isActive: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'system' | 'task' | 'reward' | 'withdrawal' | 'referral';
  timestamp: number;
  read: boolean;
  userId?: string;
}

export interface VipTier {
  level: number;
  name: string;
  multi: string;
  desc: string;
  cost: number;
}

export interface DepositRequest {
  id: string;
  userId: string;
  username: string;
  amount: number;
  method: string;
  txId: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: number;
  reviewedAt?: number;
  adminNote?: string;
}

export interface AdNetworkSettings {
  monetag: {
    enabled: boolean;
    bannerZoneId: string;
    rewardedZoneId: string;
    interstitialZoneId: string;
  };
  gigapub: {
    enabled: boolean;
    bannerPlacementId: string;
    rewardedPlacementId: string;
    videoPlacementId: string;
  };
}

export interface AdHistoryEntry {
  id: string;
  userId: string;
  network: 'monetag' | 'gigapub';
  format: 'banner' | 'rewarded' | 'interstitial' | 'video' | 'native';
  reward: number;
  timestamp: number;
}


