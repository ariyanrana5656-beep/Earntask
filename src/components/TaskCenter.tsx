import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Play, Youtube, Send, Laptop, Smartphone, CheckCircle, 
  Clock, AlertCircle, Sparkles, Filter, ExternalLink, Image, ArrowRight, 
  ShieldCheck, PlusCircle, List, RotateCcw, Megaphone
} from 'lucide-react';
import { Task, UserProfile, TaskSubmission, TaskType } from '../types';
import { StoreDB } from '../services/store';

interface TaskCenterProps {
  user: UserProfile;
  onRefreshUser: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function TaskCenter({ user, onRefreshUser, showToast }: TaskCenterProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [userCampaigns, setUserCampaigns] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submissionScreenshot, setSubmissionScreenshot] = useState('');
  
  // Tabs: 'earn' = Complete tasks, 'promote' = Advertise/Submit campaigns
  const [mainTab, setMainTab] = useState<'earn' | 'promote'>('earn');
  const [activeTab, setActiveTab] = useState<'all' | 'telegram' | 'social' | 'apps'>('all');
  const [statusFilter, setStatusFilter] = useState<'available' | 'pending' | 'completed'>('available');
  const [loadingCode, setLoadingCode] = useState(false);
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  // New campaign form state
  const [newCamTitle, setNewCamTitle] = useState('');
  const [newCamDesc, setNewCamDesc] = useState('');
  const [newCamUrl, setNewCamUrl] = useState('');
  const [newCamType, setNewCamType] = useState<TaskType>('telegram_join');
  const [newCamTarget, setNewCamTarget] = useState(20);
  const [newCamCostOffer, setNewCamCostOffer] = useState(100);
  const [newCamPayMethod, setNewCamPayMethod] = useState<'coins' | 'usd'>('coins');

  useEffect(() => {
    loadTasksAndLogs();
  }, [user.uid, mainTab]);

  const loadTasksAndLogs = () => {
    setTasks(StoreDB.getTasks());
    setSubmissions(StoreDB.getUserSubmissions(user.uid));
    setUserCampaigns(StoreDB.getUserCreatedTasks(user.uid));
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'website_visit': return <Globe className="w-5 h-5 text-emerald-400" />;
      case 'watch_video':
      case 'watch_ad': return <Play className="w-5 h-5 text-amber-400" />;
      case 'telegram_join':
      case 'telegram_bot': return <Send className="w-5 h-5 text-sky-400" />;
      case 'youtube_subscribe': return <Youtube className="w-5 h-5 text-rose-500" />;
      default: return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  const isCompleted = (taskId: string) => {
    return submissions.some(sub => sub.taskId === taskId && sub.status === 'approved');
  };

  const getStatus = (taskId: string) => {
    const sub = submissions.find(s => s.taskId === taskId);
    if (!sub) return 'idle';
    return sub.status; // pending, approved, rejected
  };

  const handleStartTask = (task: Task) => {
    // Check if user's device matches
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const platform: 'mobile' | 'desktop' = isMobileDevice ? 'mobile' : 'desktop';
    
    if (task.deviceFilters.length > 0 && !task.deviceFilters.includes(platform)) {
      showToast(`This task requires a ${task.deviceFilters.join('/')} device.`, 'error');
      return;
    }

    if (task.url && task.url !== '#ads') {
      window.open(task.url, '_blank', 'referrer');
    }
    
    setSelectedTask(task);
  };

  const handleSubmitVerification = (task: Task) => {
    if (task.verificationType === 'manual' && !submissionScreenshot.trim()) {
      showToast('Please enter the requested verification proof details first.', 'error');
      return;
    }

    setLoadingCode(true);
    setTimeout(() => {
      try {
        StoreDB.submitTask(
          task.id, 
          user.uid, 
          user.username, 
          undefined, // we store the text proof instead of forcing a screenshot pattern
          submissionScreenshot.trim()
        );
        
        if (task.verificationType === 'auto') {
          showToast(`Task verified! +${task.rewardPoints} Coins earned immediately!`, 'success');
        } else {
          showToast('Verification proof submitted! The campaign administrator will review your submission shortly.', 'success');
        }

        setSelectedTask(null);
        setSubmissionScreenshot('');
        loadTasksAndLogs();
        onRefreshUser();
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoadingCode(false);
      }
    }, 1200);
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamTitle.trim() || !newCamDesc.trim() || !newCamUrl.trim()) {
      showToast('Please fill in all requested fields.', 'error');
      return;
    }

    if (newCamTarget < 10) {
      showToast('Minimum quantity is 10 completions.', 'error');
      return;
    }

    if (newCamCostOffer < 50) {
      showToast('Minimum reward is 50 Coins per completion.', 'error');
      return;
    }

    const totalCoins = newCamTarget * newCamCostOffer;
    if (newCamPayMethod === 'coins' && user.coins < totalCoins) {
      showToast(`Insufficient core Coins. You need ${totalCoins} coins but only have ${user.coins} coins.`, 'error');
      return;
    } else if (newCamPayMethod === 'usd') {
      const scaledUsd = totalCoins / 1000;
      if (user.balance < scaledUsd) {
        showToast(`Insufficient USD. You need $${scaledUsd.toFixed(2)} USD but only have $${user.balance.toFixed(2)} USD.`, 'error');
        return;
      }
    }

    setSubmittingCampaign(true);
    setTimeout(() => {
      try {
        StoreDB.submitUserTaskCampaign(user.uid, {
          title: newCamTitle.trim(),
          description: newCamDesc.trim(),
          url: newCamUrl.trim(),
          type: newCamType,
          totalCompletions: newCamTarget,
          rewardPerCompletion: newCamCostOffer,
          payMethod: newCamPayMethod
        });

        showToast('Campaign submitted successfully! Admin will verify and activate.', 'success');
        
        // Reset form
        setNewCamTitle('');
        setNewCamDesc('');
        setNewCamUrl('');
        setNewCamTarget(20);
        setNewCamCostOffer(100);
        
        loadTasksAndLogs();
        onRefreshUser();
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setSubmittingCampaign(false);
      }
    }, 1500);
  };

  const filteredTasks = tasks.filter(task => {
    // 1. Filter by category
    if (activeTab === 'telegram' && !task.type.includes('telegram')) return false;
    if (activeTab === 'social' && !task.type.includes('youtube') && !task.type.includes('facebook') && !task.type.includes('instagram') && !task.type.includes('tiktok') && !task.type.includes('twitter')) return false;
    if (activeTab === 'apps' && !task.type.includes('app_install')) return false;

    // 2. Filter by status
    const status = getStatus(task.id);
    if (statusFilter === 'available') {
      return status === 'idle' || status === 'rejected';
    } else if (statusFilter === 'pending') {
      return status === 'pending';
    } else if (statusFilter === 'completed') {
      return status === 'approved';
    }
    return true;
  });

  // Calculate status counts for UI indicators
  const getCountsForStatus = (statusVal: 'available' | 'pending' | 'completed') => {
    return tasks.filter(task => {
      if (activeTab === 'telegram' && !task.type.includes('telegram')) return false;
      if (activeTab === 'social' && !task.type.includes('youtube') && !task.type.includes('facebook') && !task.type.includes('instagram') && !task.type.includes('tiktok') && !task.type.includes('twitter')) return false;
      if (activeTab === 'apps' && !task.type.includes('app_install')) return false;

      const status = getStatus(task.id);
      if (statusVal === 'available') {
        return status === 'idle' || status === 'rejected';
      } else if (statusVal === 'pending') {
        return status === 'pending';
      } else {
        return status === 'approved';
      }
    }).length;
  };

  const availableCount = getCountsForStatus('available');
  const pendingCount = getCountsForStatus('pending');
  const completedCount = getCountsForStatus('completed');

  // Calculate promotional charges
  const campaignCostCoins = newCamTarget * newCamCostOffer;
  const campaignCostUsd = campaignCostCoins / 1000;

  return (
    <div id="task-center-container" className="p-4 space-y-4">
      {/* Overview Banner */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/15 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="space-y-1 text-left">
          <p className="text-xs text-indigo-300 font-mono tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" /> TASK CAMPAIGNS ACTIVE
          </p>
          <h2 className="text-lg font-bold text-slate-100 font-sans tracking-tight">Tasks Operations</h2>
          <p className="text-[11px] text-slate-400">Manage submissions & self-advertising</p>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-indigo-500/10 text-center">
          <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-tight">Core Coins</p>
          <span className="text-xs font-black text-amber-450 font-mono">
            {user.coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Main Tab Switch: Earn Tasks vs. Promote Task */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-850 rounded-xl select-none">
        <button
          onClick={() => setMainTab('earn')}
          className={`py-2 text-[11.5px] uppercase font-black rounded-lg transition tracking-wider cursor-pointer ${
            mainTab === 'earn'
              ? 'bg-slate-900 text-indigo-400 border border-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          💼 Earn Coins (কাজ করুন)
        </button>
        <button
          onClick={() => setMainTab('promote')}
          className={`py-2 text-[11.5px] uppercase font-black rounded-lg transition tracking-wider cursor-pointer ${
            mainTab === 'promote'
              ? 'bg-slate-900 text-indigo-400 border border-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          📣 Promote / Add Task (কাজ দিন)
        </button>
      </div>

      {mainTab === 'earn' ? (
        <>
          {/* Categories Horizontal Scrolling Tabs */}
          <div className="flex gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
            {(['all', 'telegram', 'social', 'apps'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-xs py-2 font-semibold capitalize rounded-lg transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-indigo-650 to-indigo-750 text-white shadow-md shadow-indigo-600/10' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Status filter selection tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 border border-slate-850 rounded-xl">
            <button
              onClick={() => setStatusFilter('available')}
              className={`py-2 text-[10px] uppercase font-bold rounded-lg transition tracking-wide cursor-pointer flex flex-col items-center justify-center relative select-none ${
                statusFilter === 'available'
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-405 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" /> Available
              </span>
              <span className="text-[9px] font-bold text-slate-400 mt-1 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded-full border border-slate-850">
                {availableCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`py-2 text-[10px] uppercase font-bold rounded-lg transition tracking-wide cursor-pointer flex flex-col items-center justify-center relative select-none ${
                statusFilter === 'pending'
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-805 text-amber-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-405 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500 animate-pulse" /> Pending
              </span>
              <span className="text-[9px] font-bold text-slate-400 mt-1 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded-full border border-slate-850">
                {pendingCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`py-2 text-[10px] uppercase font-bold rounded-lg transition tracking-wide cursor-pointer flex flex-col items-center justify-center relative select-none ${
                statusFilter === 'completed'
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-805 text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-405 border border-transparent'
              }`}
            >
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> Completed
              </span>
              <span className="text-[9px] font-bold text-slate-400 mt-1 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded-full border border-slate-850">
                {completedCount}
              </span>
            </button>
          </div>

          {/* Status Label */}
          <div className="flex items-center justify-between px-1 bg-slate-900/20 py-1 rounded-lg border border-slate-850/30">
            <span className="text-[9.5px] uppercase font-bold font-mono tracking-wider text-slate-350 flex items-center gap-1.5">
              {statusFilter === 'available' ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  Available Earning Tasks (চলতি কাজসমূহ)
                </>
              ) : statusFilter === 'pending' ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  Tasks Under Review (রিভিউ করা হচ্ছে)
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-450" />
                  Completed Tasks (কমপ্লিট হওয়া কাজ)
                </>
              )}
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              Total: {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          {/* Task List Grid */}
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/40 border border-slate-800/65 rounded-2xl">
                <AlertCircle className="w-10 h-10 text-slate-500 mb-2" />
                <p className="text-xs text-slate-400">No active tasks found in this section.</p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const taskStatus = getStatus(task.id);
                return (
                  <div
                    key={task.id}
                    className="bg-slate-900/85 hover:bg-slate-900 border border-slate-800 hover:border-slate-750 rounded-2xl p-3.5 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                      <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex-shrink-0 w-9 h-9 flex items-center justify-center overflow-hidden">
                        {task.imageUrl ? (
                          <img 
                            src={task.imageUrl}
                            referrerPolicy="no-referrer"
                            alt="Campaign Icon" 
                            className="w-full h-full object-cover rounded" 
                          />
                        ) : (
                          getTaskIcon(task.type)
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-slate-200 truncate max-w-[190px]">
                            {task.title}
                          </span>
                          {task.deviceFilters.includes('mobile') && (
                            <span className="p-0.5 bg-indigo-950 border border-indigo-800 rounded text-[9px] text-indigo-400 flex items-center font-bold">
                              <Smartphone className="w-2.5 h-2.5 inline mr-0.5" /> Mobile Only
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-mono font-bold text-amber-500 flex items-center gap-1">
                            🟡 +{task.rewardPoints} Coins
                          </span>
                          <span className="text-[10px] font-mono text-indigo-400">
                            ({task.verificationType === 'auto' ? 'Auto Verified' : 'Screenshot Proof'})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {taskStatus === 'approved' ? (
                        <span className="py-1 px-3 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Earned
                        </span>
                      ) : taskStatus === 'pending' ? (
                        <span className="py-1 px-3 text-[10px] font-bold bg-amber-500/10 text-amber-400 rounded-lg flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 animate-pulse" /> Reviewing
                        </span>
                      ) : (
                        <button
                          onClick={() => handleStartTask(task)}
                          className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 transition-colors text-xs font-bold rounded-lg text-white flex items-center gap-1 shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-95"
                        >
                          Start <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Create Promotional Campaign Form */}
          <form onSubmit={handleCreateCampaignSubmit} className="bg-slate-900 border border-slate-850 p-4 rounded-3xl space-y-4 text-left shadow">
            <div className="flex items-center gap-2 text-indigo-400">
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-black uppercase font-mono tracking-wider">Create Custom Task Link (নতুন কাজ দিন)</h3>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-normal">
              আপনার ইউটিউব চ্যানেল সাবস্ক্রাইব, টেলিগ্রাম জয়েন, ওয়েবসাইট ভিজিট বা অন্য যেকোনো সোশ্যাল মিডিয়া কাজ দিন। ইউজারের অ্যাকাউন্ট থেকে ব্যালেন্স বা কয়েন কেটে কাজ সেটআপ করা হবে এবং এডমিন ভেরিফাই করে লাইভ করবে।
            </p>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-300 font-mono uppercase">Campaign Title (কাজের শিরোনাম)*</label>
              <input
                type="text"
                required
                placeholder="E.g., Join My Telegram Crypto Channel"
                value={newCamTitle}
                onChange={e => setNewCamTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-300 font-mono uppercase">Task Type (কাজের ধরণ)*</label>
                <select
                  value={newCamType}
                  onChange={e => setNewCamType(e.target.value as TaskType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none font-mono"
                >
                  <option value="telegram_join">Telegram Join</option>
                  <option value="telegram_bot">Telegram Bot</option>
                  <option value="website_visit">Website Visit</option>
                  <option value="youtube_subscribe">YouTube Subscriber</option>
                  <option value="facebook_like">Facebook Page Like</option>
                  <option value="instagram_follow">Instagram Follower</option>
                  <option value="tiktok_like">TikTok Like</option>
                  <option value="custom">Other Custom Action</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-300 font-mono uppercase">Pay Method (পেমেন্ট মাধ্যম)</label>
                <select
                  value={newCamPayMethod}
                  onChange={e => setNewCamPayMethod(e.target.value as 'coins' | 'usd')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none font-mono"
                >
                  <option value="coins">Core Coins (কয়েন ব্যালেন্স)</option>
                  <option value="usd">Earned Balance (ডলার ব্যালেন্স)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-300 font-mono uppercase">Task URL (কাজের লিংক)*</label>
              <input
                type="url"
                required
                placeholder="E.g., https://t.me/your_channel_link"
                value={newCamUrl}
                onChange={e => setNewCamUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-300 font-mono uppercase">Completions Target (মোট ইউজার সংখ্যা)</label>
                <input
                  type="number"
                  required
                  min="10"
                  placeholder="Minimum 10"
                  value={newCamTarget}
                  onChange={e => setNewCamTarget(Math.max(10, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-300 font-mono uppercase">User Reward Coin (একটি কাজের মূল্য)</label>
                <input
                  type="number"
                  required
                  min="50"
                  placeholder="Minimum 50"
                  value={newCamCostOffer}
                  onChange={e => setNewCamCostOffer(Math.max(50, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-300 font-mono uppercase">Step Description (কাজটি করার সঠিক নিয়ম)*</label>
              <textarea
                rows={2}
                required
                placeholder="E.g., ১. লিংকে ক্লিক করে জয়েন করুন। ২. স্ক্রিনশট নিয়ে এখানে দিন।"
                value={newCamDesc}
                onChange={e => setNewCamDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Campaign Cost Summary Box */}
            <div className="p-3 bg-indigo-950/20 rounded-2xl border border-indigo-900/30 text-left space-y-1 font-mono">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide">Charge Summary (বিজ্ঞাপন বিল):</span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Reward Units:</span>
                <span className="text-white font-bold">{campaignCostCoins.toLocaleString()} Coins</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-indigo-950/40 pt-1 mt-1">
                <span className="text-slate-400">Deduction Cost ({newCamPayMethod.toUpperCase()}):</span>
                {newCamPayMethod === 'coins' ? (
                  <span className="text-amber-400 font-black">-{campaignCostCoins.toLocaleString()} Coins</span>
                ) : (
                  <span className="text-emerald-450 font-black">-${campaignCostUsd.toFixed(2)} USD</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingCampaign}
              className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-550 text-white font-bold text-xs uppercase rounded-xl tracking-wider cursor-pointer active:scale-95 transition shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
            >
              {submittingCampaign ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Generating Campaign...
                </>
              ) : (
                <>
                  <Megaphone className="w-4 h-4 text-white" />
                  Publish Task Request & Deduct Wallet
                </>
              )}
            </button>
          </form>

          {/* User's Campaigns List logs */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-350">
              <List className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-black uppercase font-mono tracking-wider">Your Campaigns (আপনার দেওয়া কাজসমূহ)</h3>
            </div>

            <div className="space-y-2">
              {userCampaigns.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-slate-850 text-slate-500 text-xs italic">
                  You have not submitted any task campaigns yet.
                </div>
              ) : (
                userCampaigns.map(cam => (
                  <div key={cam.id} className="p-3.5 bg-slate-900/80 border border-slate-850 rounded-2xl flex flex-col space-y-2.5 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{cam.title}</h4>
                        <span className="text-[10px] font-mono text-slate-400 block mt-1">
                          Budget: {cam.totalBudgetCoins?.toLocaleString() || 'N/A'} Coins ({cam.paymentMethodUsed?.toUpperCase()})
                        </span>
                        <span className="text-[9px] text-slate-550 block font-mono">
                          Reward/completions: 🟡 {cam.reward} Coins • {new Date(cam.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded font-mono border ${
                        cam.adminStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-450 border-emerald-950' :
                        cam.adminStatus === 'rejected' ? 'bg-rose-500/10 text-rose-450 border-rose-950' :
                        'bg-amber-500/10 text-amber-400 border-amber-950 animate-pulse'
                      }`}>
                        {cam.adminStatus || 'pending'}
                      </span>
                    </div>

                    {cam.rejectionNote && (
                      <div className="p-2 bg-slate-950 rounded-xl border border-rose-950/40 text-[10.5px] text-rose-350 italic">
                        <b>Feedback:</b> {cam.rejectionNote}
                        {cam.adminStatus === 'rejected' && <span className="block font-bold text-[9px] text-amber-500 mt-1 uppercase">✓ Coins / USD Refunded back instantly</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission & Verification Dialog Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl relative overflow-hidden"
            >
              {/* Header inside modal */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 w-10 h-10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {selectedTask.imageUrl ? (
                      <img 
                        src={selectedTask.imageUrl} 
                        referrerPolicy="no-referrer"
                        alt="Task Icon" 
                        className="w-full h-full object-cover rounded" 
                      />
                    ) : (
                      getTaskIcon(selectedTask.type)
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-slate-100 text-sm leading-tight">{selectedTask.title}</h3>
                    <span className="text-[10px] text-amber-500 font-bold font-mono">
                      🔴 Reward: +{selectedTask.rewardPoints} Coins (+{selectedTask.xpReward} XP)
                    </span>
                  </div>
                </div>
              </div>

              {/* Task workflow instructions */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-[11.5px] text-slate-300 text-left space-y-2 mb-4 leading-relaxed">
                <p className="font-bold text-[12px] text-indigo-400">Step-by-Step Guide:</p>
                <div className="space-y-1.5">
                  <p>{selectedTask.description}</p>
                </div>
              </div>

              {/* Launch Campaign */}
              <a
                href={selectedTask.url === '#ads' ? undefined : selectedTask.url}
                target={selectedTask.url === '#ads' ? undefined : '_blank'}
                rel="noreferrer"
                className="w-full py-2.5 mb-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-250 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
              >
                Launch Campaign Link <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              </a>

              {/* Screenshot entry form if MANUAL verification is needed */}
              {selectedTask.verificationType === 'manual' && (
                <div className="space-y-2.5 mb-4 text-left">
                  <p className="text-[11.5px] text-amber-450 leading-relaxed bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl">
                    Provide verification proof details (such as username, profile link, or URL) to submit this campaign task for administrator manual review.
                  </p>
                  
                  <div className="space-y-1">
                    <label className="text-[10.5px] uppercase font-black tracking-wider text-slate-400 font-mono pl-0.5 block">
                      Verification input data
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Username, email, or link proof details"
                      value={submissionScreenshot}
                      onChange={e => setSubmissionScreenshot(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons in modal */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 font-bold text-xs text-slate-300 rounded-xl cursor-pointer active:scale-95 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmitVerification(selectedTask)}
                  disabled={loadingCode}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 font-bold text-xs text-white rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  {loadingCode ? (
                    <div className="w-4.5 h-4.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : selectedTask.verificationType === 'auto' ? (
                    'Verify Automatically'
                  ) : (
                    'Submit Verification Proof'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
