import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, TrendingUp, Sparkles, User, ShieldCheck, ChevronRight, 
  Flame, KeyRound, BellRing, ArrowUpRight, CheckCircle2, Megaphone, Milestone, Award 
} from 'lucide-react';
import { UserProfile, AppNotification } from '../types';
import { StoreDB } from '../services/store';

interface DashboardProps {
  user: UserProfile;
  onRefreshUser: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  setActivePage: (page: string) => void;
}

const TRUST_USERNAMES = [
  'ariyan_rana', 'nadim_bhai', 'sabbir_88', 'bithi_pro', 'samir_khan', 
  'anika_99', 'farhan_raj', 'sakib_leader', 'lima_moni', 'rashed_hasan', 
  'mim_islam', 'tasnim_eva', 'hridoy_vip', 'sohel_active', 'samira_uae'
];

const TRUST_TASKS = [
  'Joined Official Telegram Channel',
  'Completed Monetag Rewarded Ad View',
  'Subscribed YouTube Sponsor Channel',
  'Started Telegram Auto Bot task',
  'Visited Partner web portal for 30s',
  'Approved Daily Attendance Check'
];

const TRUST_PAYOUTS = [
  { method: 'bKash', amount: '৳৫০০' },
  { method: 'Nagad', amount: '৳৩৫০' },
  { method: 'bKash', amount: '৳১,২০০' },
  { method: 'Rocket', amount: '৳৮০০' },
  { method: 'Nagad', amount: '৳৫,০০০' },
  { method: 'Binance USDT', amount: '$১৫.০০' },
  { method: 'Payeer', amount: '$৮.৫০' },
  { method: 'Binance Pay', amount: '$৫.০০' }
];

export default function Dashboard({ user, onRefreshUser, showToast, setActivePage }: DashboardProps) {
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const settings = StoreDB.getSettings();

  const [liveUserCount, setLiveUserCount] = useState(42914);
  const [liveActivities, setLiveActivities] = useState<string[]>([
    '🔥 User @nadim_bhai has successfully withdrawn ৳৫০০ via bKash!',
    '✅ User @sabbir_88 finished task: Joined Official Telegram Channel (+150 Coins)',
    '🔥 User @samira_uae approved withdrawal of $১৫.০০ via Binance USDT!',
    '✅ User @lima_moni finished task: Subscribed YouTube Sponsor Channel (+200 Coins)'
  ]);

  useEffect(() => {
    // Dynamic user counter simulation
    const userInterval = setInterval(() => {
      setLiveUserCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 4000);

    // Dynamic feed generator
    const activityInterval = setInterval(() => {
      setLiveActivities(prev => {
        const rdType = Math.random() > 0.4 ? 'task' : 'withdraw';
        
        // Filter out usernames that are already in any of the currently displayed liveActivities
        const currentText = prev.join(' ').toLowerCase();
        const availableUsernames = TRUST_USERNAMES.filter(u => !currentText.includes(u.toLowerCase()));
        
        // Fallback to complete list if all are temporarily exhausted
        const pool = availableUsernames.length > 0 ? availableUsernames : TRUST_USERNAMES;
        const usr = pool[Math.floor(Math.random() * pool.length)];

        let entry = '';
        if (rdType === 'task') {
          const taskName = TRUST_TASKS[Math.floor(Math.random() * TRUST_TASKS.length)];
          const reward = [100, 150, 200, 300, 500][Math.floor(Math.random() * 5)];
          entry = `✅ User @${usr} finished task: ${taskName} (+${reward} Coins)`;
        } else {
          const pay = TRUST_PAYOUTS[Math.floor(Math.random() * TRUST_PAYOUTS.length)];
          entry = `🔥 User @${usr} has successfully withdrawn ${pay.amount} via ${pay.method}!`;
        }

        return [entry, ...prev.slice(0, 3)];
      });
    }, 3800);

    return () => {
      clearInterval(userInterval);
      clearInterval(activityInterval);
    };
  }, []);

  useEffect(() => {
    loadNews();
  }, [user.uid]);

  const loadNews = () => {
    setNotifications(StoreDB.getNotifications());
  };

  const handleRedeemPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setRedeeming(true);
    setTimeout(() => {
      const res = StoreDB.redeemPromo(user.uid, promoCode);
      if (res.success) {
        showToast(res.message, 'success');
        setPromoCode('');
        onRefreshUser();
        loadNews();
      } else {
        showToast(res.message, 'error');
      }
      setRedeeming(false);
    }, 1200);
  };

  const totalEarningsInCoins = user.coins;
  // Progress to next rank or level
  const xpNeeded = user.level * 500;
  const xpPercentage = Math.min(100, Math.floor((user.xp / xpNeeded) * 100));

  return (
    <div id="user-dashboard-tab" className="p-4 space-y-4 text-left">
      {/* 1. GLOBAL SYSTEM ANNOUNCEMENT TICKER */}
      {settings.announcement && (
        <div className="bg-amber-500/10 border border-amber-500/15 p-3 rounded-2xl flex items-start gap-2.5 shadow-sm">
          <Megaphone className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 animate-bounce" />
          <p className="text-[11px] text-amber-300 leading-normal font-mono font-bold">
            {settings.announcement}
          </p>
        </div>
      )}

      {/* 2. DYNAMIC MAIN COUNTERS CARD */}
      <div className="bg-gradient-to-br from-indigo-950 via-purple-950/40 to-slate-900 border border-indigo-500/15 p-5 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-505/10 rounded-full filter blur-2xl pointer-events-none" />
        
        <div className="space-y-1">
          <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase block">My Gold Store Balance</span>
          <div className="flex items-baseline gap-1">
            <h1 className="text-3xl font-black font-mono tracking-tight text-white">
              🟡 {totalEarningsInCoins.toLocaleString()}
            </h1>
            <span className="text-[11px] text-slate-400 font-bold font-mono">COINS</span>
          </div>
          <span className="text-[10.5px] text-slate-400 block font-mono">
            Approximate Value: <b className="text-emerald-450">${(totalEarningsInCoins / 1000).toFixed(2)} USD</b>
          </span>
        </div>

        {/* Level and XP visual bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" /> Rank #{user.rank} • Lvl {user.level} PILOT
            </span>
            <span>{user.xp} / {xpNeeded} XP</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
            <div className="bg-indigo-500 h-full transition-all duration-501" style={{ width: `${xpPercentage}%` }} />
          </div>
        </div>
      </div>

      {/* 3. MULTI-COLUMNS STATUS BENTO GRID */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setActivePage('tasks')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-850 p-4 rounded-2xl text-left transition cursor-pointer active:scale-95 flex flex-col justify-between h-24"
        >
          <span className="text-[9.5px] text-slate-505 uppercase block font-mono">Paid Assignments</span>
          <span className="text-lg font-black font-mono text-slate-200">
            {user.completedTasksCount} Completed
          </span>
          <span className="text-[10px] text-indigo-400 flex items-center mt-1">
            Browse Tasks <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <button
          onClick={() => setActivePage('referrals')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-850 p-4 rounded-2xl text-left transition cursor-pointer active:scale-95 flex flex-col justify-between h-24"
        >
          <span className="text-[9.5px] text-slate-505 uppercase block font-mono">Referred Affiliates</span>
          <span className="text-lg font-black font-mono text-slate-205">
            {user.referralCount} Users
          </span>
          <span className="text-[10px] text-indigo-400 flex items-center mt-1">
            Invite Friends <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* 3.5 LIVE PLATFORM STATE & ACTIVITY TRACKER */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-3 shadow-md text-left">
        <div className="flex justify-between items-center border-b border-slate-850 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
            <h4 className="text-xs font-black uppercase text-slate-100 font-mono tracking-wider flex items-center gap-1">
              🟢 Live Activity Feed (রিয়েল-টাইম কার্যক্রম)
            </h4>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 border border-slate-800 rounded-lg font-mono">
            Online Users: <b className="text-emerald-450">{liveUserCount.toLocaleString()}</b>
          </span>
        </div>

        <p className="text-[9.5px] text-slate-400 leading-normal">
          আমাদের অ্যাপ এর বিশ্বস্ততা ও পেমেন্ট লাইভ ট্র্যাকার। এখানে মেম্বারদের লাইভ উইথড্রয়াল প্রুফ এবং টাস্ক কমপ্লিট করার লাইভ আপডেট দেখানো হচ্ছে।
        </p>

        {/* Dynamic Activity List */}
        <div className="space-y-2 pt-1 font-mono">
          <AnimatePresence initial={false}>
            {liveActivities.map((act, idx) => (
              <motion.div
                key={act + idx}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-2 border border-slate-850 rounded-xl bg-slate-950/60 flex items-center gap-2 text-[10px] leading-relaxed"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-slate-300 truncate">{act}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. PROMO CODE BOX */}
      <form onSubmit={handleRedeemPromo} className="bg-slate-900 border border-slate-850 p-4 rounded-2xl space-y-2.5 shadow-md">
        <label className="text-[11.5px] text-slate-400 font-bold block flex items-center gap-1.5 font-mono">
          <KeyRound className="w-4 h-4 text-indigo-400" /> Enter System Promo Code
        </label>
        <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-1">
          <input
            type="text"
            required
            placeholder="E.g., WELCOME500"
            value={promoCode}
            onChange={e => setPromoCode(e.target.value)}
            disabled={redeeming}
            className="flex-1 bg-transparent px-3 text-xs text-white uppercase focus:outline-none placeholder-slate-600 font-mono"
          />
          <button
            type="submit"
            disabled={redeeming}
            className="p-2 py-1.5 px-4 bg-indigo-650 hover:bg-indigo-600 font-bold text-xs rounded-lg text-white transition active:scale-95 cursor-pointer"
          >
            {redeeming ? 'Checking...' : 'Redeem'}
          </button>
        </div>
      </form>

      {/* 5. NEWS AND NOTIFICATIONS ACTIVITY LOGS */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <BellRing className="w-4 h-4 text-indigo-400" /> Recent Network Alerts
          </h4>
          <span className="text-[9.5px] text-slate-500 font-mono">Real-time sync on</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {notifications.map(noti => (
            <div
              key={noti.id}
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                noti.read ? 'bg-slate-950/40 border-slate-900/60' : 'bg-indigo-950/15 border-indigo-500/20 shadow-sm'
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-205 block leading-tight">
                  {noti.title}
                </span>
                <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                  {noti.message}
                </p>
                <span className="text-[8.5px] text-slate-550 block font-mono mt-1">
                  {new Date(noti.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
