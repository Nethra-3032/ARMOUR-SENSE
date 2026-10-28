import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Database,
  BrainCircuit,
  Wrench,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Radio,
  FileSpreadsheet
} from 'lucide-react';
import { Header } from '../components/Header';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = [
    {
      to: '/',
      label: 'Mission Control',
      icon: LayoutDashboard,
      badge: 'LIVE'
    },
    {
      to: '/predict',
      label: 'AI Diagnostic Studio',
      icon: Cpu,
      badge: 'ML'
    },
    {
      to: '/dataset',
      label: 'Fleet Telemetry (10k)',
      icon: Database,
    },
    {
      to: '/model',
      label: 'Model Lab & XAI',
      icon: BrainCircuit,
      badge: '98.4%'
    },
    {
      to: '/maintenance',
      label: 'Maintenance Orders',
      icon: Wrench,
    },
    {
      to: '/settings',
      label: 'System & Hardware',
      icon: SettingsIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Disclaimer Prototype Disclosure Banner */}
      <DisclaimerBanner />

      {/* Main Top Header */}
      <Header />

      {/* App Body with Sidebar + Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tactical Sidebar */}
        <aside
          className={`border-r border-slate-800 bg-[#090e17]/95 backdrop-blur-md flex flex-col transition-all duration-300 relative z-30 select-none ${
            collapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Subheader / Status */}
          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="text-[11px] font-mono-code uppercase tracking-wider text-slate-400">
                  TACTICAL RADAR
                </span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors mx-auto"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono-code transition-all relative group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.12)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'group-hover:text-cyan-300'}`} />
                  
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Active Indicator Bar on Left */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer telemetry ping */}
          {!collapsed && (
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[10px] font-mono-code text-slate-400">
              <div className="flex items-center justify-between">
                <span>MIL-STD-1553B</span>
                <span className="text-emerald-400">SYNC OK</span>
              </div>
              <p className="text-slate-500 mt-1">ARMORSENSE CORE ENGINE</p>
            </div>
          )}
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto bg-[#070a0f] p-4 lg:p-6 tactical-grid relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
