import React, { useState, useEffect } from 'react';
import { Shield, Radio, Activity, Cpu, WifiOff, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

export const Header: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [apiOnline, setApiOnline] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    setChecking(true);
    try {
      await apiService.getHealth();
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    } finally {
      setTimeout(() => setChecking(false), 500);
    }
  };

  useEffect(() => {
    checkHealth();
    const pingInterval = setInterval(checkHealth, 30000);
    return () => clearInterval(pingInterval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/40 glow-border-cyan">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black font-orbitron tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-white bg-clip-text text-transparent">
              ARMORSENSE
            </span>
            <span className="text-[10px] uppercase font-mono-code px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              v1.0
            </span>
          </div>
          <p className="text-[10px] text-slate-400 tracking-wider font-mono-code uppercase -mt-0.5">
            Intelligence Before Failure
          </p>
        </div>
      </div>

      {/* System Status HUD indicators */}
      <div className="flex items-center gap-3 lg:gap-5">
        {/* Hardware Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-[11px] font-mono-code text-slate-300">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>OBD-II SCANNER: <span className="text-amber-400 font-semibold">SIMULATED</span></span>
        </div>

        {/* API Status Pill */}
        <div 
          onClick={checkHealth}
          className="flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-[11px] font-mono-code transition-all"
          title="Click to check API ping"
        >
          <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-red-400 shadow-[0_0_8px_#ef4444]'}`} />
          <span className="text-slate-300">API:</span>
          <span className={apiOnline ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {apiOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
          <RefreshCw className={`w-3 h-3 text-slate-400 ml-1 ${checking ? 'animate-spin' : ''}`} />
        </div>

        {/* Live Clock */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/50 border border-slate-800/80 font-mono-code text-xs text-cyan-300/90 tracking-widest">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{timeStr || 'SYNCING...'}</span>
        </div>
      </div>
    </header>
  );
};
