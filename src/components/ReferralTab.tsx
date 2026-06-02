import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Share2, Copy, Trophy, ShieldCheck, Award, BarChart4, 
  Sparkles, Check, HelpCircle, Network, Flame 
} from 'lucide-react';
import { UserProfile } from '../types';
import { StoreDB } from '../services/store';

interface ReferralTabProps {
  user: UserProfile;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function ReferralTab({ user, showToast }: ReferralTabProps) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  // Generate unique URL using the Telegram Bot start query parameters
  const referralLink = `https://t.me/taskearnpro_bot?start=ref_${user.referralCode}`;
  const settings = StoreDB.getSettings();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showToast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Build simulated QR Code SVG layout
  const simulatedQR = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="w-32 h-32 text-indigo-400 bg-white p-2 rounded-xl">
      <path d="M0 0h30v30H0zm40 0h20v20H40zm30 0h30v30H70zM0 40h20v20H0zm60 40h20v20H60zm10-40h30v30H70zM0 70h30v30H0zm40 40h20v-20H40zm30 0h30v-30H70z" fill="currentColor"/>
      <path d="M10 10h10v10H10zm70 0h10v10H80zM10 80h10v10H10z" fill="#4338ca"/>
    </svg>
  `;

  const [topReferrers, setTopReferrers] = useState<any[]>(() => {
    return StoreDB.getLeaderboard('all').slice(0, 5);
  });

  useState(() => {
    // Sync with the latest user profile initially
    setTopReferrers(prev => {
      return prev.map(item => {
        if (item.uid === user.uid) {
          return {
            ...item,
            referralCount: user.referralCount,
            totalEarned: user.totalEarned,
            xp: user.xp
          };
        }
        return item;
      });
    });
  });

  useEffect(() => {
    // Periodically update some referral counts and total earnings of leaderboard contesters, and sort them dynamically!
    // Set to 120 seconds (2 minutes) instead of 6 seconds to prevent hyperactive rank-jumping and ensure stable UI!
    const interval = setInterval(() => {
      setTopReferrers(prev => {
        // Create duplicate copy of previous top referrers
        const clone = prev.map(item => ({ ...item }));
        
        // Pick one random contender (avoid the current user to keep their state exact, or let them also grow if simulated!)
        const targetIdx = Math.floor(Math.random() * clone.length);
        const targetObj = clone[targetIdx];
        
        if (targetObj && targetObj.uid !== user.uid) {
          // Increment random invites and earnings subtly
          const changeRefs = Math.random() > 0.8 ? 1 : 0;
          if (changeRefs > 0) {
            targetObj.referralCount += changeRefs;
            targetObj.totalEarned += changeRefs * 0.15; // direct T1 referral share
            targetObj.xp += changeRefs * 50;
          }
        } else if (targetObj) {
          // If it chose the current logged in user, pull latest real profile counts
          const latest = StoreDB.getUser(user.uid);
          if (latest) {
            targetObj.referralCount = latest.referralCount;
            targetObj.totalEarned = latest.totalEarned;
            targetObj.xp = latest.xp;
          }
        }
        
        // Re-sort the leaderboard so ranks can dynamically swap
        return clone.sort((a, b) => b.totalEarned - a.totalEarned);
      });
    }, 120000);

    return () => clearInterval(interval);
  }, [user.uid, user.referralCount, user.totalEarned, user.xp]);

  return (
    <div id="referrals-tab-root" className="p-4 space-y-4 text-left">
      {/* 1. TOP STATS OVERVIEW */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/15 rounded-2xl p-4 shadow-xl">
        <span className="text-[10px] font-mono font-bold text-indigo-400 flex items-center gap-1.5 uppercase">
          <Network className="w-4 h-4 ml-0.5 animate-pulse text-indigo-400" /> MULTI-LEVEL AFFILIATE ACTIVE
        </span>
        <h2 className="text-lg font-bold text-slate-100 mt-1">Grow Your Squad</h2>
        <p className="text-xs text-slate-400 mt-1">
          Invite friends & claim lifetime commission splits of every task, survey, and ad watch they complete!
        </p>

        {/* 3 Tier visual diagram */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-indigo-500/10">
            <span className="text-[10px] text-slate-400 block font-bold leading-tight">Tier 1 Refs</span>
            <span className="text-sm font-black text-indigo-400 font-mono">15% Cut</span>
            <span className="text-[9.5px] text-slate-500 block">Direct invites</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-indigo-500/10">
            <span className="text-[10px] text-slate-400 block font-bold leading-tight">Tier 2 Refs</span>
            <span className="text-sm font-black text-purple-400 font-mono">7% Cut</span>
            <span className="text-[9.5px] text-slate-500 block">Indirect tier</span>
          </div>
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-indigo-500/10">
            <span className="text-[10px] text-slate-400 block font-bold leading-tight">Tier 3 Refs</span>
            <span className="text-sm font-black text-amber-500 font-mono">3% Cut</span>
            <span className="text-[9.5px] text-slate-500 block">Squad level</span>
          </div>
        </div>
      </div>

      {/* 2. COPY BOX SECTION */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-3.5">
        <div>
          <label className="text-xs font-bold text-slate-400 block">Your Exclusive Referral Link</label>
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl mt-1.5 overflow-hidden p-1">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="bg-transparent flex-1 px-2.5 text-xs text-slate-300 font-mono focus:outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className="p-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Code display */}
          <div className="flex-1 bg-slate-950/60 border border-slate-850 rounded-xl p-2.5 flex justify-between items-center pr-3">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-mono">Referral Code</span>
              <span className="text-xs font-black font-mono text-slate-200">{user.referralCode}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user.referralCode);
                showToast('Referral Code copied!', 'success');
              }}
              className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px]"
            >
              Copy
            </button>
          </div>

          {/* QR Button */}
          <button
            onClick={() => setQrOpen(!qrOpen)}
            className="flex-1 bg-indigo-950/20 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer hover:bg-indigo-950/30 active:scale-95 transition"
          >
            <Share2 className="w-4 h-4" /> Share QR Code
          </button>
        </div>

        {/* Dynamic QR block if toggled */}
        {qrOpen && (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 border border-slate-850 rounded-2xl animate-fade text-center space-y-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Aesthetic QR Code</span>
            <div dangerouslySetInnerHTML={{ __html: simulatedQR }} />
            <p className="text-[10px] text-slate-500 font-mono">Scan code to join team of {user.firstName}</p>
          </div>
        )}
      </div>

      {/* 3. YOUR STATS SUMMARY */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase block">Active Referrals</span>
          <span className="text-lg font-black font-mono text-slate-150">{user.referralCount} Users</span>
        </div>
        <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase block">Total Net Commissions</span>
          <span className="text-lg font-black font-mono text-emerald-400">${user.referralEarned.toFixed(2)} USD</span>
        </div>
      </div>

      {/* 4. USER REFERRAL HISTORY */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
        <h4 className="text-[11.5px] uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-1.5 font-mono">
          <Users className="w-4 h-4 text-indigo-400 animate-pulse" /> Referral History (আপনার রেফারাল তালিকা)
        </h4>

        {(() => {
          const referralHistory = StoreDB.getUserReferrals(user.uid);
          if (referralHistory.length === 0) {
            return (
              <div className="text-center p-6 bg-slate-950/40 rounded-xl border border-slate-900/60 text-slate-500 text-xs italic">
                You haven't referred anyone yet. Share your code above to get started!
              </div>
            );
          }
          return (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {referralHistory.map((refUser) => (
                <div 
                  key={refUser.uid} 
                  className="flex items-center justify-between p-2.5 bg-slate-950/45 border border-slate-900/80 rounded-xl hover:border-slate-800 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={refUser.photoUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${refUser.username}`} 
                      alt={refUser.username} 
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full border border-slate-800"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block truncate max-w-[150px]">
                        {refUser.firstName || 'User'}
                      </span>
                      <span className="text-[9.5px] text-slate-500 block font-mono">
                        @{refUser.username || 'unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-500 block font-mono">
                      Joined: {new Date(refUser.joinedAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-emerald-450 font-black block font-mono">
                      🟡 {refUser.rewardPoints || 0} Pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* 5. REFERRER LEADERBOARD */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
        <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-3.5 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard Contesters
        </h4>

        <div className="space-y-2">
          {topReferrers.map((ref, idx) => (
            <div
              key={ref.uid}
              className={`flex items-center justify-between py-2 px-3 rounded-xl border ${
                ref.uid === user.uid 
                  ? 'bg-indigo-950/35 border-indigo-500/20' 
                  : 'bg-slate-950/40 border-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Ranking circle */}
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10.5px] font-mono leading-none ${
                  idx === 0 ? 'bg-amber-500 text-slate-950 font-black' :
                  idx === 1 ? 'bg-slate-400 text-slate-950 font-black' :
                  idx === 2 ? 'bg-amber-700 text-white font-bold' :
                  'bg-slate-800 text-slate-450'
                }`}>
                  {idx + 1}
                </span>

                <img
                  src={ref.photoUrl}
                  alt={ref.username}
                  className="w-7 h-7 rounded-full border border-slate-800"
                />

                <div>
                  <span className="text-xs font-bold text-slate-200 block truncate max-w-[130px]">
                    @{ref.username}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Invites: {ref.referralCount}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  ${ref.totalEarned.toFixed(2)}
                </span>
                <span className="text-[9.5px] text-slate-500 block">Net USD</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
