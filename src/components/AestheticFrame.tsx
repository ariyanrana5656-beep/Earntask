import React from 'react';
import { Smartphone, Monitor, ShieldCheck, Zap, ShieldAlert, Layout } from 'lucide-react';

interface FrameProps {
  children: React.ReactNode;
  activeSimUser: string;
  onToggleUser: () => void;
  viewMode: 'user' | 'admin';
  onChangeViewMode: (mode: 'user' | 'admin') => void;
}

export default function AestheticFrame({ 
  children, 
  activeSimUser, 
  onToggleUser, 
  viewMode, 
  onChangeViewMode 
}: FrameProps) {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 flex flex-col justify-center items-center py-0 sm:py-6 relative overflow-hidden">
      {/* Immersive radial gradient background dots */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 z-0 pointer-events-none" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl z-0 pointer-events-none" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl z-0 pointer-events-none" />

      {/* Demo helper banner at the top */}
      {viewMode === 'admin' && (
        <header className="w-full max-w-md bg-slate-900/85 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex flex-col gap-2 z-10 sm:rounded-t-3xl sm:border shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-450 animate-pulse" />
              <span className="font-mono text-[11px] text-slate-400 tracking-tight flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 inline" /> TELEGRAM SIMULATOR
              </span>
            </div>
            <button
              onClick={onToggleUser}
              className="bg-slate-800 hover:bg-slate-750 transition text-[10px] font-bold px-2 py-0.5 rounded text-slate-300 flex items-center gap-1 active:scale-95 shadow cursor-pointer border border-slate-700"
            >
              <Zap className="w-2.5 h-2.5 text-indigo-400" /> Swap tester
            </button>
          </div>

          {/* COMPARTMENTALIZED SYSTEM SELECTOR: ADMIN PANEL VS USER PANEL */}
          <div className="grid grid-cols-2 bg-slate-950 p-[3px] rounded-lg border border-slate-800">
            <button
              onClick={() => onChangeViewMode('user')}
              className="py-1 rounded-md text-[10.5px] font-black tracking-wide uppercase transition flex items-center justify-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-350"
            >
              <Layout className="w-3 h-3" /> User Panel
            </button>
            <button
              onClick={() => onChangeViewMode('admin')}
              className="py-1 rounded-md text-[10.5px] font-black tracking-wide uppercase transition flex items-center justify-center gap-1.5 cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-650 text-white shadow"
            >
              <ShieldAlert className="w-3 h-3" /> Admin Panel
            </button>
          </div>
        </header>
      )}

      {/* Main Core View Area */}
      <main className={`w-full max-w-md bg-slate-955 bg-opacity-95 backdrop-blur-xl sm:border flex flex-col h-[100dvh] sm:h-[840px] sm:max-h-[860px] relative z-10 ${
        viewMode === 'admin' 
          ? 'sm:rounded-b-3xl border-t-0 sm:border-x sm:border-b border-slate-850' 
          : 'sm:rounded-3xl border-slate-850'
      } overflow-hidden shadow-2xl shadow-indigo-950/40`}>
        <div id="telegram-content-area" className="flex flex-col flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Small subtle branding footer */}
      <footer className="mt-4 hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
        <Monitor className="w-3.5 h-3.5" /> Responsive Auto-Scale Active • 100% Secure Firebase ABAC rules configured
      </footer>
    </div>
  );
}
