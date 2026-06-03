import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, LayoutDashboard, Users, CheckSquare, Settings, 
  HelpCircle, MessageCircle, TrendingUp, Sparkles, AlertTriangle, 
  Search, Trash2, Ban, UserCheck, Plus, Check, X, Sliders, FileText, Gift,
  ExternalLink, Save, RefreshCw, Send, HelpCircle as HelpIcon, Play,
  BarChart2, Bell, Shield, ArrowLeft, Info, Filter, Terminal, CheckCircle, Trophy, ArrowUpRight
} from 'lucide-react';
import { UserProfile, Task, WithdrawalRequest, SupportTicket, PromoCode, TaskSubmission, AppNotification, VipTier, Achievement, AdOffer } from '../types';
import { StoreDB } from '../services/store';

interface AdminPanelProps {
  onRefreshUser: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onExitAdmin: () => void;
  onToggleUserSim: () => void;
}

export default function AdminPanel({ 
  onRefreshUser, 
  showToast, 
  onExitAdmin, 
  onToggleUserSim 
}: AdminPanelProps) {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'proofs' | 'tasks' | 'withdraws' | 'codes' | 'tickets' | 'settings' | 'vip_achieve'>('stats');

  // Load backend registers
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [allTickets, setAllTickets] = useState<SupportTicket[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<TaskSubmission[]>([]);
  const [allPromos, setAllPromos] = useState<PromoCode[]>([]);
  const [systemSettings, setSystemSettings] = useState(StoreDB.getSettings());
  const [adNetworkSettings, setAdNetworkSettings] = useState(() => StoreDB.getAdNetworks());
  const [allVipTiers, setAllVipTiers] = useState<VipTier[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [allDeposits, setAllDeposits] = useState<any[]>([]);
  
  // Custom Filters & Queries
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'premium' | 'banned' | 'vip'>('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [withdrawalMethodFilter, setWithdrawalMethodFilter] = useState<string>('all');
  const [submissionsFilter, setSubmissionsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Form States
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskUrl, setNewTaskUrl] = useState('');
  const [newTaskType, setNewTaskType] = useState<Task['type']>('telegram_join');
  const [newTaskReward, setNewTaskReward] = useState('15');
  const [newTaskPoints, setNewTaskPoints] = useState('150');
  const [newTaskVerifyType, setNewTaskVerifyType] = useState<Task['verificationType']>('manual');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskImageUrl, setNewTaskImageUrl] = useState('');

  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoReward, setNewPromoReward] = useState('500');
  const [newPromoLimit, setNewPromoLimit] = useState('200');

  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketReplyMsg, setTicketReplyMsg] = useState('');

  // Profile Direct Balances Adjuster
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editCoins, setEditCoins] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editVipLevel, setEditVipLevel] = useState(0);
  const [editIsPremium, setEditIsPremium] = useState(false);
  const [editIsBanned, setEditIsBanned] = useState(false);
  const [editWithdrawLocked, setEditWithdrawLocked] = useState(false);
  const [adjustNote, setAdjustNote] = useState('');

  // Unified Notification Broadcasting Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<AppNotification['category']>('system');

  // Dynamic Ads CRUD States
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [adFormTitle, setAdFormTitle] = useState('');
  const [adFormNetwork, setAdFormNetwork] = useState<string>('monetag');
  const [adFormFormat, setAdFormFormat] = useState<string>('banner');
  const [adFormReward, setAdFormReward] = useState('1.5');
  const [adFormCooldown, setAdFormCooldown] = useState('30');
  const [adFormSdkScript, setAdFormSdkScript] = useState('');
  const [adFormDirectUrl, setAdFormDirectUrl] = useState('');

  // Active Task Editor Campaign State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskUrl, setEditTaskUrl] = useState('');
  const [editTaskPoints, setEditTaskPoints] = useState('');
  const [editTaskReward, setEditTaskReward] = useState('');

  // VIP Tiers Editor States
  const [editingVipLevel, setEditingVipLevel] = useState<number | null>(null);
  const [vipFormLevel, setVipFormLevel] = useState('1');
  const [vipFormName, setVipFormName] = useState('');
  const [vipFormMulti, setVipFormMulti] = useState('1.1x');
  const [vipFormDesc, setVipFormDesc] = useState('');
  const [vipFormCost, setVipFormCost] = useState('1500');

  // Achievements Editor States
  const [editingAchId, setEditingAchId] = useState<string | null>(null);
  const [achFormId, setAchFormId] = useState('');
  const [achFormTitle, setAchFormTitle] = useState('');
  const [achFormDesc, setAchFormDesc] = useState('');
  const [achFormTarget, setAchFormTarget] = useState('5');
  const [achFormMetric, setAchFormMetric] = useState<'tasks' | 'ads' | 'surveys' | 'referrals' | 'earnings'>('tasks');
  const [achFormCoins, setAchFormCoins] = useState('50');
  const [achFormXp, setAchFormXp] = useState('100');

  // Initial Load Snapshot
  useEffect(() => {
    if (isAdminAuth) {
      loadAdminCollections();
    }
  }, [isAdminAuth]);

  const [syncingCloud, setSyncingCloud] = useState(false);

  const loadAdminCollections = async () => {
    setSyncingCloud(true);
    if ((StoreDB as any).syncAllAdminCollections) {
      await (StoreDB as any).syncAllAdminCollections();
    }
    setSyncingCloud(false);

    setAllUsers(StoreDB.getAllUsers());
    setAllTasks(StoreDB.getAllAdminTasks());
    setAllWithdrawals(StoreDB.getWithdrawals());
    setAllTickets(StoreDB.getTickets());
    setSystemSettings(StoreDB.getSettings());
    setAdNetworkSettings(StoreDB.getAdNetworks());
    setAllSubmissions((StoreDB as any).getSubmissions ? (StoreDB as any).getSubmissions() : []);
    setAllPromos((StoreDB as any).getPromos ? (StoreDB as any).getPromos() : []);
    setAllVipTiers(StoreDB.getVipTiers());
    setAllAchievements(StoreDB.getAchievementsList());
    setAllDeposits(StoreDB.getDepositRequests ? StoreDB.getDepositRequests() : []);
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === '129078') {
      setIsAdminAuth(true);
      showToast('🔑 Administrative Session Successfully Enabled!', 'success');
    } else {
      showToast('❌ Invalid Secure Admin PIN. Access Denied.', 'error');
    }
  };

  // VIP Tiers CRUD Functions
  const handleSaveVipTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipFormName.trim() || !vipFormMulti.trim() || !vipFormDesc.trim()) {
      showToast('All VIP fields are required.', 'error');
      return;
    }
    const levelNum = parseInt(vipFormLevel);
    const costNum = parseInt(vipFormCost) || 0;
    
    if (isNaN(levelNum) || levelNum < 0) {
      showToast('Level must be a valid positive integer.', 'error');
      return;
    }

    const tierObj: VipTier = {
      level: levelNum,
      name: vipFormName.trim(),
      multi: vipFormMulti.trim(),
      desc: vipFormDesc.trim(),
      cost: costNum
    };

    StoreDB.updateVipTier(tierObj);
    showToast(`VIP Tier Level ${levelNum} (${vipFormName}) Saved!`, 'success');
    handleClearVipForm();
    setAllVipTiers(StoreDB.getVipTiers());
    onRefreshUser();
  };

  const handleStartEditVipTier = (tier: VipTier) => {
    setEditingVipLevel(tier.level);
    setVipFormLevel(tier.level.toString());
    setVipFormName(tier.name);
    setVipFormMulti(tier.multi);
    setVipFormDesc(tier.desc);
    setVipFormCost(tier.cost.toString());
  };

  const handleDeleteVipTier = (level: number) => {
    if (level === 0) {
      showToast('Cannot delete standard tier level 0.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete VIP Tier Level ${level}?`)) {
      StoreDB.deleteVipTier(level);
      showToast(`VIP Tier Level ${level} removed successfully.`, 'success');
      setAllVipTiers(StoreDB.getVipTiers());
      onRefreshUser();
      if (editingVipLevel === level) {
        handleClearVipForm();
      }
    }
  };

  const handleClearVipForm = () => {
    setEditingVipLevel(null);
    setVipFormLevel((allVipTiers.length).toString());
    setVipFormName('');
    setVipFormMulti('1.1x');
    setVipFormDesc('');
    setVipFormCost('1500');
  };

  // Production Ad Networks Saved Handler
  const handleSaveAdNetworkConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = StoreDB.updateAdNetworks(adNetworkSettings);
      setAdNetworkSettings(updated);
      showToast('🔌 Monetag & GigaPub settings stored in Firebase settings/adNetworks!', 'success');
    } catch (err: any) {
      showToast(`Error saving configuration: ${err.message}`, 'error');
    }
  };

  // Dynamic Ads CRUD Handlers
  const handleSaveDynamicAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adFormTitle.trim()) {
      showToast('Ad Title is required.', 'error');
      return;
    }
    const rewardNum = parseFloat(adFormReward) || 1.0;
    const cooldownNum = parseInt(adFormCooldown) || 30;

    const currentList = systemSettings.dynamicAds || [];
    let updatedList = [...currentList];

    if (editingAdId) {
      updatedList = updatedList.map(ad => {
        if (ad.id === editingAdId) {
          return {
            ...ad,
            title: adFormTitle.trim(),
            network: adFormNetwork as any,
            format: adFormFormat as any,
            reward: rewardNum,
            cooldownSeconds: cooldownNum,
            sdkScript: adFormSdkScript.trim(),
            directUrl: adFormDirectUrl.trim()
          };
        }
        return ad;
      });
      showToast('Ad Configuration Updated!', 'success');
    } else {
      const newAd: AdOffer = {
        id: `ad_${Date.now()}`,
        network: adFormNetwork as any,
        format: adFormFormat as any,
        reward: rewardNum,
        cooldownSeconds: cooldownNum,
        title: adFormTitle.trim(),
        sdkScript: adFormSdkScript.trim(),
        directUrl: adFormDirectUrl.trim(),
        isActive: true
      };
      updatedList.push(newAd);
      showToast('New Ad Configuration Added!', 'success');
    }

    StoreDB.updateSettings({ dynamicAds: updatedList });
    setSystemSettings(StoreDB.getSettings()); // update local state
    handleClearAdForm();
  };

  const handleStartEditAd = (ad: AdOffer) => {
    setEditingAdId(ad.id);
    setAdFormTitle(ad.title);
    setAdFormNetwork(ad.network);
    setAdFormFormat(ad.format);
    setAdFormReward(ad.reward.toString());
    setAdFormCooldown(ad.cooldownSeconds.toString());
    setAdFormSdkScript(ad.sdkScript || '');
    setAdFormDirectUrl(ad.directUrl || '');
  };

  const handleDeleteAd = (adId: string) => {
    if (window.confirm('Are you sure you want to delete this Ad?')) {
      const currentList = systemSettings.dynamicAds || [];
      const updatedList = currentList.filter(ad => ad.id !== adId);
      StoreDB.updateSettings({ dynamicAds: updatedList });
      setSystemSettings(StoreDB.getSettings());
      showToast('Ad Deleted Successfully.', 'success');
      if (editingAdId === adId) {
        handleClearAdForm();
      }
    }
  };

  const handleToggleAdActive = (adId: string) => {
    const currentList = systemSettings.dynamicAds || [];
    const updatedList = currentList.map(ad => {
      if (ad.id === adId) {
        return { ...ad, isActive: ad.isActive === undefined ? false : !ad.isActive };
      }
      return ad;
    });
    StoreDB.updateSettings({ dynamicAds: updatedList });
    setSystemSettings(StoreDB.getSettings());
    showToast('Ad Active State Changed!', 'success');
  };

  const handleClearAdForm = () => {
    setEditingAdId(null);
    setAdFormTitle('');
    setAdFormNetwork('monetag');
    setAdFormFormat('banner');
    setAdFormReward('1.5');
    setAdFormCooldown('30');
    setAdFormSdkScript('');
    setAdFormDirectUrl('');
  };

  // Achievements CRUD Functions
  const handleSaveAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!achFormId.trim() || !achFormTitle.trim() || !achFormDesc.trim()) {
      showToast('All Achievement fields are required.', 'error');
      return;
    }
    const targetCountNum = parseInt(achFormTarget) || 0;
    const coinsNum = parseInt(achFormCoins) || 0;
    const xpNum = parseInt(achFormXp) || 0;

    const achObj: Achievement = {
      id: achFormId.trim(),
      title: achFormTitle.trim(),
      description: achFormDesc.trim(),
      targetCount: targetCountNum,
      metric: achFormMetric,
      rewardCoins: coinsNum,
      rewardXP: xpNum
    };

    StoreDB.updateAchievement(achObj);
    showToast(`Achievement "${achFormTitle}" Saved!`, 'success');
    handleClearAchForm();
    setAllAchievements(StoreDB.getAchievementsList());
    onRefreshUser();
  };

  const handleStartEditAchievement = (ach: Achievement) => {
    setEditingAchId(ach.id);
    setAchFormId(ach.id);
    setAchFormTitle(ach.title);
    setAchFormDesc(ach.description);
    setAchFormTarget(ach.targetCount.toString());
    setAchFormMetric(ach.metric);
    setAchFormCoins(ach.rewardCoins.toString());
    setAchFormXp(ach.rewardXP.toString());
  };

  const handleDeleteAchievement = (id: string) => {
    if (window.confirm(`Are you sure you want to delete Achievement ${id}?`)) {
      StoreDB.deleteAchievement(id);
      showToast(`Achievement ${id} removed successfully.`, 'success');
      setAllAchievements(StoreDB.getAchievementsList());
      onRefreshUser();
      if (editingAchId === id) {
        handleClearAchForm();
      }
    }
  };

  const handleClearAchForm = () => {
    setEditingAchId(null);
    setAchFormId(`ach_${Date.now().toString().slice(-4)}`);
    setAchFormTitle('');
    setAchFormDesc('');
    setAchFormTarget('5');
    setAchFormMetric('tasks');
    setAchFormCoins('100');
    setAchFormXp('200');
  };

  // Profiles Tab: Detailed custom Adjustment + Notification update
  const handleModifyUserProfileCombined = (uid: string) => {
    try {
      const balanceNum = parseFloat(editBalance) || 0;
      const coinsNum = parseInt(editCoins) || 0;
      const originUser = allUsers.find(u => u.uid === uid);
      if (!originUser) return;

      const deltaCoins = coinsNum - originUser.coins;
      const deltaBalance = balanceNum - originUser.balance;

      StoreDB.updateUser(uid, {
        coins: coinsNum,
        rewardPoints: coinsNum,
        balance: balanceNum,
        vipLevel: editVipLevel,
        isPremium: editIsPremium,
        isBanned: editIsBanned,
        withdrawLocked: editWithdrawLocked
      });

      // Send System audit log notification regarding the ledger adjustments
      const notifyText = `Your wallet balance was updated by system administrators. ` +
        `Added: ${deltaCoins >= 0 ? '+' : ''}${deltaCoins} Coins, ${deltaBalance >= 0 ? '+$' : '-$'}${Math.abs(deltaBalance).toFixed(2)} USD. ` +
        `Audit Reason: ${adjustNote || 'Administrative Matchup alignment'}.`;

      const auditNotification: AppNotification = {
        id: `audit_${Date.now()}`,
        title: '💼 Financial Wallet Readjusted',
        message: notifyText,
        category: 'reward',
        timestamp: Date.now(),
        read: false,
        userId: uid
      };

      if ((StoreDB as any).addNotification) {
        (StoreDB as any).addNotification(auditNotification);
      }

      showToast(`User database record successfully modified & audited!`, 'success');
      setEditingUserId(null);
      setAdjustNote('');
      loadAdminCollections();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenUserEditor = (usr: UserProfile) => {
    setEditingUserId(usr.uid);
    setEditCoins(String(usr.coins));
    setEditBalance(String(usr.balance));
    setEditVipLevel(usr.vipLevel || 0);
    setEditIsPremium(usr.isPremium);
    setEditIsBanned(usr.isBanned);
    setEditWithdrawLocked(!!usr.withdrawLocked);
    setAdjustNote('');
  };

  // Direct Simulated Activity Generators
  const handleInstantSimActivity = (uid: string, type: 'ad' | 'survey' | 'invite') => {
    const usr = StoreDB.getUser(uid);
    if (!usr) return;

    if (type === 'ad') {
      StoreDB.updateUser(uid, {
        coins: usr.coins + 80,
        rewardPoints: usr.rewardPoints + 80,
        balance: usr.balance + 0.08,
        totalEarned: usr.totalEarned + 0.08,
        completedAdsCount: usr.completedAdsCount + 1,
        xp: usr.xp + 10
      });
      showToast('🎬 Simulated Monetag Mobile Ads Complete: Credited +80 coins ($0.08)!', 'success');
    } else if (type === 'survey') {
      StoreDB.updateUser(uid, {
        coins: usr.coins + 600,
        rewardPoints: usr.rewardPoints + 600,
        balance: usr.balance + 0.60,
        totalEarned: usr.totalEarned + 0.60,
        completedSurveysCount: usr.completedSurveysCount + 1,
        xp: usr.xp + 90
      });
      showToast('📋 Simulated CPA survey completion: Credited +600 coins ($0.60)!', 'success');
    } else if (type === 'invite') {
      const inviteId = String(Math.floor(Math.random() * 89999 + 10000));
      StoreDB.createOrUpdateTelegramUser({
        id: inviteId,
        username: `invited_sim_${inviteId}`,
        first_name: `InvitedUser_${inviteId}`,
        last_name: 'Simulated',
        is_premium: false
      }, usr.referralCode);
      showToast('👥 New referral simulation sign-up created underneath this user!', 'success');
    }
    loadAdminCollections();
    onRefreshUser();
  };

  // Global Dispatch Notification Broadcast to ALL
  const handleDispatchNotificationBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;

    try {
      allUsers.forEach(usr => {
        const globalAlert: AppNotification = {
          id: `broadcast_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          title: `📣 ${broadcastTitle}`,
          message: broadcastMsg,
          category: broadcastCategory,
          timestamp: Date.now(),
          read: false,
          userId: usr.uid
        };
        if ((StoreDB as any).addNotification) {
          (StoreDB as any).addNotification(globalAlert);
        }
      });

      showToast(`🔥 Broadcast Alert successfully pushed to ${allUsers.length} user dashboards!`, 'success');
      setBroadcastTitle('');
      setBroadcastMsg('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Proof Screenshot Verification approvals
  const handleProcessUserProof = (subId: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      StoreDB.processSubmission(subId, status, reason);
      showToast(`Submission proof #${subId.slice(-4)} has been ${status}!`, 'success');
      setRejectingSubId(null);
      setCustomRejectionReason('');
      loadAdminCollections();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Bulk Verification Proofs (Approved Entire Pending List at once)
  const handleBulkApprovePendingSubmissions = () => {
    const pendings = allSubmissions.filter(s => s.status === 'pending');
    if (pendings.length === 0) {
      showToast('No pending screenshots inside the proofs queue.', 'error');
      return;
    }
    
    let count = 0;
    pendings.forEach(sub => {
      try {
        StoreDB.processSubmission(sub.id, 'approved');
        count++;
      } catch (e) {}
    });

    showToast(`✅ Successfully batch-verified and paid out ${count} pending submissions!`, 'success');
    loadAdminCollections();
    onRefreshUser();
  };

  // Payout Adjustments
  const handleProcessRefundPayout = (withdrawId: string, action: 'approved' | 'rejected') => {
    try {
      StoreDB.processWithdraw(withdrawId, action);
      showToast(`Financial withdrawal ID #${withdrawId.slice(-5)} is marked as: ${action.toUpperCase()}`, 'success');
      loadAdminCollections();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleProcessDepositVerification = (depositId: string, action: 'approved' | 'rejected') => {
    try {
      const note = prompt(`Enter optional Admin verification note for user (উজারকে দেখানোর জন্য মেসেজটি লিখুন):`, action === 'approved' ? 'Deposit verified, withdrawal channel unlocked.' : 'Invalid TrxID or mismatched amount.');
      if (note === null) return; // user cancelled

      if (action === 'approved') {
        StoreDB.approveDepositRequest(depositId, note);
        showToast(`Deposit verification approved successfully! Requested amount credited.`, 'success');
      } else {
        StoreDB.rejectDepositRequest(depositId, note);
        showToast(`Deposit verification rejected/voided successfully.`, 'error');
      }
      loadAdminCollections();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Bulk Approve Payouts
  const handleBulkApprovePayouts = () => {
    const pendings = allWithdrawals.filter(w => w.status === 'pending');
    if (pendings.length === 0) {
      showToast('No pending withdrawals found.', 'error');
      return;
    }
    pendings.forEach(w => {
      try { StoreDB.processWithdraw(w.id, 'approved'); } catch (e) {}
    });
    showToast(`💰 Approved and disbursed all ${pendings.length} pending cash withdraw transfers!`, 'success');
    loadAdminCollections();
    onRefreshUser();
  };

  // Campaign Deployer
  const handleCreateTaskCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskUrl.trim()) return;

    try {
      StoreDB.createTask({
        title: newTaskTitle,
        description: newTaskDescription.trim() || `Sponsored Promotional Task. Open, join or subscribe to unlock cash credit rewards.`,
        type: newTaskType,
        reward: parseFloat(newTaskReward) / 100, // USD cent format
        rewardPoints: parseInt(newTaskPoints),
        xpReward: Math.ceil(parseInt(newTaskPoints) / 5),
        url: newTaskUrl,
        imageUrl: newTaskImageUrl.trim() || undefined,
        verificationType: newTaskVerifyType,
        cooldownHours: 24,
        dailyLimit: 1,
        countryFilters: [],
        deviceFilters: [],
        isActive: true
      });

      showToast('🚀 New sponsored advertising campaign launched successfully!', 'success');
      setNewTaskTitle('');
      setNewTaskUrl('');
      setNewTaskDescription('');
      setNewTaskImageUrl('');
      loadAdminCollections();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApproveUserCampaignObj = (taskId: string) => {
    try {
      StoreDB.approveUserTaskCampaign(taskId);
      showToast('Campaign approved and launched live successfully!', 'success');
      loadAdminCollections();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectUserCampaignObj = (taskId: string) => {
    const reason = prompt('Enter rejection reason & details (ইউজারকে কারণ জানাতে এখানে লিখুন):', 'Unsuitable target URL link or invalid promotional task structure.');
    if (reason === null) return; // cancelled

    try {
      StoreDB.rejectUserTaskCampaign(taskId, reason);
      showToast('Campaign rejected and funding refunded back to user.', 'error');
      loadAdminCollections();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveTaskCampaign = (taskId: string) => {
    try {
      StoreDB.updateTask(taskId, {
        title: editTaskTitle,
        url: editTaskUrl,
        rewardPoints: parseInt(editTaskPoints) || 0,
        reward: parseFloat(editTaskReward) || 0,
        xpReward: Math.ceil((parseInt(editTaskPoints) || 0) / 5)
      });
      showToast('Task settings updated.', 'success');
      setEditingTaskId(null);
      loadAdminCollections();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenTaskEditor = (t: Task) => {
    setEditingTaskId(t.id);
    setEditTaskTitle(t.title);
    setEditTaskUrl(t.url);
    setEditTaskPoints(String(t.rewardPoints));
    setEditTaskReward(String(t.reward));
  };

  // Promo Code generators
  const handlePublishPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;

    try {
      StoreDB.createPromo(newPromoCode, parseInt(newPromoReward), parseInt(newPromoLimit), 15);
      showToast(`🎟️ Promo Code "${newPromoCode.toUpperCase()}" launched actively!`, 'success');
      setNewPromoCode('');
      loadAdminCollections();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Bulk Generator for Promo codes
  const handleBulkGeneratePromos = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const codes = [`BONUS_${randomSuffix}`, `FREE_GIFT_${randomSuffix}`, `TE_PROMO_${randomSuffix}`];
    codes.forEach(c => {
      try { StoreDB.createPromo(c, 250, 100, 7); } catch (e) {}
    });
    showToast(`🎟️ Multi-set promo codes generated! Added: ${codes.join(', ')}`, 'success');
    loadAdminCollections();
  };

  // Ticket replying presets + macros
  const handleResponsePresetReply = (preset: 'invalid' | 'done' | 'delay') => {
    if (preset === 'invalid') {
      setTicketReplyMsg("Hello! Your verification screenshot was rejected because you did not actually complete the task or subscribe. Please complete the steps properly and re-upload true proofs. ধন্যবাদ!");
    } else if (preset === 'done') {
      setTicketReplyMsg("Your report has been received and verified. The missing coins have been compensated and loaded directly into your wallet database. Thank you for your support. ধন্যবাদ!");
    } else if (preset === 'delay') {
      setTicketReplyMsg("Greetings! There is a temporary backlog in bKash/Nagad verification channels. Payouts are safely scheduled and will disburse into your account within 12 hours. Stay tuned! ধন্যবাদ!");
    }
  };

  const handleAdminTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !ticketReplyMsg.trim()) return;
    try {
      StoreDB.replyTicket(activeTicketId, 'system_admin', 'Support Operations Team', ticketReplyMsg);
      showToast('Replying added to ticket conversation thread!', 'success');
      setTicketReplyMsg('');
      loadAdminCollections();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleSettingsOption = (field: any, value: any) => {
    StoreDB.updateSettings({ [field]: value });
    showToast('Platform settings updated successfully!', 'success');
    loadAdminCollections();
  };

  const handleSeedMockDataDiagnostic = () => {
    const db = (StoreDB as any).getDB ? (StoreDB as any).getDB() : null;
    if (db) {
      const activeUsr = allUsers[0] || { uid: 'tg_admin_user', username: 'demo_player' };
      const pendingTask = allTasks.find(t => t.verificationType === 'manual') || allTasks[0];
      
      if (!pendingTask) {
        showToast('Please deploy at least one manual verification task first!', 'error');
        return;
      }

      // Seed screenshot
      db.submissions.unshift({
        id: `ss_seed_${Date.now()}`,
        taskId: pendingTask.id,
        userId: activeUsr.uid,
        telegramUsername: activeUsr.username,
        submittedAt: Date.now(),
        screenshotUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
        status: 'pending'
      });

      // Seed Support Chat
      db.tickets.unshift({
        id: `ticket_seed_${Date.now()}`,
        userId: activeUsr.uid,
        subject: 'Bkash cashout has delay status',
        category: 'wallet',
        status: 'open',
        createdAt: Date.now(),
        messages: [{
          senderId: activeUsr.uid,
          senderName: activeUsr.username,
          text: 'I made a withdrawal of $5 via Bkash 1 hour ago but it is still showing pending. Can you verify, please?',
          timestamp: Date.now()
        }]
      });

      try {
        localStorage.setItem('taskearn_pro_db_v2', JSON.stringify(db));
      } catch (e) {
        console.warn("Storage restricted; unable to save diagnostic seed changes to local cache.");
      }
      showToast('🎯 Diagnostic Seeding: Inserted task screenshot & chat ticket!', 'success');
      loadAdminCollections();
    }
  };

  const handleHardFactoryReset = () => {
    if (confirm('🚨 CRITICAL DANGER: This resets all users, completed offers, configurations back to factory preloads. Proceed?')) {
      try {
        localStorage.removeItem('taskearn_pro_db_v2');
      } catch (e) {
        console.warn("Storage restricted; unable to remove cached database.");
      }
      showToast('Simulation database cleared and reset back to preloads!', 'success');
      loadAdminCollections();
      onRefreshUser();
    }
  };

  // Metrics calculators
  const totalWithdrawnDisbursed = allWithdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0);
  const totalPendingWithdrawals = allWithdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);
  const estimatedAdRevenue = allUsers.reduce((sum, u) => sum + (u.completedAdsCount * 0.08), 0);
  const netProfit = Math.max(0, estimatedAdRevenue - totalWithdrawnDisbursed);

  // Searches profiles list
  const filteredUsers = allUsers.filter(usr => {
    const matchesSearch = usr.username.toLowerCase().includes(searchUserQuery.toLowerCase()) || 
                          usr.firstName.toLowerCase().includes(searchUserQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (userStatusFilter === 'premium') return usr.isPremium;
    if (userStatusFilter === 'banned') return usr.isBanned;
    if (userStatusFilter === 'vip') return usr.vipLevel > 0;
    return true;
  });

  return (
    <div id="admin-panel-viewport" className="p-4 space-y-4 text-left max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        {!isAdminAuth ? (
          /* 1. PASSWORD GATE */
          <motion.div
            key="admin-gate-lock"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center space-y-4 max-w-sm mx-auto shadow-2xl"
          >
            <div className="w-14 h-14 bg-indigo-650/10 rounded-full flex items-center justify-center mx-auto text-indigo-400 border border-indigo-950/40">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-extrabold text-slate-100 tracking-tight">Enterprise Credentials</h2>
              <p className="text-[11px] text-slate-450 leading-relaxed">
                TaskEarn Pro Core Engine secure authorization required. Provide master credentials PIN.
              </p>
            </div>
            <form onSubmit={handleAdminVerify} className="space-y-3">
              <input
                type="password"
                required
                value={adminPinInput}
                onChange={e => setAdminPinInput(e.target.value)}
                placeholder="Enter Secure Admin Access PIN"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white text-center font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 font-extrabold text-xs text-white rounded-xl shadow-lg shadow-indigo-600/10 transition active:scale-95"
              >
                Authenticate Mainframe
              </button>
            </form>
          </motion.div>
        ) : (
          /* 2. CORE MASTER CONTROL CONTAINER */
          <motion.div
            key="admin-workspace-loaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Top Operational bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-550 animate-pulse border-2 border-slate-900" />
                <div>
                  <h3 className="text-xs font-black text-slate-100 tracking-wider uppercase font-mono">Operations Mainframe</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Node Sync active • Server Time: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={onToggleUserSim}
                  className="flex-1 sm:flex-none text-[9.5px] bg-slate-950 hover:bg-slate-850 px-3.5 py-1.5 text-slate-350 font-bold border border-slate-800 rounded-xl cursor-pointer"
                >
                  👥 Simulation Drivers
                </button>
                <button
                  onClick={() => setIsAdminAuth(false)}
                  className="flex-1 sm:flex-none text-[9.5px] bg-rose-950/20 hover:bg-rose-950 text-rose-450 px-3.5 py-1.5 font-bold border border-rose-950/30 rounded-xl cursor-pointer"
                >
                  Lock
                </button>
              </div>

              <button
                onClick={onExitAdmin}
                className="w-full sm:w-auto py-2 px-5 bg-gradient-to-r from-emerald-550 to-teal-600 hover:from-emerald-500 hover:to-teal-550 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                ← Back to User App view
              </button>
            </div>

            {/* Core Navigation Navigation Tab rails */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800">
              {([
                { id: 'stats', label: '📊 Bento Stats & Trends' },
                { id: 'users', label: `👥 User Ledgers (${allUsers.length})` },
                { id: 'proofs', label: `📸 Proofs Queue (${allSubmissions.filter(s=>s.status==='pending').length})` },
                { id: 'tasks', label: `🎯 Tasks Deploy` },
                { id: 'withdraws', label: `💰 Withdraw Queue (${allWithdrawals.filter(w=>w.status==='pending').length})` },
                { id: 'codes', label: `🎟️ Promo Builders` },
                { id: 'tickets', label: `💬 Chats (${allTickets.filter(t=>t.status!=='closed').length})` },
                { id: 'settings', label: `⚙️ Global Switches` },
                { id: 'vip_achieve', label: `💎 VIP Upgrade & Badges` }
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3.5 rounded-xl text-[10.5px] font-extrabold whitespace-nowrap transition cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-indigo-650 text-white shadow-md' 
                      : 'bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-350 hover:bg-slate-900/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTAINER AREA */}
            <div className="min-h-96">

              {/* TAB 1: BENTO MONITORING STATS METRICS & CHARTS */}
              {activeTab === 'stats' && (
                <div className="space-y-4 animate-fade">
                  {/* Grid cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Total Accounts</span>
                      <span className="text-xl font-black font-mono text-slate-100">{allUsers.length}</span>
                      <p className="text-[9.5px] text-indigo-400 block mt-1">Real-time DB counts</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Active Promo Codes</span>
                      <span className="text-xl font-black font-mono text-indigo-400">{allPromos.length} Code</span>
                      <p className="text-[9.5px] text-slate-450 block mt-1">Multi-use voucher pools</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Estimated Monetag Ad Rev</span>
                      <span className="text-xl font-black font-mono text-emerald-400">${estimatedAdRevenue.toFixed(2)}</span>
                      <p className="text-[9.5px] text-slate-450 block mt-1">Simulated Ad CPC rates</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                      <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold">Processed Withdrawals</span>
                      <span className="text-xl font-black font-mono text-rose-400">${totalWithdrawnDisbursed.toFixed(2)}</span>
                      <p className="text-[9.5px] text-rose-500 block mt-1">Paid out list cash transfers</p>
                    </div>
                  </div>

                  {/* Aesthetic Visual SVG Trends Graph */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="bg-slate-900 border border-slate-850 rounded-3xl p-4 space-y-4 shadow-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider font-mono">Signups Growth Chart</h4>
                          <p className="text-[10px] text-slate-500">Cumulative user registration trend (past 7 days)</p>
                        </div>
                        <span className="text-[9px] font-mono p-1 bg-slate-950 text-indigo-400 border border-slate-850 rounded">AUTO UPDATE</span>
                      </div>
                      
                      {/* Pure CSS Bar chart representing user activity */}
                      <div className="h-32 flex items-end justify-between items-stretch gap-2.5 pt-4">
                        {[
                          { day: 'Mon', count: 18, pct: '30%' },
                          { day: 'Tue', count: 24, pct: '45%' },
                          { day: 'Wed', count: 32, pct: '60%' },
                          { day: 'Thu', count: 48, pct: '85%' },
                          { day: 'Fri', count: 42, pct: '75%' },
                          { day: 'Sat', count: 56, pct: '98%' },
                          { day: 'Sun', count: 60, pct: '100%' }
                        ].map((node, idx) => (
                          <div key={idx} className="flex-1 flex flex-col justify-end items-center group cursor-pointer">
                            <div className="text-[9px] font-mono text-indigo-400 opacity-0 group-hover:opacity-100 transition duration-150 mb-1">
                              {node.count}
                            </div>
                            <div className="w-full bg-slate-950 rounded-t-lg border-t border-indigo-900/50 h-24 flex items-end">
                              <div 
                                style={{ height: node.pct }}
                                className="w-full bg-gradient-to-t from-indigo-650 to-indigo-400 rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                              />
                            </div>
                            <span className="text-[9px] font-mono text-slate-500 mt-2 block">{node.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-850 rounded-3xl p-4 space-y-4 shadow-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider font-mono">Ecosystem Profit Ratios</h4>
                          <p className="text-[10px] text-slate-500">Gross revenue generation vs payout reserves</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] font-mono text-slate-500 block">NET INCOME</span>
                          <span className="text-xs font-mono font-black text-emerald-400">${netProfit.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Dual comparing indicator bars */}
                      <div className="space-y-3.5 pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Sponsor Ad Monetization</span>
                            <span className="text-emerald-400">${estimatedAdRevenue.toFixed(2)}</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-850">
                            <div className="h-full bg-emerald-550 rounded-lg" style={{ width: '100%' }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Disbursed Core Payouts</span>
                            <span className="text-rose-400">${totalWithdrawnDisbursed.toFixed(2)}</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-850">
                            <div className="h-full bg-rose-500 rounded-lg" style={{ width: String(Math.min(100, (totalWithdrawnDisbursed / (estimatedAdRevenue || 1)) * 100)) + '%' }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>Pending Payout Requests Queue</span>
                            <span className="text-amber-400">${totalPendingWithdrawals.toFixed(2)}</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-850">
                            <div className="h-full bg-amber-500 rounded-lg" style={{ width: String(Math.min(100, (totalPendingWithdrawals / (estimatedAdRevenue || 1)) * 100)) + '%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seed diagnostics action console */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow shadow-indigo-650/5">
                    <div className="space-y-1">
                      <h5 className="text-[11.5px] font-black text-slate-200 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <Terminal className="w-4 h-4 text-indigo-400" /> Platform Debug & Seed Helpers
                      </h5>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Verify platform execution by loading instant task screenshot submissions, support tickets, and mock cash claims.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleSeedMockDataDiagnostic}
                        className="bg-indigo-650 hover:bg-indigo-500 text-white font-heavy text-[9.5px] p-2.5 px-4 rounded-xl flex items-center gap-1 active:scale-95 transition"
                      >
                        ⚡ Seed Screen & Tickets
                      </button>
                      <button
                        onClick={handleHardFactoryReset}
                        className="bg-rose-950/20 hover:bg-rose-950 text-rose-400 border border-rose-950/20 text-[9.5px] font-bold p-2.5 px-4 rounded-xl transition"
                      >
                        ☠️ Hard Cleared Database
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROFILE LISTS, DIRECT FINANCIAL LEDGER, SIMULATE WORK */}
              {activeTab === 'users' && (
                <div className="space-y-4 animate-fade">
                  {/* Search and filters bar */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchUserQuery}
                        onChange={e => setSearchUserQuery(e.target.value)}
                        placeholder="Search accounts by name or TG username..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    
                    <select
                      value={userStatusFilter}
                      onChange={e => setUserStatusFilter(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:outline-none"
                    >
                      <option value="all">⚡ All Statuses</option>
                      <option value="premium">💎 Telegram Premium Users</option>
                      <option value="banned">🚫 Suspended / Banned</option>
                      <option value="vip">⭐ VIP Tier Members</option>
                    </select>
                  </div>

                  {/* Registered Profiles Container list */}
                  <div className="space-y-2.5">
                    {filteredUsers.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center italic py-10">No users found matching query filters.</p>
                    ) : (
                      filteredUsers.map(usr => {
                        const isEditing = editingUserId === usr.uid;
                        return (
                          <div key={usr.uid} className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-3.5 shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img src={usr.photoUrl} className="w-10 h-10 rounded-full border border-slate-800" alt="" referrerPolicy="no-referrer" />
                                <div>
                                  <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                                    <span>{usr.firstName} {usr.lastName || ''}</span>
                                    <span className="text-[10px] font-mono text-indigo-400 bg-slate-950 border border-slate-850 p-0.5 px-1.5 rounded-md">@{usr.username}</span>
                                    {usr.isPremium && <span className="p-0.5 px-1 bg-indigo-950 border border-indigo-900 text-indigo-400 text-[8.5px] rounded font-heavy">PREMIUM</span>}
                                    {usr.isBanned && <span className="p-0.5 px-1.5 bg-rose-500/10 border border-rose-900 text-rose-500 text-[8.5px] rounded font-bold uppercase tracking-wider">BANNED</span>}
                                    {usr.withdrawLocked && <span className="p-0.5 px-1.5 bg-amber-500/10 border border-amber-900/60 text-amber-500 text-[8.5px] rounded font-bold uppercase tracking-wider">🔒 LOCKED</span>}
                                  </h4>
                                  <span className="text-[10px] text-slate-450 block mt-1 font-mono">
                                    Coins: <b className="text-indigo-300 font-extrabold">{usr.coins}</b> | Cash Balance: <b className="text-emerald-400">${usr.balance.toFixed(2)}</b> | VIP: <b className="text-amber-500">{usr.vipLevel === 0 ? 'Regular' : `Tier ${usr.vipLevel}`}</b>
                                  </span>
                                </div>
                              </div>

                              <div className="flex gap-1.5 select-none">
                                <button
                                  onClick={() => isEditing ? setEditingUserId(null) : handleOpenUserEditor(usr)}
                                  className={`text-[10px] font-extrabold p-2 px-3 rounded-xl border transition ${
                                    isEditing 
                                      ? 'bg-slate-950 border-slate-800 text-slate-400' 
                                      : 'bg-indigo-650/10 border-indigo-950 text-indigo-450 hover:bg-indigo-950/20'
                                  }`}
                                >
                                  {isEditing ? 'Cancel Edit' : 'Modify Ledger'}
                                </button>
                              </div>
                            </div>

                            {/* USER PROFILE FINANCIAL LEDGER MODIFIERS */}
                            {isEditing && (
                              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl space-y-4 animate-fade text-xs">
                                <span className="text-[9.5px] font-mono text-indigo-400 uppercase tracking-widest block font-extrabold">💼 Financial Ledger Adjustment Console</span>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-slate-500 block">Edit Coin Wallet Points</label>
                                    <input
                                      type="number"
                                      value={editCoins}
                                      onChange={e => setEditCoins(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-slate-500 block">Edit Cash Balance ($ USD value)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={editBalance}
                                      onChange={e => setEditBalance(e.target.value)}
                                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:outline-none"
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-slate-500 block">VIP Level Segment</label>
                                    <select
                                      value={editVipLevel}
                                      onChange={e => setEditVipLevel(parseInt(e.target.value))}
                                      className="w-full bg-slate-900 border border-slate-804 rounded-lg p-2 text-white focus:outline-none"
                                    >
                                      <option value={0}>Standard (1.0x payouts)</option>
                                      <option value={1}>Bronze Member Tier (1.1x multiplier)</option>
                                      <option value={2}>Silver Member Tier (1.2x multiplier)</option>
                                      <option value={3}>Gold Member Tier (1.5x multiplier)</option>
                                      <option value={4}>Platinum Member Tier (1.8x multiplier)</option>
                                      <option value={5}>Diamond King Tier (2.2x multiplier)</option>
                                    </select>
                                  </div>

                                  <div className="flex flex-wrap gap-4 items-center pt-4">
                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-350 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={editIsPremium}
                                        onChange={e => setEditIsPremium(e.target.checked)}
                                        className="accent-indigo-550 w-4 h-4 rounded"
                                      />
                                      Premium badge
                                    </label>
                                    <label className="flex items-center gap-1.5 text-[11px] text-slate-350 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={editIsBanned}
                                        onChange={e => setEditIsBanned(e.target.checked)}
                                        className="accent-rose-550 w-4 h-4 rounded"
                                      />
                                      Suspended (Banned)
                                    </label>
                                    <label className="flex items-center gap-1.5 text-[11px] text-amber-450 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={editWithdrawLocked}
                                        onChange={e => setEditWithdrawLocked(e.target.checked)}
                                        className="accent-amber-550 w-4 h-4 rounded"
                                      />
                                      🔒 Lock Withdrawals (উইথড্র লক)
                                    </label>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold text-slate-500 block">Transaction Ledger Adjustment Explanation (Audited/Notified to player)</label>
                                  <input
                                    type="text"
                                    value={adjustNote}
                                    onChange={e => setAdjustNote(e.target.value)}
                                    placeholder="E.g., Event reward lookup matchup, verification backlog compensation, etc."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none"
                                  />
                                </div>

                                {/* Quick Gameplay Trigger driver simulation */}
                                <div className="p-3 bg-slate-900 border border-slate-850 rounded-xl space-y-1.5">
                                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block font-mono">⚡ Simulate Quick Live Account Activity Logs:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleInstantSimActivity(usr.uid, 'ad')}
                                      className="text-[9.5px] bg-slate-950 border border-slate-800 p-1 px-2.5 rounded text-indigo-450 hover:bg-slate-850"
                                    >
                                      🎬 Trigger Ad Watch (+80Coins)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleInstantSimActivity(usr.uid, 'survey')}
                                      className="text-[9.5px] bg-slate-950 border border-slate-800 p-1 px-2.5 rounded text-indigo-455 hover:bg-slate-850"
                                    >
                                      📋 Trigger CPA Survey (+600Coins)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleInstantSimActivity(usr.uid, 'invite')}
                                      className="text-[9.5px] bg-slate-950 border border-slate-800 p-1 px-2.5 rounded text-indigo-455 hover:bg-slate-850"
                                    >
                                      👥 Invite Simulated registration
                                    </button>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-slate-850">
                                  <button
                                    onClick={() => handleModifyUserProfileCombined(usr.uid)}
                                    className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-600 font-extrabold text-xs uppercase tracking-wider text-white rounded-xl shadow cursor-pointer active:scale-95 transition"
                                  >
                                    Commit & Authorize Changes
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PROOF SCREENSHOT QUEUE AUDITOR & BULK ACCEPT */}
              {activeTab === 'proofs' && (
                <div className="space-y-4 animate-fade">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-2.5 gap-2">
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-400 font-mono tracking-wider">Screenshot Auditor Dashboard</h4>
                      <p className="text-[10px] text-slate-500">Inspect user claiming files uploaded</p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleBulkApprovePendingSubmissions}
                        className="flex-1 sm:flex-none text-[10px] bg-emerald-600 hover:bg-emerald-500 text-slate-950 p-1.5 px-3 rounded-lg font-bold"
                      >
                        ✅ Approve All Pendings Batch
                      </button>
                      <button
                        onClick={() => setSubmissionsFilter(submissionsFilter === 'pending' ? 'all' : 'pending')}
                        className={`text-[10px] p-1.5 px-3 rounded-lg font-mono font-bold ${submissionsFilter === 'pending' ? 'bg-amber-500/10 text-amber-450 border border-amber-500/10' : 'bg-slate-950 border border-slate-850 text-slate-500'}`}
                      >
                        Filter: {submissionsFilter === 'pending' ? 'Pending Active' : 'All History'}
                      </button>
                    </div>
                  </div>

                  {allSubmissions.filter(s => submissionsFilter === 'all' || s.status === submissionsFilter).length === 0 ? (
                    <p className="text-xs text-slate-550 italic text-center py-10 border border-dashed border-slate-850 rounded-2xl">No proof notifications found matching current state filters.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {allSubmissions.filter(s => submissionsFilter === 'all' || s.status === submissionsFilter).map(sub => {
                        const targetCampaign = allTasks.find(t => t.id === sub.taskId);
                        return (
                          <div key={sub.id} className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-3 shadow flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] text-slate-500 font-mono block">SUBSCRIBER: @{sub.telegramUsername}</span>
                                  <h4 className="text-xs font-black text-slate-100">{targetCampaign?.title || `Campaign ID: ${sub.taskId}`}</h4>
                                  <span className="text-[9.5px] text-indigo-400 block mt-0.5 font-mono">🟡 {targetCampaign?.rewardPoints || 0} Coins + $ {targetCampaign?.reward || '0.00'} USD</span>
                                </div>
                                <span className={`text-[9.5px] uppercase font-black font-mono px-1.5 py-0.5 rounded ${
                                  sub.status === 'approved' ? 'bg-emerald-500/10 text-emerald-450' :
                                  sub.status === 'rejected' ? 'bg-rose-500/10 text-rose-450' :
                                  'bg-amber-500/10 text-amber-400 animate-pulse'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>

                              {sub.screenshotUrl && (
                                <div className="space-y-1">
                                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block">User Uploaded Screenshot File:</span>
                                  <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-850 group">
                                    <img src={sub.screenshotUrl} className="w-full max-h-36 object-cover rounded-xl" alt="Captured claim" referrerPolicy="no-referrer" />
                                    <a
                                      href={sub.screenshotUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="absolute right-2 top-2 p-1.5 bg-slate-950/80 hover:bg-slate-950 rounded text-slate-300"
                                      title="Open in custom window wrapper"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              )}

                              {sub.textProof && (
                                <div className="space-y-1 mt-1">
                                  <span className="text-[8.5px] uppercase font-bold text-indigo-400 block font-mono">Verification Proof Data:</span>
                                  <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs text-slate-200 font-mono whitespace-pre-wrap break-all select-all">
                                    {sub.textProof}
                                  </div>
                                </div>
                              )}

                              {sub.rejectionReason && (
                                <p className="text-[10px] text-rose-450 leading-relaxed font-mono p-1 bg-rose-950/10 rounded">
                                  <b>Ban Reason:</b> {sub.rejectionReason}
                                </p>
                              )}
                            </div>

                            {sub.status === 'pending' && (
                              <div className="pt-2.5 border-t border-slate-850">
                                {rejectingSubId === sub.id ? (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      value={customRejectionReason}
                                      required
                                      onChange={e => setCustomRejectionReason(e.target.value)}
                                      placeholder="Type reason e.g., Unsubscribed, blurred images..."
                                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white placeholder-slate-700 focus:outline-none"
                                    />
                                    <div className="flex gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleProcessUserProof(sub.id, 'rejected', customRejectionReason)}
                                        className="flex-1 py-1.5 bg-rose-600 text-white font-bold text-xs rounded"
                                      >
                                        Reject Claim
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setRejectingSubId(null)}
                                        className="px-2 py-1.5 bg-slate-950 text-slate-400 rounded text-xs"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleProcessUserProof(sub.id, 'approved')}
                                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-black uppercase rounded-lg shadow"
                                    >
                                      Approve Verification
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRejectingSubId(sub.id)}
                                      className="p-1 px-3 bg-slate-950 border border-slate-800 hover:bg-rose-950/10 text-rose-500 font-bold text-xs rounded-lg uppercase"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: TASKS MASTER CREATOR & ANALYTICS */}
              {activeTab === 'tasks' && (
                <div className="space-y-4 animate-fade">
                  {/* User Submitted Task Campaigns Queue */}
                  {allTasks.filter(t => t.creatorId && t.adminStatus === 'pending').length > 0 && (
                    <div className="p-4 bg-indigo-950/10 border border-indigo-900/40 rounded-3xl space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-amber-500 font-mono tracking-wider flex items-center gap-1.5 animate-pulse">
                          ⚠️ Pending User Campaigns Review ({allTasks.filter(t => t.creatorId && t.adminStatus === 'pending').length})
                        </h4>
                        <span className="text-[10px] bg-amber-500/15 text-amber-300 font-bold px-2 py-0.5 rounded font-mono">Needs Audit</span>
                      </div>
                      <p className="text-[10px] text-slate-400">Review tasks submitted by users using their own USD or Coins. Approving them makes them live immediately on the task board. Rejecting refunds their coins/balance fully.</p>
                      
                      <div className="space-y-3.5">
                        {allTasks.filter(t => t.creatorId && t.adminStatus === 'pending').map(cam => {
                          const creatorUsr = allUsers.find(u => u.uid === cam.creatorId);
                          return (
                            <div key={cam.id} className="p-3.5 bg-slate-900 border border-slate-850 rounded-2xl space-y-3 text-left">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="text-xs font-black text-slate-101">{cam.title}</h5>
                                  <span className="text-[10.5px] text-indigo-400 block mt-1 font-mono">Target URL: <a href={cam.url} target="_blank" rel="noreferrer" className="underline hover:text-indigo-300">{cam.url}</a></span>
                                </div>
                                <span className="text-[9.5px] uppercase font-bold text-slate-400 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded font-mono">
                                  {cam.type}
                                </span>
                              </div>

                              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 text-[10.5px] text-slate-400 font-mono space-y-1">
                                <p className="text-slate-350"><b>Directions:</b> {cam.description}</p>
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-900 mt-1 text-[10px]">
                                  <span>Total Budget: <b className="text-amber-400">{cam.totalBudgetCoins?.toLocaleString()} Coins</b></span>
                                  <span>User Reward: <b className="text-white">{cam.reward} Coins</b></span>
                                  <span>Creator: <b className="text-slate-350">@{creatorUsr?.username || 'Unknown'}</b></span>
                                  <span>Pay Mode: <b className="text-slate-350 uppercase">{cam.paymentMethodUsed}</b></span>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleApproveUserCampaignObj(cam.id)}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black text-[10.5px] uppercase rounded-xl tracking-wider transition cursor-pointer"
                                >
                                  Approve & Go Live
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectUserCampaignObj(cam.id)}
                                  className="px-4 py-1.5 bg-slate-950 border border-slate-800 hover:bg-rose-950/20 text-rose-500 font-bold text-[10.5px] uppercase rounded-xl tracking-wider transition cursor-pointer"
                                >
                                  Reject & Refund
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleCreateTaskCampaign} className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3.5 shadow">
                    <h4 className="text-xs font-black uppercase text-indigo-400 font-mono tracking-widest">Publish Sponsored Advertiser Ad Campaign</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9.5px] uppercase font-bold text-slate-500">Main Header Campaign Title</label>
                        <input
                          type="text"
                          required
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          placeholder="Join official sponsor partner portal"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9.5px] uppercase font-bold text-slate-500">Direct Destination link address</label>
                        <input
                          type="text"
                          required
                          value={newTaskUrl}
                          onChange={e => setNewTaskUrl(e.target.value)}
                          placeholder="https://t.me/exampleBot"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                      <div className="space-y-1">
                        <label className="text-[9.5px] uppercase font-bold text-slate-500">Custom Task Description (টাস্ক এর বিবরণ)</label>
                        <textarea
                          rows={2}
                          value={newTaskDescription}
                          onChange={e => setNewTaskDescription(e.target.value)}
                          placeholder="যেমনঃ বোটে জয়েন করে ৫টি এড দেখুন এবং ইউজারনেম জমা দিন..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none leading-relaxed"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9.5px] uppercase font-bold text-slate-500">Custom Task Image URL (অপশনাল টাস্কের ছবি/আইকন লিংক)</label>
                        <input
                          type="text"
                          value={newTaskImageUrl}
                          onChange={e => setNewTaskImageUrl(e.target.value)}
                          placeholder="https://example.com/logo.png"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-500">Payer Coin Reward</label>
                        <input
                          type="number"
                          required
                          value={newTaskPoints}
                          onChange={e => setNewTaskPoints(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-500">Payer Cash value (USD cent base)</label>
                        <input
                          type="number"
                          required
                          value={newTaskReward}
                          onChange={e => setNewTaskReward(e.target.value)}
                          placeholder="E.g., 20 for $0.20 USD"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-500">Action Type</label>
                        <select
                          value={newTaskType}
                          onChange={e => setNewTaskType(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="telegram_join">Telegram Join Channel</option>
                          <option value="telegram_bot">Telegram Bot Start</option>
                          <option value="youtube_subscribe">YouTube Subscribe</option>
                          <option value="website_visit">Website Visit (30s timers)</option>
                          <option value="instagram_follow">Instagram Follow profile</option>
                          <option value="app_install">App Install & Open</option>
                          <option value="custom">General Custom Form</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-500">Verification Engine</label>
                        <select
                          value={newTaskVerifyType}
                          onChange={e => setNewTaskVerifyType(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="manual">Manual audit (Required screenshots uploads)</option>
                          <option value="auto">Auto verify (Immediate coins grant)</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 font-extrabold text-xs uppercase tracking-wider text-white rounded-xl shadow transition"
                    >
                      Publish Campaign Live
                    </button>
                  </form>

                  {/* Registered campaigns */}
                  <div className="space-y-3">
                    {allTasks.map(t => {
                      const isEditing = editingTaskId === t.id;
                      const taskSubCount = allSubmissions.filter(s => s.taskId === t.id).length;
                      const approvedSubCount = allSubmissions.filter(s => s.taskId === t.id && s.status === 'approved').length;

                      return (
                        <div key={t.id} className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-3 shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-black text-slate-100 flex items-center gap-2">
                                <span>{t.title}</span>
                                <span className={`p-0.5 px-2 text-[8px] font-bold font-mono rounded ${t.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-900' : 'bg-slate-950 text-slate-500 border border-slate-850'}`}>
                                  {t.isActive ? 'Active Campaign' : 'Inactive'}
                                </span>
                              </h4>
                              <p className="text-[9.5px] font-mono text-indigo-400 mt-1 uppercase">
                                🪙 {t.rewardPoints} Coin Credits | $ {t.reward.toFixed(2)} USD | Verification: {t.verificationType}
                              </p>
                              <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                                <span>Total Audited completions: <b>{taskSubCount} instances</b></span>
                                <span>Approved successfully: <b className="text-emerald-400">{approvedSubCount} ({taskSubCount > 0 ? Math.floor((approvedSubCount / taskSubCount) * 100) : 0}%)</b></span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => isEditing ? setEditingTaskId(null) : handleOpenTaskEditor(t)}
                                className="text-[9.5px] bg-slate-950 hover:bg-slate-850 text-slate-400 font-bold p-1.5 px-2.5 rounded-lg border border-slate-800"
                              >
                                {isEditing ? 'Close' : 'Modify'}
                              </button>
                              <button
                                onClick={() => StoreDB.updateTask(t.id, { isActive: !t.isActive })}
                                className={`text-[9.5px] font-bold p-1.5 px-2.5 rounded-lg ${t.isActive ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-550/10 text-emerald-450'}`}
                              >
                                {t.isActive ? 'Pause' : 'Activate'}
                              </button>
                              <button
                                onClick={() => { if (confirm('Delete?')) { StoreDB.deleteTask(t.id); loadAdminCollections(); } }}
                                className="text-rose-400 text-[9.5px]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {isEditing && (
                            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-950/80 space-y-3 animate-fade">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold text-slate-500">Edit Title</label>
                                  <input
                                    type="text"
                                    value={editTaskTitle}
                                    onChange={e => setEditTaskTitle(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold text-slate-500">Edit Action Link</label>
                                  <input
                                    type="text"
                                    value={editTaskUrl}
                                    onChange={e => setEditTaskUrl(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none font-mono"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold text-slate-500">Coin Payout</label>
                                  <input
                                    type="number"
                                    value={editTaskPoints}
                                    onChange={e => setEditTaskPoints(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase font-bold text-slate-500">USD Cent value payout</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={editTaskReward}
                                    onChange={e => setEditTaskReward(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:outline-none font-mono"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={() => handleSaveTaskCampaign(t.id)}
                                className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs uppercase"
                              >
                                Save Changes
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: COMPREHENSIVE WITHDRAWALS FINANCIAL DEPUTIES */}
              {activeTab === 'withdraws' && (
                <div className="space-y-4 animate-fade">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-850 pb-2.5 gap-2">
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-400 font-mono tracking-wider">Cash Payout Disbursement Queues</h4>
                      <p className="text-[10px] text-slate-550">Review player payment payout requests</p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                      <button
                        onClick={handleBulkApprovePayouts}
                        className="text-[10.5px] bg-indigo-600 hover:bg-indigo-500 text-slate-950 font-bold p-1.5 px-3.5 rounded-xl shadow cursor-pointer transition"
                      >
                        🏦 Bulk Approve Pending Cash Payouts
                      </button>
                      <select
                        value={withdrawalFilter}
                        onChange={e => setWithdrawalFilter(e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 text-slate-400 rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                      >
                        <option value="all">⚡ All Statuses</option>
                        <option value="pending">⚙️ Pending Only</option>
                        <option value="approved">✅ Approved</option>
                        <option value="rejected">❌ Rejected / Voided</option>
                      </select>
                      
                      <select
                        value={withdrawalMethodFilter}
                        onChange={e => setWithdrawalMethodFilter(e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 text-slate-400 rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                      >
                        <option value="all">📲 All Methods</option>
                        <option value="bKash">bKash Mobile Money</option>
                        <option value="Nagad">Nagad Wallet</option>
                        <option value="BinanceUSDT">Binance USDT</option>
                        <option value="Payeer">Payeer USD</option>
                      </select>
                    </div>
                  </div>

                  {allWithdrawals.filter(w => (withdrawalFilter === 'all' || w.status === withdrawalFilter) && (withdrawalMethodFilter === 'all' || w.method === withdrawalMethodFilter)).length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-10 border border-slate-850 rounded-2xl">No cash payout withdrawals matching criteria.</p>
                  ) : (
                    <div className="space-y-3">
                      {allWithdrawals.filter(w => (withdrawalFilter === 'all' || w.status === withdrawalFilter) && (withdrawalMethodFilter === 'all' || w.method === withdrawalMethodFilter)).map(w => {
                        const profileCompletes = allUsers.find(u => u.uid === w.userId)?.completedTasksCount || 0;
                        const suspiciousAlertFlag = w.amount > 10 && profileCompletes < 3;

                        return (
                          <div key={w.id} className="p-4 bg-slate-900 border border-slate-850 rounded-3xl flex flex-col justify-between text-left space-y-3 shadow">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] text-indigo-400 font-mono block">BENEFICIARY ACCOUNT: @{w.username}</span>
                                <h4 className="text-xs font-black text-slate-200 mt-1">
                                  Via: <b className="text-slate-100">{w.method}</b> | Account Target: <span className="font-mono bg-slate-950 p-1 px-2 rounded text-indigo-400 text-[10px]">{w.accountDetails}</span>
                                </h4>
                                <span className="text-xs font-black text-emerald-400 block font-mono mt-3">Disbursing cash request value: ${w.amount.toFixed(2)} USD</span>
                                
                                <div className="mt-2.5 flex items-center gap-3 text-[9.5px] font-mono text-slate-500">
                                  <span>Task completions: {profileCompletes} checked</span>
                                  {suspiciousAlertFlag && (
                                    <span className="p-0.5 px-2 bg-red-950 border border-red-900 text-rose-500 font-bold rounded animate-pulse">
                                      ⚠️ Suspicious: Low tasks count completed under payout!
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span className={`text-[10px] uppercase font-black font-mono px-2 py-0.5 rounded ${
                                w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-450' :
                                w.status === 'rejected' ? 'bg-rose-500/10 text-rose-450' :
                                'bg-amber-500/10 text-amber-400 animate-pulse'
                              }`}>
                                {w.status}
                              </span>
                            </div>

                            {w.status === 'pending' && (
                              <div className="flex gap-2 pt-3 border-t border-slate-850">
                                <button
                                  onClick={() => handleProcessRefundPayout(w.id, 'approved')}
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[10.5px] uppercase rounded-xl tracking-wider shadow cursor-pointer"
                                >
                                  Release Transfer Approvals
                                </button>
                                <button
                                  onClick={() => handleProcessRefundPayout(w.id, 'rejected')}
                                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10.5px] uppercase rounded-xl tracking-wider cursor-pointer"
                                >
                                  Void & Reject
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Verification Deposit Requests Panel */}
                  <div className="mt-8 border-t border-slate-850 pt-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-amber-500 font-mono tracking-wider flex items-center gap-1.5">
                        <ArrowUpRight className="w-4 h-4 text-amber-500" /> Unlock Verification Deposit Queue (ডিপোজিট ভেরিফিকেশন কেলম)
                      </h4>
                      <p className="text-[10px] text-slate-550">Review and approve transaction ID submissions made by locked users to unlock their withdrawal privileges.</p>
                    </div>

                    {allDeposits.length === 0 ? (
                      <p className="text-xs text-slate-500 italic text-center py-8 border border-slate-850 rounded-2xl">No verification deposit requests in queue.</p>
                    ) : (
                      <div className="space-y-3">
                        {allDeposits.map(d => {
                          const tgUser = allUsers.find(u => u.uid === d.userId);
                          return (
                            <div key={d.id} className="p-4 bg-slate-900 border border-slate-850 rounded-3xl flex flex-col justify-between text-left space-y-3 shadow hover:border-slate-800 transition">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9.5px] text-amber-500 font-mono font-bold uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-900/30">
                                      {d.method} Verification
                                    </span>
                                    <span className="text-[10.5px] text-slate-400 font-mono font-medium">({d.txId})</span>
                                  </div>
                                  <h4 className="text-xs font-black text-slate-200 mt-2.5">
                                    User target: <b className="text-slate-100">{tgUser?.firstName || 'Unknown'}</b> | TG Username: <span className="font-mono text-indigo-400">@{tgUser?.username || 'no_username'}</span>
                                  </h4>
                                  <span className="text-xs font-mono font-bold text-emerald-450 block mt-2">
                                    Sent Deposit Amount: ${d.amount.toFixed(2)} USD
                                  </span>
                                  <span className="text-[9.5px] text-slate-500 font-mono mt-1 block">
                                    Submitted: {new Date(d.submittedAt).toLocaleString()}
                                  </span>
                                  {d.adminNote && (
                                    <span className="text-[10px] text-slate-400 italic block mt-1">
                                      Note: {d.adminNote}
                                    </span>
                                  )}
                                </div>

                                <span className={`text-[10px] uppercase font-black font-mono px-2 py-0.5 rounded ${
                                  d.status === 'approved' ? 'bg-emerald-500/10 text-emerald-450' :
                                  d.status === 'rejected' ? 'bg-rose-500/10 text-rose-450' :
                                  'bg-amber-500/10 text-amber-400 animate-pulse'
                                }`}>
                                  {d.status}
                                </span>
                              </div>

                              {d.status === 'pending' && (
                                <div className="flex gap-2 pt-3 border-t border-slate-850">
                                  <button
                                    onClick={() => handleProcessDepositVerification(d.id, 'approved')}
                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[10.5px] uppercase rounded-xl tracking-wider shadow cursor-pointer transition"
                                  >
                                    Approve & Credits Balance
                                  </button>
                                  <button
                                    onClick={() => handleProcessDepositVerification(d.id, 'rejected')}
                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10.5px] uppercase rounded-xl tracking-wider cursor-pointer transition"
                                  >
                                    Reject Proof
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: PROMO CODE VOUCHER POOLS & BULK GENERATING */}
              {activeTab === 'codes' && (
                <div className="space-y-4 animate-fade">
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3.5 shadow">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase text-indigo-400 font-mono tracking-widest">Multi-Use Promo Code builder</h4>
                      <button
                        onClick={handleBulkGeneratePromos}
                        className="text-[9.5px] bg-indigo-950 border border-indigo-900 hover:bg-indigo-900 text-indigo-300 font-bold p-1 px-3 rounded-lg"
                      >
                        ⏩ Quick Generate Promo Sets
                      </button>
                    </div>

                    <form onSubmit={handlePublishPromoCode} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9.5px] uppercase font-bold text-slate-550 block">Promo Code text string (auto-upper-cased)</label>
                        <input
                          type="text"
                          required
                          value={newPromoCode}
                          onChange={e => setNewPromoCode(e.target.value)}
                          placeholder="E.g., FREECOINS500"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-550">Comp Coin payout</label>
                          <input
                            type="number"
                            required
                            value={newPromoReward}
                            onChange={e => setNewPromoReward(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-550">Maximum claim limit threshold</label>
                          <input
                            type="number"
                            required
                            value={newPromoLimit}
                            onChange={e => setNewPromoLimit(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs uppercase cursor-pointer"
                      >
                        Deploy Active Promo Code
                      </button>
                    </form>
                  </div>

                  {/* Promo Registry */}
                  <h4 className="text-[10px] font-bold uppercase text-slate-500 border-b border-slate-850 pb-1 flex items-center gap-1 font-mono">My Promo registry codes ({allPromos.length})</h4>
                  {allPromos.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-6">No custom promo codes established in current structures.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {allPromos.map(p => (
                        <div key={p.id} className="p-3.5 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black font-mono text-slate-100">{p.code}</span>
                            <span className="text-[9.5px] font-mono text-slate-450 block mt-0.5">
                              Reward: 🟡 {p.rewardValue} Coins | Usability Claims: <b className="text-indigo-400">{p.usedCount}</b>/{p.usageLimit}
                            </span>
                          </div>
                          <button
                            onClick={() => { StoreDB.deletePromo(p.id); loadAdminCollections(); }}
                            className="p-1 px-2.5 bg-slate-950 hover:bg-red-950/20 text-slate-500 hover:text-rose-450 border border-slate-850 text-[10px] font-bold rounded"
                          >
                            Revoke code
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: SUPPORT TICKETS REFACTOR CHATS & MACRO PRESET REPLIES */}
              {activeTab === 'tickets' && (
                <div className="space-y-4 animate-fade">
                  {activeTicketId ? (
                    /* DEEP ACTIVE CHAT MODULE */
                    (() => {
                      const ticket = allTickets.find(t => t.id === activeTicketId);
                      if (!ticket) return null;
                      return (
                        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-4 space-y-4 shadow-xl">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <button
                              onClick={() => { setActiveTicketId(null); setTicketReplyMsg(''); }}
                              className="text-[10.5px] font-bold text-slate-400 flex items-center gap-1 hover:text-white"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" /> Back to Ticket queue
                            </button>
                            <span className="text-[9.5px] uppercase font-bold text-slate-500 font-mono">TICKET: #{ticket.id.slice(-5)}</span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-slate-200">Issue subject: <span className="text-slate-100">{ticket.subject}</span></h4>
                            <span className="inline-block text-[9.5px] font-mono text-indigo-400 bg-slate-950 border border-slate-850 p-0.5 px-2 rounded-md uppercase font-black">CATEGORY: {ticket.category}</span>
                          </div>

                          <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl max-h-60 overflow-y-auto space-y-3">
                            {ticket.messages.map((m, idx) => (
                              <div key={idx} className={`p-2.5 rounded-xl max-w-[85%] text-left ${m.senderId === 'system_admin' ? 'bg-indigo-950/50 border border-indigo-900/40 ml-auto text-indigo-250' : 'bg-slate-900 border border-slate-800 mr-auto text-slate-300'}`}>
                                <span className="text-[8.5px] font-bold text-slate-500 block uppercase mb-1 font-mono">{m.senderName}:</span>
                                <p className="text-[11px] leading-relaxed break-all whitespace-pre-line">{m.text}</p>
                              </div>
                            ))}
                          </div>

                          {/* Quick support macros */}
                          <div className="space-y-1.5">
                            <span className="text-[8.5px] uppercase font-bold text-slate-500 block font-mono">Support Macro instant template pre-fills:</span>
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => handleResponsePresetReply('invalid')}
                                className="text-[9px] bg-slate-950 border border-slate-850 p-1 px-2.5 rounded text-indigo-400 font-bold"
                              >
                                ❌ Invalid screenshot file
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResponsePresetReply('done')}
                                className="text-[9px] bg-slate-950 border border-slate-850 p-1 px-2.5 rounded text-emerald-400 font-bold"
                              >
                                ✅ Compensation Loaded
                              </button>
                              <button
                                type="button"
                                onClick={() => handleResponsePresetReply('delay')}
                                className="text-[9px] bg-slate-950 border border-slate-850 p-1 px-2.5 rounded text-amber-500 font-bold"
                              >
                                ⏳ Bkash Queue delay alert
                              </button>
                            </div>
                          </div>

                          <form onSubmit={handleAdminTicketReply} className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={ticketReplyMsg}
                              onChange={e => setTicketReplyMsg(e.target.value)}
                              placeholder="Write reply instructions to support customers here..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-700 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="bg-indigo-650 hover:bg-indigo-600 text-white font-black text-xs px-5 rounded-xl cursor-pointer"
                            >
                              Send Response
                            </button>
                          </form>
                          
                          <div className="pt-2 border-t border-slate-850 flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => { StoreDB.replyTicket(ticket.id, 'system_admin', 'Support Operations', '[SYSTEM ALERT: Ticket closed by support staff.]'); setActiveTicketId(null); loadAdminCollections(); }}
                              className="p-1 px-3 text-[10px] bg-rose-500/10 border border-rose-950 text-rose-500 rounded font-bold uppercase transition"
                            >
                              Close Ticket
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* DEEP CURRENT TICKETS LISTS */
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-indigo-400 font-mono tracking-wider">Active Support Tickets</h4>
                      {allTickets.length === 0 ? (
                        <p className="text-xs text-slate-500 italic text-center py-8 border border-dashed border-slate-850 rounded-2xl">No customer support tickets registered.</p>
                      ) : (
                        allTickets.map(t => (
                          <div
                            key={t.id}
                            onClick={() => setActiveTicketId(t.id)}
                            className="bg-slate-900 border border-slate-850 p-3.5 rounded-3xl flex justify-between items-center cursor-pointer hover:border-slate-750 hover:bg-slate-850/40 transition"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${t.status === 'open' ? 'bg-amber-400' : t.status === 'answered' ? 'bg-indigo-400' : 'bg-slate-650'}`} />
                                <span className="font-bold text-xs text-slate-200">{t.subject}</span>
                                <span className="text-[8.5px] uppercase font-mono font-black text-indigo-450 bg-slate-950 border border-slate-850 p-0.5 px-2 rounded-md">{t.category}</span>
                              </div>
                              <span className="text-[9.5px] font-mono text-slate-500 mt-1 block">ID: #{t.id.slice(-5)} | Status: <b className="capitalize text-slate-400">{t.status}</b> | Messages: {t.messages.length}</span>
                            </div>
                            <span className="text-xs text-indigo-450 font-black">View Thread →</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: GLOBAL SETTINGS SWITCHES & UNIFIED BROADCASTER */}
              {activeTab === 'settings' && (
                <div className="space-y-4 animate-fade">
                  {/* UNIFIED BROADCAST NOTIFICATIONS MODULE */}
                  <form onSubmit={handleDispatchNotificationBroadcast} className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3.5 shadow">
                    <h4 className="text-xs font-black text-indigo-400 flex items-center gap-1.5 uppercase font-mono tracking-widest leading-none">
                      <Bell className="w-4 h-4 text-indigo-455 animate-bounce" /> Broadcast Unified Push alert notifications
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1 pb-1">This dispatches a direct structural app banner containing custom messages immediately to ALL registered accounts' dashboards.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9.5px] uppercase font-bold text-slate-550 block">Notification Header Title</label>
                        <input
                          type="text"
                          required
                          value={broadcastTitle}
                          onChange={e => setBroadcastTitle(e.target.value)}
                          placeholder="E.g., Bkash/Nagad Double Rewards Week!"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-650 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9.5px] uppercase font-bold text-slate-550 block">Categories Class</label>
                        <select
                          value={broadcastCategory}
                          onChange={e => setBroadcastCategory(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-350 focus:outline-none"
                        >
                          <option value="system">🚨 System Alerts Policy (General)</option>
                          <option value="reward">🎁 Free Wallet Coins/Prizes Giveaways</option>
                          <option value="task">✅ Sponsoring advertising task verification announcement</option>
                          <option value="withdrawal">💰 Cash Withdraw updates</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] uppercase font-bold text-slate-550 block">Body description message text</label>
                      <textarea
                        rows={2}
                        required
                        value={broadcastMsg}
                        onChange={e => setBroadcastMsg(e.target.value)}
                        placeholder="Double coins loaded across all reward watch ad channels! Claim within 24 hours."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 font-extrabold text-xs uppercase tracking-wider text-white rounded-xl shadow transition"
                    >
                      Broadcast alert announcement to everyone
                    </button>
                  </form>

                  {/* General Config switches */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-4 shadow">
                    <h4 className="text-xs font-black uppercase text-indigo-400 font-mono tracking-widest">Global Platform Configuration Parameters</h4>

                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-2xl select-none">
                        <div className="space-y-0.5">
                          <span className="text-xs text-slate-200 font-bold block">🚨 Maintenance Lock switch</span>
                          <p className="text-[10px] text-slate-500 leading-tight">Shuts down user operations instantly with upgrade shield screen blocks.</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleSettingsOption('maintenanceMode', !systemSettings.maintenanceMode)}
                          className={`text-[9.5px] font-black uppercase p-1.5 px-3 rounded-lg border transition ${
                            systemSettings.maintenanceMode
                              ? 'bg-rose-550/15 border-rose-900 text-rose-500'
                              : 'bg-slate-950 border-slate-850 text-slate-450'
                          }`}
                        >
                          {systemSettings.maintenanceMode ? 'LOCKED (ON)' : 'UNLOCKED (OFF)'}
                        </button>
                      </div>

                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 select-none">
                        <label className="text-xs text-slate-200 font-bold flex justify-between font-mono leading-normal">
                          <span>Minimum Referrals constraint (উইথড্র করতে সর্বনিম্ন রেফারেল)</span>
                          <span className="text-amber-400 font-black">{systemSettings.minReferrals || 0} Referrals</span>
                        </label>
                        <p className="text-[10px] text-slate-500 leading-tight">Users must invite at least this number of active referrals before being allowed to request a payout.</p>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          value={systemSettings.minReferrals || 0}
                          onChange={e => handleToggleSettingsOption('minReferrals', parseInt(e.target.value))}
                          className="w-full accent-amber-550 cursor-pointer mt-1"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-450 flex justify-between font-mono font-bold leading-normal">
                          <span>Level 1 Affiliate Revenue Share Ratio</span>
                          <span className="text-indigo-400">{systemSettings.commissionL1}% commission</span>
                        </label>
                        <input
                          type="range"
                          min="5"
                          max="40"
                          value={systemSettings.commissionL1}
                          onChange={e => handleToggleSettingsOption('commissionL1', parseInt(e.target.value))}
                          className="w-full accent-indigo-550"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-450 flex justify-between font-mono font-bold leading-normal">
                          <span>Level 2 Affiliate Revenue Share Ratio</span>
                          <span className="text-purple-400">{systemSettings.commissionL2}% commission</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          value={systemSettings.commissionL2}
                          onChange={e => handleToggleSettingsOption('commissionL2', parseInt(e.target.value))}
                          className="w-full accent-purple-550"
                        />
                      </div>

                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 select-none text-left">
                        <label className="text-xs text-slate-200 font-bold flex justify-between font-mono leading-normal">
                          <span>Minimum Deposit to Unlock Withdrawal (উইথড্র করতে সর্বনিম্ন ডিপোজিট)</span>
                          <span className="text-amber-400 font-black">${((systemSettings as any).minDepositAmount || 2.0).toFixed(2)} USD</span>
                        </label>
                        <p className="text-[10px] text-slate-500 leading-tight">Amount user must submit in transaction confirmation to fulfill unlock requirement.</p>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={(systemSettings as any).minDepositAmount || 2.0}
                          onChange={e => handleToggleSettingsOption('minDepositAmount', parseFloat(e.target.value) || 2.0)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 select-none text-left">
                        <label className="text-xs text-slate-200 font-bold flex justify-between font-mono leading-normal">
                          <span>Daily Ad View Limit (প্রতিদিন সর্বোচ্চ কতটি এড দেখতে পারবে)</span>
                          <span className="text-indigo-400 font-black">{systemSettings.dailyAdsLimit ?? 25} Ads / day</span>
                        </label>
                        <p className="text-[10px] text-slate-500 leading-tight">Enforces user daily 24-hour viewing block threshold to restrict click-abuse scripts.</p>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={systemSettings.dailyAdsLimit ?? 25}
                          onChange={e => handleToggleSettingsOption('dailyAdsLimit', parseInt(e.target.value) || 25)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl space-y-1.5 select-none text-left">
                        <label className="text-xs text-slate-200 font-bold block font-mono">
                          Deposit Address Details (ডিপোজিট এড্রেস ও বাইন্যান্স পে আইডি)
                        </label>
                        <p className="text-[10px] text-slate-500 leading-tight">Admin bKash, Nagad numbers, list of credentials, or Binance details shown to user when prompted to unlock.</p>
                        <textarea
                          rows={3}
                          value={(systemSettings as any).depositWalletAddress || ''}
                          onChange={e => handleToggleSettingsOption('depositWalletAddress', e.target.value)}
                          placeholder="E.g., bKash Personal: +88017XXXXXXXX&#10;Nagad Personal: +88018XXXXXXXX&#10;Binance Pay ID: 12345678"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] text-slate-400 block font-bold">Default Telegram Support Bot URI Link</label>
                        <input
                          type="text"
                          value={systemSettings.telegramBotUrl}
                          onChange={e => handleToggleSettingsOption('telegramBotUrl', e.target.value)}
                          placeholder="https://t.me/TaskEarnProSupport_bot"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                        <div className="space-y-1">
                          <label className="text-[11px] text-emerald-450 block font-black uppercase font-mono tracking-wider">
                            Coin-to-USD Exchange rate (কয়েন এক্সচেঞ্জ রেট)
                          </label>
                          <input
                            type="number"
                            min="100"
                            max="50000"
                            value={(systemSettings as any).coinsPerDollar ?? 1000}
                            onChange={e => handleToggleSettingsOption('coinsPerDollar', parseInt(e.target.value) || 1000)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
                          />
                          <p className="text-[9.5px] text-slate-500 leading-normal font-mono">Coins required per $1.00 USD (E.g., 1000)</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-sky-400 block font-black uppercase font-mono tracking-wider">
                            Telegram Ads Bot Link (বিজ্ঞাপন টেলিগ্রাম বোট লিংক)
                          </label>
                          <input
                            type="text"
                            value={(systemSettings as any).telegramBotAdUrl ?? ''}
                            onChange={e => handleToggleSettingsOption('telegramBotAdUrl', e.target.value.trim())}
                            placeholder="https://t.me/your_sponsor_ads_bot"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
                          />
                          <p className="text-[9.5px] text-slate-500 leading-normal font-mono">Default ad bot URL if individual ad campaign has no direct URL link</p>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] text-slate-400 block font-bold">Admin Support Box Link (সাপোর্ট নেওয়ার জন্য কাস্টম লিংক)</label>
                        <input
                          type="text"
                          value={systemSettings.supportLink || ''}
                          onChange={e => handleToggleSettingsOption('supportLink', e.target.value)}
                          placeholder="https://t.me/TaskEarnProSupport"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-400 block font-bold">Client Dashboard Announcement Note banner</label>
                        <textarea
                          rows={2}
                          value={systemSettings.announcement}
                          onChange={e => handleToggleSettingsOption('announcement', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* LUCKY GAMES SECTION CONTROL CENTER */}
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-3xl space-y-4 shadow animate-fade">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-100 font-mono tracking-wider leading-none">
                          🎮 Lucky Games Section Management (গেম সেকশন নিয়ন্ত্রণ)
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          Enable/disable user games (Lucky Spin, Scratch Cards, Mystery Chest) and configure dynamic coin costs and reward scaling. Enforces user daily 1 play restriction limit.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-850 animate-fade">
                      {/* Game status switch */}
                      <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-850 rounded-2xl select-none">
                        <div className="space-y-0.5 text-left">
                          <span className="text-xs text-slate-200 font-bold block">Game Section Active Status (গেম সেকশন চালু/বন্ধ)</span>
                          <p className="text-[10px] text-slate-550 leading-tight">Disable to hide the entire Lucky Games section from student/client screens.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSettingsOption('gameSectionEnabled', systemSettings.gameSectionEnabled !== false ? false : true)}
                          className={`text-[9.5px] font-black uppercase p-1.5 px-3 rounded-lg border transition ${
                            systemSettings.gameSectionEnabled !== false
                              ? 'bg-emerald-500/15 border-emerald-900 text-emerald-400'
                              : 'bg-rose-500/15 border-rose-900 text-rose-450'
                          }`}
                        >
                          {systemSettings.gameSectionEnabled !== false ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>

                      {/* Spin Cost Config */}
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-2xl space-y-1.5 select-none text-left">
                        <div className="flex justify-between items-center text-xs font-bold leading-normal text-slate-200">
                          <span>Lucky Wheel Spin Cost (স্পিন করতে কয়েন খরচ)</span>
                          <span className="text-indigo-400 font-black">{systemSettings.gameSpinCost ?? 100} Coins</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">Configure how many virtual earning coins users must pay to spin the dynamic rewards wheel.</p>
                        <input
                          type="range"
                          min="10"
                          max="500"
                          step="10"
                          value={systemSettings.gameSpinCost ?? 100}
                          onChange={e => handleToggleSettingsOption('gameSpinCost', parseInt(e.target.value))}
                          className="w-full accent-indigo-550 cursor-pointer mt-1"
                        />
                      </div>

                      {/* Reward Multiplier Config */}
                      <div className="p-3 bg-slate-900 border border-slate-850 rounded-2xl space-y-1.5 select-none text-left">
                        <div className="flex justify-between items-center text-xs font-bold leading-normal text-slate-200">
                          <span>Game Reward Multiplier (গেম পুরস্কারের গুণিতক)</span>
                          <span className="text-amber-400 font-black">x{(systemSettings.gameSpinRewardMultiplier ?? 1.0).toFixed(1)} Payout</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight font-sans">
                          Scale all game payouts (jackpots, mystery chest credits and scratch card wins) using a global factor rate.
                        </p>
                        <input
                          type="range"
                          min="0.5"
                          max="5.0"
                          step="0.5"
                          value={systemSettings.gameSpinRewardMultiplier ?? 1.0}
                          onChange={e => handleToggleSettingsOption('gameSpinRewardMultiplier', parseFloat(e.target.value))}
                          className="w-full accent-amber-550 cursor-pointer mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* DYNAMIC MULTIPLE HIGH CPM AD PLATFORMS & SDK SCRIPT MANAGER */}
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-3xl space-y-5 shadow">
                    <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-850">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                        <div>
                          <h4 className="text-xs font-black uppercase text-slate-100 font-mono tracking-wider leading-none">
                            📺 Dynamic Multi-Ad Manager & Script Integrator
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                            Configure, edit, and instantly deploy multiple high-paying ad scripts (Monetag, Adsterra, Propeller, Google Ads, etc.). Scripts run natively on the user side for 100% active visibility and anti-iframe bypass!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearAdForm}
                        className="py-1 px-3 bg-indigo-950/40 hover:bg-indigo-900/40 text-[9.5px] text-indigo-400 border border-indigo-900/50 rounded-lg font-mono font-bold uppercase transition"
                      >
                        Reset Form
                      </button>
                    </div>

                    {/* Ads List Dashboard */}
                    <div className="space-y-3">
                      <h5 className="text-[10.5px] font-mono uppercase font-black text-slate-400 tracking-wider">
                        Active Configured Ad Inventories ({ (systemSettings.dynamicAds || []).length })
                      </h5>

                      {!(systemSettings.dynamicAds && systemSettings.dynamicAds.length > 0) ? (
                        <p className="text-[11px] text-slate-500 italic p-4 text-center bg-slate-900/20 border border-slate-850 rounded-2xl">
                          No custom ads configured yet. Use the builder form below to configure instant Monetag or Adsterra scripts!
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {systemSettings.dynamicAds.map((ad: AdOffer) => {
                            const isAdActive = ad.isActive !== false;
                            return (
                              <div
                                key={ad.id}
                                className={`p-3 bg-slate-900 border rounded-2xl flex flex-col justify-between space-y-3 transition ${
                                  isAdActive ? 'border-indigo-950' : 'border-slate-850 opacity-60'
                                }`}
                              >
                                <div>
                                  <div className="flex justify-between items-start gap-1">
                                    <span className="text-[8.5px] font-mono p-0.5 px-2 bg-slate-950 border border-slate-850 text-indigo-400 font-extrabold uppercase rounded">
                                      {ad.network} • {ad.format}
                                    </span>
                                    <button
                                      onClick={() => handleToggleAdActive(ad.id)}
                                      className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold font-mono transition ${
                                        isAdActive ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30' : 'bg-slate-950 text-slate-500 border border-slate-850'
                                      }`}
                                    >
                                      {isAdActive ? '● ACTIVE' : '○ INACTIVE'}
                                    </button>
                                  </div>
                                  <h6 className="text-xs font-extrabold text-slate-200 mt-2 font-sans">{ad.title}</h6>
                                  
                                  <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-850/40 text-[10px] font-mono text-slate-450">
                                    <div>
                                      <span>Reward:</span> <b className="text-amber-500">🟡 +{ad.reward * 10} Coins</b>
                                    </div>
                                    <div>
                                      <span>Cooldown:</span> <b className="text-indigo-400">{ad.cooldownSeconds}s</b>
                                    </div>
                                  </div>

                                  {ad.directUrl && (
                                    <div className="mt-2 text-[9px] font-mono text-slate-450 bg-slate-950 p-1.5 rounded border border-slate-850 truncate leading-relaxed">
                                      🔗 {ad.directUrl}
                                    </div>
                                  )}
                                </div>

                                 <div className="flex items-center gap-2 pt-2 border-t border-slate-850/40 justify-end">
                                   <button
                                     onClick={() => handleStartEditAd(ad)}
                                     type="button"
                                     className="p-1 px-3 bg-slate-950 hover:bg-slate-850 text-slate-400 border border-slate-800 text-[10px] rounded-lg transition"
                                   >
                                     Edit
                                   </button>
                                   <button
                                     onClick={() => handleDeleteAd(ad.id)}
                                     type="button"
                                     className="p-1 px-3 bg-rose-950/20 hover:bg-rose-900/20 text-rose-450 text-[10px] rounded-lg border border-rose-900/20 transition"
                                   >
                                     Delete
                                   </button>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       )}
                     </div>

                     {/* Builder Form Box */}
                     <form onSubmit={handleSaveDynamicAd} className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl space-y-4 text-left">
                       <span className="text-[9.5px] uppercase font-bold font-mono text-slate-400 tracking-wider flex items-center gap-1.5">
                         <Plus className="w-3.5 h-3.5 text-indigo-400" />
                         {editingAdId ? `📝 Edit Ad Configuration: ID [${editingAdId.slice(0, 8)}]` : '✨ Add New Telegram Ad Bot Campaign (বিজ্ঞাপন ক্যাম্পেইন সংযুক্ত করুন)'}
                       </span>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div>
                           <label className="text-[9.5px] uppercase font-black text-slate-450 block mb-1">Ad Campaign Title (বিজ্ঞাপনের নাম)</label>
                           <input
                             type="text"
                             value={adFormTitle}
                             onChange={e => setAdFormTitle(e.target.value)}
                             placeholder="E.g., Claim Bonus Reward Bot, Starry Promo"
                             className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-indigo-505 focus:outline-none"
                           />
                         </div>

                         <div className="grid grid-cols-2 gap-2">
                           <div>
                             <label className="text-[9.5px] uppercase font-black text-slate-450 block mb-1">Ad Network (বিজ্ঞাপন নেটওয়ার্ক)</label>
                             <select
                               value={adFormNetwork}
                               onChange={e => setAdFormNetwork(e.target.value)}
                               className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                             >
                               <option value="monetag">Monetag</option>
                               <option value="adsterra">Adsterra</option>
                               <option value="propeller">PropellerAds</option>
                               <option value="gigapub">GigaPub</option>
                               <option value="telegram_bot">Telegram Bot</option>
                               <option value="custom">Custom Partner</option>
                             </select>
                           </div>
                           <div>
                             <label className="text-[9.5px] uppercase font-black text-slate-450 block mb-1">Format (বিজ্ঞাপন ফরম্যাট)</label>
                             <select
                               value={adFormFormat}
                               onChange={e => setAdFormFormat(e.target.value)}
                               className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                             >
                               <option value="banner">Banner / SmartTag</option>
                               <option value="popup">Popunder / Click</option>
                               <option value="rewarded">Rewarded Video</option>
                               <option value="interstitial">Interstitial Page</option>
                             </select>
                           </div>
                         </div>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div>
                           <label className="text-[9.5px] uppercase font-black text-slate-450 block mb-1">Reward Coins (যেমন: 1.5 multiplier = 15 coins)</label>
                           <input
                             type="number"
                             step="0.1"
                             value={adFormReward}
                             onChange={e => setAdFormReward(e.target.value)}
                             placeholder="Defaults to 1.5"
                             className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:border-indigo-505 focus:outline-none"
                           />
                         </div>
                         <div>
                           <label className="text-[9.5px] uppercase font-black text-slate-450 block mb-1">Cooldown seconds (কুলডাউন সেকেন্ডস)</label>
                           <input
                             type="number"
                             value={adFormCooldown}
                             onChange={e => setAdFormCooldown(e.target.value)}
                             placeholder="Defaults to 30"
                             className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:border-indigo-505 focus:outline-none"
                           />
                         </div>
                       </div>

                       <div>
                         <label className="text-[9.5px] uppercase font-black text-slate-450 block mb-1">Telegram Ads Bot Link (বিজ্ঞাপন টেলিগ্রাম বোট লিংক) [Required]</label>
                         <input
                           type="text"
                           value={adFormDirectUrl}
                           onChange={e => setAdFormDirectUrl(e.target.value)}
                           placeholder="E.g., https://t.me/TaskEarnProBot or Sponsor channel bot hyperlink"
                           className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:border-indigo-505 focus:outline-none"
                         />
                       </div>

                       <div className="flex items-center gap-2.5 pt-2">
                         <button
                           type="submit"
                           className="flex-1 py-2 px-4 bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-600 hover:to-purple-600 text-xs font-black text-white rounded-xl transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                         >
                           <Save className="w-4 h-4" />
                           {editingAdId ? 'UPDATE AD OFFER CONFIG' : 'DEPLOY ACTIVE AD TO CENTER'}
                         </button>
                         {editingAdId && (
                           <button
                             type="button"
                             onClick={handleClearAdForm}
                             className="py-2 px-4 bg-slate-950 hover:bg-slate-900 text-slate-400 text-xs font-bold rounded-xl border border-slate-800 transition"
                           >
                             Cancel
                           </button>
                         )}
                       </div>
                     </form>
                   </div>


                  {/* PRODUCTION-READY AD NETWORKS CORE (MONETAG & GIGAPUB CORES) */}
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-3xl space-y-5 shadow animate-fade">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                      <Sliders className="w-5 h-5 text-indigo-400 animate-pulse" />
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-100 font-mono tracking-wider leading-none">
                          🔌 Production Monetag & GigaPub Ad SDK Integrators
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1.5 leading-normal">
                          Enable ad channels, configure Zone IDs / Placement Keys, and track user impressions with high-fidelity analytics stored directly in Firestore <b>settings/adNetworks</b>.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSaveAdNetworkConfig} className="space-y-5 text-left">
                      
                      {/* MONETAG AD CONTEXT */}
                      <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-850/40 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                            <h5 className="text-[11.5px] font-black uppercase text-indigo-400 font-mono tracking-wider">
                              Monetag Official SDK Integration
                            </h5>
                          </div>
                          
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={adNetworkSettings.monetag.enabled}
                              onChange={e => setAdNetworkSettings({
                                ...adNetworkSettings,
                                monetag: { ...adNetworkSettings.monetag, enabled: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-850 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top peer-checked:bg-indigo-600 peer-checked:after:bg-white" style={{ position: "relative" }} />
                            <span className="ml-2 text-[10px] font-bold font-mono uppercase text-slate-400 peer-checked:text-indigo-400">
                              {adNetworkSettings.monetag.enabled ? 'ON' : 'OFF'}
                            </span>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-450 block">Banner Zone ID</label>
                            <input
                              type="text"
                              value={adNetworkSettings.monetag.bannerZoneId}
                              onChange={e => setAdNetworkSettings({
                                ...adNetworkSettings,
                                monetag: { ...adNetworkSettings.monetag, bannerZoneId: e.target.value.trim() }
                              })}
                              placeholder="E.g., 11082183"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-450 block">Rewarded Video Zone ID</label>
                            <input
                              type="text"
                              value={adNetworkSettings.monetag.rewardedZoneId}
                              onChange={e => setAdNetworkSettings({
                                ...adNetworkSettings,
                                monetag: { ...adNetworkSettings.monetag, rewardedZoneId: e.target.value.trim() }
                              })}
                              placeholder="E.g., 11082184"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-450 block">Interstitial Zone ID</label>
                            <input
                              type="text"
                              value={adNetworkSettings.monetag.interstitialZoneId}
                              onChange={e => setAdNetworkSettings({
                                ...adNetworkSettings,
                                monetag: { ...adNetworkSettings.monetag, interstitialZoneId: e.target.value.trim() }
                              })}
                              placeholder="E.g., 11082185"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* GIGAPUB AD CONTEXT */}
                      <div className="p-4 bg-slate-900/30 border border-slate-850 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-850/40 pb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                            <h5 className="text-[11.5px] font-black uppercase text-purple-400 font-mono tracking-wider">
                              GigaPub Official SDK Integration
                            </h5>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={adNetworkSettings.gigapub.enabled}
                              onChange={e => setAdNetworkSettings({
                                ...adNetworkSettings,
                                gigapub: { ...adNetworkSettings.gigapub, enabled: e.target.checked }
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-850 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top peer-checked:bg-purple-600 peer-checked:after:bg-white" style={{ position: "relative" }} />
                            <span className="ml-2 text-[10px] font-bold font-mono uppercase text-slate-400 peer-checked:text-purple-400">
                              {adNetworkSettings.gigapub.enabled ? 'ON' : 'OFF'}
                            </span>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-450 block">Banner Placement ID</label>
                            <input
                              type="text"
                              value={adNetworkSettings.gigapub.bannerPlacementId}
                              onChange={e => setAdNetworkSettings({
                                ...adNetworkSettings,
                                gigapub: { ...adNetworkSettings.gigapub, bannerPlacementId: e.target.value.trim() }
                              })}
                              placeholder="E.g., gp_banner_101"
                              className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-450 block">Rewarded Video ID</label>
                            <input
                              type="text"
                              value={adNetworkSettings.gigapub.rewardedPlacementId}
                              onChange={e => setAdNetworkSettings({
                                ...adNetworkSettings,
                                gigapub: { ...adNetworkSettings.gigapub, rewardedPlacementId: e.target.value.trim() }
                              })}
                              placeholder="E.g., gp_reward_202"
                              className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-450 block">Stand-alone Video ID</label>
                            <input
                              type="text"
                              value={adNetworkSettings.gigapub.videoPlacementId}
                              onChange={e => setAdNetworkSettings({
                                ...adNetworkSettings,
                                gigapub: { ...adNetworkSettings.gigapub, videoPlacementId: e.target.value.trim() }
                              })}
                              placeholder="E.g., gp_video_303"
                              className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 font-mono focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-indigo-650 to-purple-650 hover:from-indigo-600 hover:to-purple-600 text-xs font-black text-white rounded-xl uppercase tracking-wider shadow transition duration-200 cursor-pointer text-center"
                      >
                        SAVE & SYNC SDK CONFIGURATIONS TO FIRESTORE
                      </button>

                    </form>
                  </div>
                  
                </div>
              )}

              {/* TAB 9: VIP & ACHIEVEMENTS MANAGEMENT */}
              {activeTab === 'vip_achieve' && (
                <div className="space-y-6 animate-fade">
                  {/* VIP UPGRADE CLUB TIER CONFIGURATOR */}
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-3xl space-y-4 shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-850">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-100 flex items-center gap-1.5 font-mono tracking-wider">
                          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> 💎 VIP Upgrade Club Configuration (ভিআইপি মেম্বারশিপ নিয়ন্ত্রণ)
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Configure dynamic pricing multipliers and descriptions for each premium earning level tier accessible by students.
                        </p>
                      </div>
                      <button
                        onClick={handleClearVipForm}
                        className="text-[9.5px] uppercase font-bold text-slate-400 px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition w-fit"
                      >
                        Add New Level TIER
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Left: Tiers List (7 columns) */}
                      <div className="lg:col-span-7 space-y-2.5">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono tracking-wider block">
                          Current VIP Levels ({allVipTiers.length})
                        </span>
                        {allVipTiers.length === 0 ? (
                          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-850">
                            <p className="text-xs text-slate-550">No VIP Tiers found. Reset or add one!</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                            {allVipTiers.sort((a,b)=>a.level-b.level).map((tier) => (
                              <div
                                key={tier.level}
                                className="bg-slate-900 border border-slate-850/80 p-3 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-750 transition"
                              >
                                <div className="space-y-1 text-left min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-extrabold text-slate-100 flex items-center gap-1">
                                      Level {tier.level}: <b className="text-indigo-300 font-black">{tier.name}</b>
                                    </span>
                                    {tier.level === 0 && (
                                      <span className="p-0.5 px-1.5 bg-slate-800 text-slate-400 text-[8.5px] rounded font-bold font-mono">
                                        DEFAULT
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-450 leading-relaxed truncate">{tier.desc}</p>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px]">
                                    <span className="text-emerald-400 font-bold font-mono">Multi: {tier.multi}</span>
                                    <span className="text-slate-550">•</span>
                                    <span className="text-amber-500 font-medium font-mono">Cost: {tier.cost === 0 ? 'Free' : `${tier.cost.toLocaleString()} Coins`}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button
                                    onClick={() => handleStartEditVipTier(tier)}
                                    className="p-1.5 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-lg cursor-pointer transition select-none"
                                    title="Edit Level"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>
                                  {tier.level !== 0 && (
                                    <button
                                      onClick={() => handleDeleteVipTier(tier.level)}
                                      className="p-1.5 hover:bg-rose-950/40 text-rose-455 hover:text-rose-400 rounded-lg cursor-pointer transition select-none"
                                      title="Delete Level"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Add/Edit Form (5 columns) */}
                      <form onSubmit={handleSaveVipTier} className="lg:col-span-5 bg-slate-900/50 border border-slate-850 p-4 rounded-2xl space-y-3 text-left">
                        <span className="text-[10px] uppercase font-mono tracking-widest font-black text-rose-455 block leading-none pb-1">
                          {editingVipLevel !== null ? `⚡ Editing LEVEL ${editingVipLevel} Tier` : '✨ Add New VIP Level Tier'}
                        </span>

                        <div className="space-y-1 animate-fade">
                          <label className="text-[9.5px] uppercase font-bold text-slate-500 block">VIP Level Numeric Code</label>
                          <input
                            type="number"
                            required
                            min="0"
                            max="50"
                            disabled={editingVipLevel !== null}
                            value={vipFormLevel}
                            onChange={e => setVipFormLevel(e.target.value)}
                            placeholder="E.g., 6"
                            className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 disabled:border-slate-850 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-700 font-mono focus:outline-none focus:border-indigo-505"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Level Name Display</label>
                          <input
                            type="text"
                            required
                            value={vipFormName}
                            onChange={e => setVipFormName(e.target.value)}
                            placeholder="E.g., Ruby Elite"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-505"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Earning Multiplier</label>
                            <input
                              type="text"
                              required
                              value={vipFormMulti}
                              onChange={e => setVipFormMulti(e.target.value)}
                              placeholder="E.g., 1.6x"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-700 focus:outline-none font-mono focus:border-indigo-505"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Price (Coins cost)</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={vipFormCost}
                              onChange={e => setVipFormCost(e.target.value)}
                              placeholder="E.g., 50000"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none font-mono focus:border-indigo-505"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Membership Perks Description</label>
                          <textarea
                            rows={2}
                            required
                            value={vipFormDesc}
                            onChange={e => setVipFormDesc(e.target.value)}
                            placeholder="60% extra coins on ads & top priority withdrawals."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-505"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            className="flex-1 py-1.8 bg-indigo-650 hover:bg-indigo-550 text-white font-extrabold text-xs rounded-xl cursor-pointer transition select-none"
                          >
                            {editingVipLevel !== null ? 'Save Changes' : 'Create Level'}
                          </button>
                          <button
                            type="button"
                            onClick={handleClearVipForm}
                            className="px-3.5 py-1.8 bg-slate-800 hover:bg-slate-750 text-slate-350 text-xs font-bold rounded-xl cursor-pointer transition select-none"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* ACCOMPLISHMENTS, MEDALS, AND BADGES CONFIGURATION */}
                  <div className="bg-slate-950 border border-slate-850 p-5 rounded-3xl space-y-4 shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-850">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-100 flex items-center gap-1.5 font-mono tracking-wider">
                          <Trophy className="w-4 h-4 text-yellow-500 animate-bounce" /> 🏆 Medals & Badges Achievements Manager (মেডেল ও অর্জনসমূহ নিয়ন্ত্রণ)
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Define rewards, count targets, and task conditions for student badges unlocked automatically on client profiles.
                        </p>
                      </div>
                      <button
                        onClick={handleClearAchForm}
                        className="text-[9.5px] uppercase font-bold text-slate-400 px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition w-fit"
                      >
                        Add New Medal Badge
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Left: Achievements List (7 columns) */}
                      <div className="lg:col-span-7 space-y-2.5">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono tracking-wider block">
                          Current Medals & Badges ({allAchievements.length})
                        </span>
                        {allAchievements.length === 0 ? (
                          <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-850">
                            <p className="text-xs text-slate-550">No achievement medal badges found in database.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                            {allAchievements.map((ach) => (
                              <div
                                key={ach.id}
                                className="bg-slate-900 border border-slate-850 p-3.5 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-750 transition animate-fade"
                              >
                                <div className="space-y-1 text-left min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-extrabold text-slate-100 flex items-center gap-1">
                                      🏆 {ach.title}
                                    </span>
                                    <span className="p-0.5 px-2 bg-slate-950 border border-slate-850 text-indigo-400 text-[8.5px] uppercase rounded font-bold font-mono">
                                      {ach.metric}
                                    </span>
                                  </div>
                                  <p className="text-[10.5px] text-slate-450 leading-normal font-sans">{ach.description}</p>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px] font-mono mt-1 pt-1 border-t border-slate-850/40 pb-0.5">
                                    <span className="text-indigo-455 font-extrabold">Goal: {ach.targetCount}</span>
                                    <span className="text-slate-650">|</span>
                                    <span className="text-emerald-400 font-extrabold">Coins: +{ach.rewardCoins} 🟡</span>
                                    <span className="text-slate-650">|</span>
                                    <span className="text-indigo-350 font-extrabold">XP: +{ach.rewardXP} XP</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button
                                    onClick={() => handleStartEditAchievement(ach)}
                                    className="p-1.5 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 rounded-lg cursor-pointer transition select-none"
                                    title="Edit Medal Badge"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAchievement(ach.id)}
                                    className="p-1.5 hover:bg-rose-950/40 text-rose-455 hover:text-rose-400 rounded-lg cursor-pointer transition select-none"
                                    title="Delete Medal Badge"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Add/Edit Achievement Form (5 columns) */}
                      <form onSubmit={handleSaveAchievement} className="lg:col-span-5 bg-slate-900/50 border border-slate-850 p-4 rounded-2xl space-y-3 text-left">
                        <span className="text-[10px] uppercase font-mono tracking-widest font-black text-rose-455 block leading-none pb-1">
                          {editingAchId !== null ? `⚡ Editing Badge: ${editingAchId}` : '✨ Create New Medal/Badge'}
                        </span>

                        <div className="space-y-1">
                          <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Achievement Unique ID</label>
                          <input
                            type="text"
                            required
                            disabled={editingAchId !== null}
                            value={achFormId}
                            onChange={e => setAchFormId(e.target.value)}
                            placeholder="E.g., ach_refer_pro_100"
                            className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 disabled:border-slate-850 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-700 font-mono focus:outline-none focus:border-indigo-505"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Medal Shield Title</label>
                          <input
                            type="text"
                            required
                            value={achFormTitle}
                            onChange={e => setAchFormTitle(e.target.value)}
                            placeholder="E.g., Referrals Tycoon"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-505"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Goal Target description info</label>
                          <input
                            type="text"
                            required
                            value={achFormDesc}
                            onChange={e => setAchFormDesc(e.target.value)}
                            placeholder="E.g., Recruit 10 successful referrals"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-505"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Goal Condition metric</label>
                            <select
                              value={achFormMetric}
                              onChange={e => setAchFormMetric(e.target.value as any)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-505 hover:cursor-pointer"
                            >
                              <option value="tasks">🎯 Tasks Approved</option>
                              <option value="ads">📺 Ads Watched</option>
                              <option value="surveys">📋 Surveys Finished</option>
                              <option value="referrals">👥 Referrals Registered</option>
                              <option value="earnings">💰 Total Earning factor</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Goal Target Count</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={achFormTarget}
                              onChange={e => setAchFormTarget(e.target.value)}
                              placeholder="E.g., 100"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none font-mono focus:border-indigo-505"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Reward Coins</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={achFormCoins}
                              onChange={e => setAchFormCoins(e.target.value)}
                              placeholder="E.g., 500"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none font-mono focus:border-indigo-505"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9.5px] uppercase font-bold text-slate-500 block">Reward XP bonus</label>
                            <input
                              type="number"
                              required
                              min="0"
                              value={achFormXp}
                              onChange={e => setAchFormXp(e.target.value)}
                              placeholder="E.g., 1000"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none font-mono focus:border-indigo-505"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            className="flex-1 py-1.8 bg-indigo-650 hover:bg-indigo-550 text-white font-bold text-xs rounded-xl cursor-pointer transition focus:outline-none select-none"
                          >
                            {editingAchId !== null ? 'Save Changes' : 'Create Medal Badge'}
                          </button>
                          <button
                            type="button"
                            onClick={handleClearAchForm}
                            className="px-3.5 py-1.8 bg-slate-800 hover:bg-slate-750 text-slate-350 text-xs font-bold rounded-xl cursor-pointer transition select-none"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
