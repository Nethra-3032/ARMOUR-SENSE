import React from 'react';

interface RiskBadgeProps {
  category: 'Low' | 'Moderate' | 'High' | 'Critical' | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, size = 'md' }) => {
  const normCategory = category?.toLowerCase() || 'low';

  let config = {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    glow: 'shadow-emerald-500/20'
  };

  if (normCategory === 'moderate' || normCategory === 'warning') {
    config = {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      glow: 'shadow-amber-500/20'
    };
  } else if (normCategory === 'high') {
    config = {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      dot: 'bg-orange-400',
      glow: 'shadow-orange-500/20'
    };
  } else if (normCategory === 'critical') {
    config = {
      bg: 'bg-red-500/15',
      border: 'border-red-500/40',
      text: 'text-red-400',
      dot: 'bg-red-400 animate-pulse',
      glow: 'shadow-red-500/30'
    };
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs tracking-wider',
    lg: 'px-3.5 py-1.5 text-sm font-semibold tracking-wide'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClasses} shadow-sm ${config.glow} font-mono-code uppercase font-semibold`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{category}</span>
      {score !== undefined && (
        <span className="opacity-80 font-normal">({score.toFixed(1)}%)</span>
      )}
    </span>
  );
};
