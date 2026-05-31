import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Landmark, ArrowUpRight, ArrowDownLeft, Clock, Info, 
  RefreshCw, CheckCircle, HelpCircle, ShieldCheck, Coins, DollarSign, Activity, Settings 
} from 'lucide-react';
import { UserProfile, WithdrawalRequest } from '../types';
import { StoreDB } from '../services/store';

interface WalletWithdrawProps {
  user: UserProfile;
  onRefreshUser: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function WalletWithdraw({ user, onRefreshUser, showToast }: WalletWithdrawProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalRequest['method']>('bKash');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const [coinInput, setCoinInput] = useState('');

  const [deposits, setDeposits] = useState<any[]>([]);
  const [depMethod, setDepMethod] = useState('bKash');
  const [depAmount, setDepAmount] = useState('');
  const [depTxId, setDepTxId] = useState('');
  const [depLoading, setDepLoading] = useState(false);

  const settings = StoreDB.getSettings();
  const minReferrals = (settings as any).minReferrals || 0;
  const referralCount = user.referralCount || 0;
  const isEligible = referralCount >= minReferrals;

  useEffect(() => {
    loadTransactions();
    loadDeposits();
  }, [user.uid]);

  const loadTransactions = () => {
    setWithdrawals(StoreDB.getUserWithdrawals(user.uid));
  };

  const loadDeposits = () => {
    setDeposits(StoreDB.getUserDepositRequests(user.uid));
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(depAmount);
    const minDeposit = (settings as any).minDepositAmount || 2.0;

    if (!depTxId.trim()) {
      showToast('Please enter the Transaction ID.', 'error');
      return;
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast('Please enter a valid deposit amount.', 'error');
      return;
    }
    if (amountVal < minDeposit) {
      showToast(`Minimum deposit required is $${minDeposit.toFixed(2)} USD.`, 'error');
      return;
    }

    setDepLoading(true);
    setTimeout(() => {
      try {
        StoreDB.submitDepositRequest(user.uid, amountVal, depMethod, depTxId);
        showToast('Deposit Transaction ID submitted successfully! Admin will verify soon.', 'success');
        setDepAmount('');
        setDepTxId('');
        loadDeposits();
        onRefreshUser();
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setDepLoading(false);
      }
    }, 1200);
  };

  // Convert Coin to Cash system (1000 coins = $1.00)
  const handleExchangeCoins = () => {
    const numCoins = parseInt(coinInput);
    if (!numCoins || numCoins < 500) {
      showToast('Minimum exchange amount is 500 Coins.', 'error');
      return;
    }
    if (user.coins < numCoins) {
      showToast('Insufficient coin balance in your vault.', 'error');
      return;
    }

    setExchanging(true);
    setTimeout(() => {
      try {
        const cashValue = (numCoins / 1000); // 1000 Coins = $1.00 USD
        const updatedUser = {
          coins: user.coins - numCoins,
          balance: user.balance + cashValue,
          totalEarned: user.totalEarned + cashValue
        };
        StoreDB.updateUser(user.uid, updatedUser);
        
        // Notify user
        showToast(`Exchanged ${numCoins} Coins for $${cashValue.toFixed(2)} USD successfully!`, 'success');
        setCoinInput('');
        onRefreshUser();
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setExchanging(false);
      }
    }, 1200);
  };

  const handleWithdrawRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(withdrawAmount);
    
    if (!withdrawAccount.trim()) {
      showToast('Please enter your account number/wallet ID.', 'error');
      return;
    }
    if (user.referralCount < minReferrals) {
      showToast(`Minimum ${minReferrals} referrals are required to request payout.`, 'error');
      return;
    }
    if (isNaN(amountVal) || amountVal < 5.0) {
      showToast('Minimum withdrawal amount is $5.00 USD.', 'error');
      return;
    }
    if (user.balance < amountVal) {
      showToast('Insufficient active balance.', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        StoreDB.requestWithdrawal(user.uid, selectedMethod, withdrawAccount, amountVal);
        showToast(`Withdrawal of $${amountVal.toFixed(2)} requested! Checking in process.`, 'success');
        setWithdrawAmount('');
        setWithdrawAccount('');
        loadTransactions();
        onRefreshUser();
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    }, 1500);
  };

  const AVAILABLE_METHODS: { id: WithdrawalRequest['method']; name: string; type: string; placeholder: string }[] = [
    { id: 'bKash', name: 'bKash Personal', type: 'Mobile Financial Service', placeholder: 'Enter personal bKash number (+880)' },
    { id: 'Nagad', name: 'Nagad Wallet', type: 'Mobile Financial Service', placeholder: 'Enter personal Nagad number (+880)' },
    { id: 'Rocket', name: 'Rocket Personal', type: 'Mobile Financial Service', placeholder: 'Enter personal Rocket number (+880)' },
    { id: 'Upay', name: 'Upay Agent/Personal', type: 'Mobile Financial Service', placeholder: 'Enter Upay wallet number (+880)' },
    { id: 'BinancePay', name: 'Binance Pay ID', type: 'Crypto Wallet', placeholder: 'Enter your 9-digit Binance Pay UID' },
    { id: 'BinanceUSDT', name: 'Binance USDT (TRC-20)', type: 'Crypto Address', placeholder: 'Enter your TRC20 Wallet Address (starts with T)' },
    { id: 'Payeer', name: 'Payeer Account', type: 'E-Wallet', placeholder: 'Enter Payeer Account ID (P10283...)' },
    { id: 'FaucetPay', name: 'FaucetPay Email', type: 'Micro-wallet', placeholder: 'Enter registered FaucetPay email address' }
  ];

  return (
    <div id="wallet-withdraw-container" className="p-4 space-y-4 text-left">
      {/* 1. GLASS BALANCE CARD */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glow behind */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full filter blur-xl" />
        
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-indigo-300">Total Active Balance</span>
            <h2 className="text-3xl font-black font-mono text-slate-100">${user.balance.toFixed(2)} <span className="text-sm font-semibold">USD</span></h2>
          </div>
          <Wallet className="w-10 h-10 text-indigo-400 opacity-60" />
        </div>

        {/* Ledger columns */}
        <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-slate-800/80 text-center">
          <div>
            <span className="text-[9px] text-slate-400 block uppercase font-mono">Pending Bal</span>
            <span className="text-xs font-black text-amber-500 font-mono">${user.pendingBalance.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block uppercase font-mono">Wallet Coins</span>
            <span className="text-xs font-black text-indigo-400 font-mono">🟡 {user.coins}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 block uppercase font-mono">Reward Pts</span>
            <span className="text-xs font-black text-rose-450 font-mono">🎖️ {user.rewardPoints}</span>
          </div>
        </div>
      </div>

      {/* 2. COIN EXCHANGE COFFER CONVERTER */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl">
        <h3 className="text-xs uppercase font-bold text-indigo-400 tracking-wider mb-2 flex items-center gap-1.5">
          <RefreshCw className="w-4 h-4 text-indigo-400" /> Coin Exchange Vault
        </h3>
        <p className="text-[10.5px] text-slate-400 mb-3 leading-relaxed">
          Convert your collected coins into withdrawable USD cash! Rate: <b>1,000 Coins = $1.00 USD</b>. Minimum: 500 Coins.
        </p>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min: 500 Coins"
            value={coinInput}
            onChange={e => setCoinInput(e.target.value)}
            disabled={exchanging}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleExchangeCoins}
            disabled={exchanging}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-650 text-white font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {exchanging ? 'Converting...' : 'Convert'}
          </button>
        </div>
      </div>
      {/* 3. WITHDRAW REQUEST SUBMIT FORM OR LOCK DEPOSIT SCREEN */}
      {user.withdrawLocked ? (
        <div id="unlock-withdrawals-section" className="bg-slate-900 border-2 border-amber-500/20 p-5 rounded-2xl space-y-4">
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/10 border border-amber-900/40 text-amber-300 rounded-xl">
            <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="text-left">
              <span className="text-xs font-black uppercase font-mono tracking-wider text-amber-400">🔒 Withdraw Locked (উইথড্র লক করা হয়েছে)</span>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                Your withdrawal section has been locked by administrator. To unlock withdrawal privileges, you are required to complete a minimum verification deposit of <b>${((settings as any).minDepositAmount || 2.0).toFixed(2)} USD</b>.
              </p>
              <p className="text-[11px] text-amber-250 mt-1.5 font-medium">
                উইথড্র লক আনলক করতে কমপক্ষে <b>${((settings as any).minDepositAmount || 2.0).toFixed(2)} USD</b> ডিপোজিট করুন এবং নিচের ফর্মে ট্রানজেকশন আইডি (TrxID) সাবমিট করুন। ভেরিফিকেশন সফল হলে পেমেন্ট সুবিধা স্বয়ংক্রিয়ভাবে আনলক হয়ে যাবে।
              </p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 text-left">
            <span className="text-[10px] text-indigo-400 font-extrabold uppercase font-mono tracking-wider">💳 Send Money Wallet Details (ডিপোজিট এড্রেস)</span>
            <p className="text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-850">
              {(settings as any).depositWalletAddress || 'bKash/Nagad/Rocket (Personal): +8801700112233\nBinance Pay UID: 73927492'}
            </p>
          </div>

          <form onSubmit={handleDepositSubmit} className="space-y-3.5 text-left">
            <div>
              <label className="text-[11px] text-slate-400 font-bold">Select Deposit Channel (পেমেন্ট গেটওয়ে)</label>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {['bKash', 'Nagad', 'Rocket', 'Binance Pay'].map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setDepMethod(method)}
                    className={`p-2 rounded-xl text-center border text-[10.5px] font-bold transition-all cursor-pointer ${
                      depMethod === method 
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-300' 
                        : 'bg-slate-955 border-slate-850 text-slate-550 hover:border-slate-800'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold">Sent Amount ($ USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={((settings as any).minDepositAmount || 2.0)}
                    value={depAmount}
                    onChange={e => setDepAmount(e.target.value)}
                    placeholder={`Min $${((settings as any).minDepositAmount || 2.0).toFixed(2)}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-6 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold">Transaction ID (TrxID)</label>
                <input
                  type="text"
                  required
                  value={depTxId}
                  onChange={e => setDepTxId(e.target.value)}
                  placeholder="E.g., 9K72HJ89X / 739281"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={depLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-650 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              {depLoading ? 'Submitting details...' : 'Submit Deposit Proof (পেমেন্ট তথ্য সাবমিট করুন)'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl">
          <h3 className="text-xs uppercase font-bold text-indigo-400 tracking-wider mb-3 flex items-center gap-1.5">
            <Landmark className="w-4 h-4 text-indigo-400" /> Request Withdrawal
          </h3>

          {minReferrals > 0 && (
            <div className={`p-4 rounded-2xl border mb-4 space-y-2 select-none ${
              isEligible 
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
                : 'bg-amber-955/25 border-amber-900/30 text-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider font-mono">
                  👥 Referral Lock Verified
                </span>
                <span className="text-xs font-bold font-mono">
                  {referralCount} / {minReferrals} Invites
                </span>
              </div>
              
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${isEligible ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, (referralCount / minReferrals) * 100)}%` }}
                />
              </div>

              <p className="text-[10.5px] text-slate-405 leading-normal font-medium">
                {isEligible ? (
                  <span className="text-emerald-450 font-bold block">✓ Safe with payout unlock requirements fulfilled!</span>
                ) : (
                  <span className="text-amber-450 block leading-relaxed">
                    ⚠️ Minimum <b>{minReferrals} referrals</b> are required to request payouts. Invite more friends to unlock withdraw channel! <br/>
                    (উইথড্র করতে কমপক্ষে <b>{minReferrals} টি একটিভ রেফারেল</b> লাগবে আপনার। বর্তমান রেফারেল: <b>{referralCount} টি</b>)
                  </span>
                )}
              </p>
            </div>
          )}

          <form onSubmit={handleWithdrawRequest} className="space-y-3.5">
            {/* Method Selection */}
            <div>
              <label className="text-[11px] text-slate-405 font-bold">Select Payment Gateway</label>
              <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                {AVAILABLE_METHODS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-2 rounded-xl text-center border text-[10.5px] font-bold transition-all cursor-pointer ${
                      selectedMethod === m.id 
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-300' 
                        : 'bg-slate-950 border-slate-850 text-slate-550 hover:border-slate-800'
                    }`}
                  >
                    {m.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet placeholder notes */}
            {AVAILABLE_METHODS.find(m => m.id === selectedMethod) && (
              <span className="p-1 px-2.5 rounded bg-slate-950 text-slate-400 text-[10px] font-mono block border border-slate-850">
                ℹ️ Method: {AVAILABLE_METHODS.find(m => m.id === selectedMethod)?.type}
              </span>
            )}

            {/* Account information input */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-bold">Payout Wallet ID / Phone Number</label>
              <input
                type="text"
                required
                value={withdrawAccount}
                onChange={e => setWithdrawAccount(e.target.value)}
                placeholder={AVAILABLE_METHODS.find(m => m.id === selectedMethod)?.placeholder}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Amount input */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-bold">Withdraw Amount ($ USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Minimum $5.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7.5 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <span className="absolute right-3.5 top-2.5 text-slate-500 font-bold text-[10px] uppercase font-mono">USD</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isEligible}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-650/15 transition active:scale-95 cursor-pointer"
            >
              {loading ? 'Processing payment...' : !isEligible ? `Need ${minReferrals - referralCount} more referrals` : 'Send Withdrawal Request'}
            </button>
          </form>
        </div>
      )}

      {/* 4. WITHDRAW REQUEST HISTORY LOGS */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
        <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-400" /> Withdrawal Queue & History
        </h4>

        {withdrawals.length === 0 ? (
          <p className="text-xs text-slate-500 p-4 text-center italic">No withdrawals requested yet.</p>
        ) : (
          <div className="space-y-2">
            {withdrawals.map(w => (
              <div
                key={w.id}
                className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
                    <span>{w.method}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({w.accountDetails})</span>
                  </div>
                  <span className="text-[9.5px] font-mono text-slate-550 block mt-0.5">
                    ID: {w.id} • {new Date(w.requestedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-slate-200 block">${w.amount.toFixed(2)}</span>
                  <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 inline-block capitalize ${
                    w.status === 'approved' ? 'bg-emerald-500/10 text-emerald-450' : 
                    w.status === 'rejected' ? 'bg-rose-500/10 text-rose-450' : 
                    'bg-amber-500/10 text-amber-450 animate-pulse'
                  }`}>
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. DEPOSIT HISTORY LOGS */}
      {deposits.length > 0 && (
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
          <h4 className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Deposit History & Verification
          </h4>

          <div className="space-y-2">
            {deposits.map(d => (
              <div
                key={d.id}
                className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-200">
                    <span>{d.method} Verification</span>
                    <span className="text-[10px] text-slate-450 font-normal">({d.txId})</span>
                  </div>
                  <span className="text-[9.5px] font-mono text-slate-550 block mt-0.5">
                    ID: {d.id} • {new Date(d.submittedAt).toLocaleDateString()}
                  </span>
                  {d.adminNote && (
                    <span className="text-[10px] text-slate-450 italic mt-1 block">
                      Admin Note: {d.adminNote}
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-450 block">+${d.amount.toFixed(2)}</span>
                  <span className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 inline-block capitalize ${
                    d.status === 'approved' ? 'bg-emerald-500/10 text-emerald-450' : 
                    d.status === 'rejected' ? 'bg-rose-500/10 text-rose-450' : 
                    'bg-amber-500/10 text-amber-450 animate-pulse'
                  }`}>
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
