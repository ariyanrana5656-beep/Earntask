import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, Gift, HelpCircle, RefreshCw, Trophy, AlertCircle, 
  Sparkles, Star, Milestone, Compass, Flame, Smile, Lock 
} from 'lucide-react';
import { UserProfile } from '../types';
import { StoreDB } from '../services/store';

interface RewardsCenterProps {
  user: UserProfile;
  onRefreshUser: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function RewardsCenter({ user, onRefreshUser, showToast }: RewardsCenterProps) {
  // Fetch system settings for games
  const settings = StoreDB.getSettings();
  const gameSectionEnabled = settings.gameSectionEnabled !== false;
  const spinCost = settings.gameSpinCost ?? 100;
  const rewardMultiplier = settings.gameSpinRewardMultiplier ?? 1.0;

  const lastGamePlayedAt = user.lastGamePlayedAt || 0;
  const hoursSinceLastPlay = (Date.now() - lastGamePlayedAt) / 3600000;
  const isCooldownActive = hoursSinceLastPlay < 22;

  // Cooldown countdown state
  const [timeRemainingStr, setTimeRemainingStr] = useState('');

  const formatTimeRemaining = (msec: number) => {
    const totalSecs = Math.max(0, Math.ceil(msec / 1000));
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h}h ${m}m ${s}s`;
  };

  useEffect(() => {
    if (isCooldownActive) {
      const updateTimer = () => {
        const remainingMs = (22 * 3600000) - (Date.now() - lastGamePlayedAt);
        if (remainingMs <= 0) {
          setTimeRemainingStr('');
          onRefreshUser();
        } else {
          setTimeRemainingStr(formatTimeRemaining(remainingMs));
        }
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeRemainingStr('');
    }
  }, [isCooldownActive, lastGamePlayedAt]);

  // Streak State
  const [streakDays, setStreakDays] = useState<{ day: number; reward: number; claimed: boolean }[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [scratched, setScratched] = useState(false);
  const [scratchReward, setScratchReward] = useState<number | null>(null);
  const [scratchHoverCount, setScratchHoverCount] = useState(0); // simulation of scratch progress
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [boxReward, setBoxReward] = useState<number | null>(null);

  // Rewards list by streak check-in
  const DAILY_STREAKS = [
    { day: 1, reward: 50 },
    { day: 2, reward: 80 },
    { day: 3, reward: 120 },
    { day: 4, reward: 150 },
    { day: 5, reward: 200 },
    { day: 6, reward: 250 },
    { day: 7, reward: 500 }
  ];

  // Lucky wheel slices scaled by admin rewardMultiplier
  const WHEEL_SLICES = [
    { text: `${Math.round(50 * rewardMultiplier)} Coins`, color: '#1e1b4b', reward: Math.round(50 * rewardMultiplier) },
    { text: 'Xp +10', color: '#311042', reward: 'xp10' },
    { text: `${Math.round(500 * rewardMultiplier)} Coins`, color: '#831843', reward: Math.round(500 * rewardMultiplier) },
    { text: 'No Luck', color: '#020617', reward: 0 },
    { text: `${Math.round(100 * rewardMultiplier)} Coins`, color: '#1e293b', reward: Math.round(100 * rewardMultiplier) },
    { text: 'VIP Badge', color: '#d97706', reward: 'vip1' },
    { text: `${Math.round(250 * rewardMultiplier)} Coins`, color: '#134e4a', reward: Math.round(250 * rewardMultiplier) },
    { text: `${Math.round(1000 * rewardMultiplier)} Coins`, color: '#2563eb', reward: Math.round(1000 * rewardMultiplier) }
  ];

  useEffect(() => {
    buildCheckinState();
  }, [user]);

  const buildCheckinState = () => {
    const isTodayClaimed = user.lastCheckIn > Date.now() - 86400000;
    const days = DAILY_STREAKS.map(st => {
      let claimed = false;
      if (st.day <= user.checkInStreak) {
        // Already claimed on previous streaks
        claimed = true;
      }
      return { ...st, claimed };
    });
    setStreakDays(days);
  };

  const handleDailyCheckIn = () => {
    const hoursSinceLast = (Date.now() - user.lastCheckIn) / 3600000;
    
    // Check if 24 hours elapsed. 
    // In our live applet we let them check in if lastCheckIn is not calendar-today. 
    // For easy testing we prevent check-in if within same 22 hours, but allow if demo
    if (hoursSinceLast < 22) {
      showToast(`Daily streak claimed. Try again tomorrow!`, 'error');
      return;
    }

    try {
      // Logic: If last check-in was > 48hr, streak reset to 1. Else increment.
      let newStreak = user.checkInStreak + 1;
      if (hoursSinceLast > 48) {
        newStreak = 1;
      }
      if (newStreak > 7) newStreak = 1;

      const earnedReward = DAILY_STREAKS[newStreak - 1].reward;
      
      StoreDB.updateUser(user.uid, {
        coins: user.coins + earnedReward,
        rewardPoints: user.rewardPoints + earnedReward,
        checkInStreak: newStreak,
        lastCheckIn: Date.now()
      });

      showToast(`Logged in successfully! +${earnedReward} coins unlocked Day ${newStreak} Streak!`, 'success');
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Lucky spin rotation
  const handleSpinWheel = () => {
    if (isSpinning) return;
    if (isCooldownActive) {
      showToast('Daily game limit reached! You can play games once per day.', 'error');
      return;
    }
    if (user.coins < spinCost) {
      showToast(`Lucky Spin costs ${spinCost} coins. Go do some tasks!`, 'error');
      return;
    }

    setIsSpinning(true);
    // Deduct coins & record game played timestamp
    StoreDB.updateUser(user.uid, { 
      coins: user.coins - spinCost,
      lastGamePlayedAt: Date.now()
    });
    onRefreshUser();

    // Select random slice index
    const randomIndex = Math.floor(Math.random() * WHEEL_SLICES.length);
    const degreesPerSlice = 360 / WHEEL_SLICES.length;
    
    // Spin multiple times then land on correct slice
    const totalSpins = 5; // rotations
    const targetDeg = totalSpins * 360 + (360 - (randomIndex * degreesPerSlice));
    
    setSpinDeg(targetDeg);

    setTimeout(() => {
      setIsSpinning(false);
      const landed = WHEEL_SLICES[randomIndex];
      
      // Process reward
      if (typeof landed.reward === 'number') {
        if (landed.reward > 0) {
          StoreDB.updateUser(user.uid, { coins: user.coins + landed.reward, rewardPoints: user.rewardPoints + landed.reward });
          showToast(`Jackpot! You won ${landed.reward} Coins from Daily Wheel!`, 'success');
        } else {
          showToast('Oops! Better luck next spin!', 'error');
        }
      } else if (landed.reward === 'xp10') {
        StoreDB.updateUser(user.uid, { xp: user.xp + 50 });
        showToast('Spin winner: XP boosted +50 Pts!', 'success');
      } else if (landed.reward === 'vip1') {
        StoreDB.updateUser(user.uid, { vipLevel: Math.max(user.vipLevel, 1) });
        showToast('Incredible! Unlocked VIP Level 1 Bronze membership!', 'success');
      }

      onRefreshUser();
    }, 4500);
  };

  // Scratch card simulated drag scraper
  const handleScratch = () => {
    if (scratched) return;
    if (isCooldownActive) {
      showToast('Daily game limit reached! You can play games once per day.', 'error');
      return;
    }
    
    const increment = scratchHoverCount + 10;
    setScratchHoverCount(increment);

    if (increment >= 100) {
      // Fully scratched
      setScratched(true);
      const randomCoinBonus = Math.round((Math.floor(Math.random() * 80 + 20)) * rewardMultiplier); // 20-100 Coins scaled
      setScratchReward(randomCoinBonus);

      StoreDB.updateUser(user.uid, { 
        coins: user.coins + randomCoinBonus,
        lastGamePlayedAt: Date.now()
      });
      showToast(`Scratched Card Reveal! +${randomCoinBonus} Coins claimed!`, 'success');
      onRefreshUser();
    }
  };

  const handleResetScratch = () => {
    setScratched(false);
    setScratchReward(null);
    setScratchHoverCount(0);
  };

  // Mystery Box select
  const handleOpenMysteryBox = (boxId: number) => {
    if (selectedBox !== null) return;
    if (isCooldownActive) {
      showToast('Daily game limit reached! You can play games once per day.', 'error');
      return;
    }
    
    setSelectedBox(boxId);
    const boxCoins = Math.round((Math.floor(Math.random() * 150 + 50)) * rewardMultiplier); // 50-200 Coins scaled
    setBoxReward(boxCoins);

    StoreDB.updateUser(user.uid, { 
      coins: user.coins + boxCoins,
      lastGamePlayedAt: Date.now()
    });
    showToast(`Mystery Chest opened: Credited +${boxCoins} Coins into savings!`, 'success');
    onRefreshUser();
  };

  const resetBoxesState = () => {
    setSelectedBox(null);
    setBoxReward(null);
  };

  if (!gameSectionEnabled) {
    return (
      <div id="rewards-center-tab" className="p-4 space-y-4">
        {/* 1. STREAK HEADER */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between text-left">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1.5">
              <span className="p-1 px-2.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10.5px] font-mono font-bold flex items-center">
                <Flame className="w-3.5 h-3.5 mr-0.5 animate-pulse" /> STREAK: {user.checkInStreak} DAYS
              </span>
            </div>
            <button
              onClick={handleDailyCheckIn}
              className="py-1.5 px-3 bg-indigo-650 hover:bg-indigo-600 font-bold text-xs rounded-lg cursor-pointer"
            >
              Check-In Today
            </button>
          </div>

          {/* 7-Day Matrix */}
          <div className="grid grid-cols-7 gap-1">
            {streakDays.map(st => (
              <div
                key={st.day}
                className={`p-2 rounded-lg flex flex-col items-center justify-center text-center transition border ${
                  st.day <= user.checkInStreak
                    ? 'bg-gradient-to-b from-indigo-950 to-indigo-900/60 border-indigo-500/40 text-indigo-300 shadow'
                    : 'bg-slate-950/40 border-slate-900 text-slate-500'
                }`}
              >
                <span className="text-[9.5px] block">Day {st.day}</span>
                <Gift className={`w-4 h-4 my-1.5 ${st.day <= user.checkInStreak ? 'text-amber-400' : 'text-slate-650'}`} />
                <span className="text-[10px] font-mono font-bold">+{st.reward}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-850 p-8 rounded-3xl text-center space-y-3 shadow-xl animate-fade">
          <Sparkles className="w-10 h-10 text-slate-500 mx-auto animate-pulse" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Games Offline (গেম সেকশন বন্ধ)</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              The administrator has temporarily closed the Game Arena section. Earning tasks are still active! Keep checking back.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="rewards-center-tab" className="p-4 space-y-4">
      {/* 1. STREAK HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between text-left">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-1.5">
            <span className="p-1 px-2.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10.5px] font-mono font-bold flex items-center">
              <Flame className="w-3.5 h-3.5 mr-0.5 animate-pulse" /> STREAK: {user.checkInStreak} DAYS
            </span>
          </div>
          <button
            onClick={handleDailyCheckIn}
            className="py-1.5 px-3 bg-indigo-650 hover:bg-indigo-600 font-bold text-xs rounded-lg cursor-pointer"
          >
            Check-In Today
          </button>
        </div>

        {/* 7-Day Matrix */}
        <div className="grid grid-cols-7 gap-1">
          {streakDays.map(st => (
            <div
              key={st.day}
              className={`p-2 rounded-lg flex flex-col items-center justify-center text-center transition border ${
                st.day <= user.checkInStreak
                  ? 'bg-gradient-to-b from-indigo-950 to-indigo-900/60 border-indigo-500/40 text-indigo-300 shadow'
                  : 'bg-slate-950/40 border-slate-900 text-slate-500'
              }`}
            >
              <span className="text-[9.5px] block">Day {st.day}</span>
              <Gift className={`w-4 h-4 my-1.5 ${st.day <= user.checkInStreak ? 'text-amber-400' : 'text-slate-650'}`} />
              <span className="text-[10px] font-mono font-bold">+{st.reward}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 1.5 COOLDOWN TIMER NOTICE (DAILY 1 PLAY ONLY ENFORCER) */}
      {isCooldownActive && (
        <div className="bg-gradient-to-r from-amber-950/40 to-indigo-950/45 border border-amber-550/20 p-4 rounded-2xl flex items-start gap-3 text-left animate-fade">
          <div className="w-10 h-10 rounded-xl bg-amber-550/10 border border-amber-500/20 flex items-center justify-center text-amber-550 shrink-0">
            <Lock className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-widest font-black uppercase text-amber-400">DAILY LIMIT COMPLETED (আজকের লিমিট শেষ)</span>
            <p className="text-[11.5px] text-slate-300 leading-tight">
              You can play games exactly once each day (প্রতিদিন মাত্র ১ বার গেম খেলতে পারবেন). Your next daily free entry will unlock when the timer decays to zero.
            </p>
            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 font-bold bg-amber-500/10 w-fit p-1 px-1.5 rounded-lg mt-1 select-none">
              <span>Unlocks in:</span>
              <span className="text-white bg-slate-950/60 p-0.5 px-1.5 rounded border border-white/5 font-black">{timeRemainingStr || 'Calculating...'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. LUCKY WHEEL SECTOR */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 text-center">
        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 text-left flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Milestone className="w-4 h-4 text-indigo-400" /> Lucky Spin Wheel</span>
          {isCooldownActive && <span className="text-[9.5px] font-mono bg-amber-900/40 text-amber-300 p-0.5 px-1.5 rounded">PLAYED TODAY</span>}
        </h3>

        {/* Wheel wrapper */}
        <div className="flex flex-col items-center justify-center my-4 relative">
          {/* Wheel pointer */}
          <div className="absolute top-0 w-4 h-6 bg-rose-500 rounded-b-full z-20 border-x border-b border-white animate-pulse" />

          {/* Graphical canvas SVG Wheel rotating */}
          <div
            style={{
              transform: `rotate(${spinDeg}deg)`,
              transition: isSpinning ? 'transform 4500ms cubic-bezier(0.15, 0.95, 0.3, 1)' : 'none'
            }}
            className="w-44 h-44 rounded-full border-4 border-slate-950 shadow-2xl overflow-hidden relative flex items-center justify-center bg-slate-950 z-10"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {WHEEL_SLICES.map((slice, idx) => {
                const angle = 360 / WHEEL_SLICES.length;
                const startAngle = idx * angle;
                const endAngle = startAngle + angle;
                
                // Trigs
                const rad = Math.PI / 180;
                const x1 = 50 + 50 * Math.cos(startAngle * rad);
                const y1 = 50 + 50 * Math.sin(startAngle * rad);
                const x2 = 50 + 50 * Math.cos(endAngle * rad);
                const y2 = 50 + 50 * Math.sin(endAngle * rad);

                const sliceL = endAngle - startAngle > 180 ? 1 : 0;
                const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${sliceL} 1 ${x2} ${y2} Z`;

                // Calculate center text angle
                const textAngle = startAngle + angle / 2;
                const tx = 50 + 32 * Math.cos(textAngle * rad);
                const ty = 50 + 32 * Math.sin(textAngle * rad);

                return (
                  <g key={idx}>
                    <path d={pathData} fill={slice.color} />
                    <text
                      x={tx}
                      y={ty}
                      fill="#f8fafc"
                      fontSize="5"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                      transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                    >
                      {slice.text}
                    </text>
                  </g>
                );
              })}
              <circle cx="50" cy="50" r="10" fill="#090d16" />
            </svg>
            {/* Core spinner star design */}
            <div className="absolute w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center z-20">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 animate-spin" />
            </div>
          </div>

          {/* Action spins with state */}
          <button
            onClick={handleSpinWheel}
            disabled={isSpinning || isCooldownActive}
            className={`mt-4 px-6 py-2 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer ${
              isCooldownActive 
                ? 'bg-slate-800 border border-slate-700 text-slate-500 opacity-40 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
            }`}
          >
            {isSpinning 
              ? 'SPINNING...' 
              : isCooldownActive 
                ? 'LOCKED (🟡 PLAYED TODAY)' 
                : `SPIN THE WHEEL (🟡 ${spinCost} Coins)`}
          </button>
        </div>
      </div>

      {/* 3. MULTI SCRATCH CARD ZONE */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 text-left">
        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-amber-500" /> Lucky Scratch Card</span>
          {scratched && !isCooldownActive && (
            <button onClick={handleResetScratch} className="text-[10px] text-slate-500 underline flex items-center gap-1">
              Reset card
            </button>
          )}
        </h3>

        {/* Scratch space */}
        <div className="relative w-full h-32 bg-slate-950 rounded-2xl overflow-hidden flex flex-col justify-center items-center border border-slate-800 text-center select-none">
          {isCooldownActive ? (
            <div className="flex flex-col justify-center items-center text-slate-550 space-y-1.5 p-4 animate-fade">
              <Lock className="w-6 h-6 text-amber-500/30 animate-pulse" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scratch Card Locked</p>
              <p className="text-[10.5px] text-slate-500">Play allowance is capped at 1 game per day.</p>
            </div>
          ) : scratched ? (
            <div className="animation-fade space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Winner Revealed</span>
              <p className="text-xl font-black text-amber-500">🟡 +{scratchReward} Coins</p>
              <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded font-mono">Added directly</span>
            </div>
          ) : (
            <div
              onMouseMove={handleScratch}
              onTouchMove={handleScratch}
              className="absolute inset-0 bg-slate-850 cursor-pointer flex flex-col justify-center items-center text-slate-400 transition"
              style={{ opacity: 1 - scratchHoverCount / 100 }}
            >
              <Milestone className="w-8 h-8 text-slate-500 animate-bounce" />
              <p className="text-xs font-bold text-slate-300 mt-2">DAMP & SCRAPE SCREEN</p>
              <p className="text-[10px] text-slate-500">Drag cursor/finger here to scratch card</p>
              
              {/* Scratch guide percentage meter */}
              <div className="w-24 h-1 bg-slate-900 mt-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: `${scratchHoverCount}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MYSTERY CHESTS */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 text-left">
        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center justify-between">
          <span>🎁 Mystery Reward Chests</span>
          {selectedBox !== null && (
            <button onClick={resetBoxesState} className="text-[10.5px] text-slate-500 underline">
              Browse Chests
            </button>
          )}
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3].map(boxId => {
            const isSelected = selectedBox === boxId;
            const isAnySelected = selectedBox !== null;
            const isChestDisabled = isAnySelected || isCooldownActive;
            return (
              <button
                key={boxId}
                disabled={isChestDisabled}
                onClick={() => handleOpenMysteryBox(boxId)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                  isSelected 
                    ? 'bg-gradient-to-b from-purple-950 to-indigo-900 border-purple-500 text-purple-300' 
                    : isChestDisabled 
                      ? 'bg-slate-950/25 border-slate-905 text-slate-650 opacity-40 cursor-not-allowed' 
                      : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {isCooldownActive && !isSelected ? (
                  <Lock className="w-8 h-8 text-slate-600" />
                ) : (
                  <Compass className={`w-8 h-8 ${isSelected ? 'animate-bounce text-amber-500' : 'text-indigo-400'}`} />
                )}
                <span className="text-[10.5px] font-mono mt-2 font-bold block">
                  {isSelected ? `🟡 +${boxReward}` : isCooldownActive ? 'Locked' : isAnySelected ? 'Opened' : 'Claim'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
