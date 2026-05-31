import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, HelpCircle, PhoneCall, PlusCircle, CheckCircle, 
  Send, Clock, ChevronDown, Award, SendIcon, ShieldAlert, Headphones, ExternalLink 
} from 'lucide-react';
import { UserProfile, SupportTicket } from '../types';
import { StoreDB } from '../services/store';

interface SupportCenterProps {
  user: UserProfile;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export default function SupportCenter({ user, showToast }: SupportCenterProps) {
  const settings = StoreDB.getSettings();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  
  // Create ticket form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('wallet');
  const [message, setMessage] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    loadTickets();
  }, [user.uid]);

  const loadTickets = () => {
    setTickets(StoreDB.getUserTickets(user.uid));
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast('Please enter both subject and ticket message details.', 'error');
      return;
    }

    try {
      StoreDB.createTicket(user.uid, subject, category, message);
      showToast('Support ticket created. Support team will review shortly!', 'success');
      setSubject('');
      setMessage('');
      setShowCreate(false);
      loadTickets();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReplyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      const updated = StoreDB.replyTicket(
        selectedTicket.id, 
        user.uid, 
        `${user.firstName} ${user.lastName}`, 
        replyText
      );
      if (updated) {
        setSelectedTicket(updated);
        setReplyText('');
        loadTickets();
        showToast('Ticket reply submitted.', 'success');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const FAQS = [
    { q: 'How long do withdrawals take to process?', a: 'Standard bKash/Nagad/Rocket manual transfers are checked and paid out within 2 to 12 hours. Binance Pay ID and Binance USDT requests are processed automatically through API with instant 5-minute deliveries.' },
    { q: 'Why was my task verification screenshot rejected?', a: 'Your submission gets auto-rejected if the screenshot does not display the target channel joined or video watched, or if you submitted a duplicate screenshot used by other users. Ensure clear proofs!' },
    { q: 'Is multiple account usage allowed?', a: 'Strictly forbidden. Our anti-abuse block system logs IP, country parameters, and browser hashes to stop fraud farms. Using VPNs or multiple Telegram addresses on the same device results in permanent automated bans.' },
    { q: 'What is the Gold VIP bonus rate?', a: 'UP upgrading to Gold VIP tier (5,000 Coins), your wallet gets an instant 30% added payment multiplier on all automatic ad-watches, custom surveys, and tasks completed.' }
  ];

  return (
    <div id="support-center-root" className="p-4 space-y-4 text-left">
      {/* PERSISTENT ADMIN SUPPORT REDIRECT CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-purple-950/20 border border-indigo-500/20 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-xl animate-fade">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Headphones className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-widest font-black uppercase text-indigo-400">CUSTOMER HELPDESK SUPPORT</span>
            <h4 className="text-sm font-extrabold text-slate-100 font-sans">Contact Official Support (সরাসরি সাপোর্ট নিন)</h4>
            <p className="text-[11px] text-slate-400 leading-tight">
              Click to open our Telegram group, discuss issues, or chat 1-on-1 with administrative operators.
            </p>
          </div>
        </div>

        <a
          href={settings.supportLink || "https://t.me/TaskEarnProSupport"}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white text-xs font-black rounded-xl transition shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer uppercase tracking-wider"
        >
          <span>Connect Now</span> <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* FAQ BOARD */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl">
        <h3 className="text-xs uppercase font-extrabold text-indigo-400 tracking-wider mb-3.5 flex items-center gap-1.5ClassName bg-slate-900 py-1">
          <HelpCircle className="w-5 h-5 text-indigo-400" /> Frequently Asked Questions
        </h3>

        <div className="space-y-1.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-3 flex justify-between items-center text-left text-xs font-bold text-slate-200 cursor-pointer active:bg-slate-900/60 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3.5 border-t border-slate-900 text-[11px] text-slate-400 leading-relaxed bg-slate-950/70">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* CHAT/TICKETS MANAGEMENT SECTION */}
      <div className="bg-slate-900 border border-slate-850 p-4 rounded-2xl relative">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-400" /> Active Support Tickets
          </h3>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-[10px] bg-indigo-650 hover:bg-indigo-650 px-2.5 py-1.5 rounded-lg text-white font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <PlusCircle className="w-3 h-3 text-white inline" /> New Ticket
          </button>
        </div>

        {/* Form if click create new */}
        {showCreate && (
          <form onSubmit={handleCreateTicket} className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl space-y-3 mb-4 animate-fade">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase block">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as SupportTicket['category'])}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                <option value="wallet">Wallet & Withdrawal Pending</option>
                <option value="task">Task Completion Errors</option>
                <option value="bug">Technical Applet Bug</option>
                <option value="other">General Inquiries</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase block">Subject Title</label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="E.g., bKash withdrawal delayed 5 hours"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase block">Explain issue details</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Give us details: transaction screenshots, times..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-lg transition"
            >
              Submit Ticket Thread
            </button>
          </form>
        )}

        {/* Tickets log index */}
        {tickets.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-6 text-center">No tickets submitted. We are online 24/7!</p>
        ) : (
          <div className="space-y-2">
            {tickets.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className="w-full p-3 bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl text-left flex justify-between items-center cursor-pointer transition"
              >
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 tracking-tight">
                    [{t.category}] #{t.id.slice(-6)}
                  </span>
                  <h4 className="text-xs font-extrabold text-slate-200 mt-0.5">{t.subject}</h4>
                  <span className="text-[9.5px] text-slate-500 font-mono">
                    Created: {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className={`text-[9px] font-bold rounded-md px-1.5 py-1 uppercase inline-block ${
                    t.status === 'answered' ? 'bg-indigo-550/10 text-indigo-400' :
                    t.status === 'closed' ? 'bg-slate-800 text-slate-500' :
                    'bg-amber-500/10 text-amber-400 animate-pulse'
                  }`}>
                    {t.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Chat overlay modal if selected */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm h-[580px] bg-slate-900 border border-slate-700/60 rounded-3xl flex flex-col justify-between overflow-hidden shadow-2xl relative"
            >
              {/* Message Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-extrabold">
                    {selectedTicket.category} TICKET DISCUSSION
                  </span>
                  <h3 className="text-xs font-bold text-white truncate max-w-[200px]">{selectedTicket.subject}</h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-705 rounded text-xs text-white"
                >
                  Close
                </button>
              </div>

              {/* Chat timeline feed bubble stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/20">
                {selectedTicket.messages.map((m, idx) => {
                  const isAdminReply = m.senderId === 'system_admin' || m.senderId === 'admin';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[80%] ${
                        isAdminReply ? 'mr-auto text-left' : 'ml-auto text-right'
                      }`}
                    >
                      <span className="text-[9px] text-slate-500 font-mono mb-0.5">
                        {m.senderName}
                      </span>
                      <div className={`p-3 rounded-2xl text-[11.5px] leading-relaxed shadow-sm ${
                        isAdminReply 
                          ? 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-850' 
                          : 'bg-indigo-600 text-white rounded-tr-none'
                      }`}>
                        {m.text}
                      </div>
                      <span className="text-[8.5px] text-slate-550 mt-1 font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Sending reply box */}
              <form onSubmit={handleReplyTicket} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Type message reply to support..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-indigo-650 hover:bg-indigo-600 rounded-xl text-white shadow font-bold transition flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4 fill-white" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
