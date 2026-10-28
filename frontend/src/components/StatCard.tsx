import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  color?: 'cyan' | 'amber' | 'red' | 'emerald' | 'slate';
  trend?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  color = 'cyan',
  trend,
  onClick
}) => {
  const colorMap = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      text: 'text-cyan-400',
      glow: 'group-hover:text-cyan-300'
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      text: 'text-amber-400',
      glow: 'group-hover:text-amber-300'
    },
    red: {
      border: 'hover:border-red-500/40',
      iconBg: 'bg-red-500/10 text-red-400 border-red-500/20',
      text: 'text-red-400',
      glow: 'group-hover:text-red-300'
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      text: 'text-emerald-400',
      glow: 'group-hover:text-emerald-300'
    },
    slate: {
      border: 'hover:border-slate-500/40',
      iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
      text: 'text-slate-300',
      glow: 'group-hover:text-slate-200'
    }
  }[color];

  return (
    <div
      onClick={onClick}
      className={`hud-panel rounded-xl p-5 border border-slate-800/90 group transition-all duration-300 relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${colorMap.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 font-mono-code">
              {title}
            </span>
            {badge && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          <div className={`mt-2 text-2xl lg:text-3xl font-bold font-orbitron tracking-tight text-white ${colorMap.glow}`}>
            {value}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
              {subtitle}
            </p>
          )}
          {trend && (
            <span className="mt-2 inline-block text-[11px] font-mono-code text-cyan-400/90">
              {trend}
            </span>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorMap.iconBg} transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {/* Decorative subtle bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-700/40 to-transparent group-hover:via-cyan-500/50 transition-colors" />
    </div>
  );
};
