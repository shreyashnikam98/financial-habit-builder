import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, subtext, color = 'emerald' }) => {
  const colorMap = {
    emerald: 'from-emerald-500/20 to-teal-500/5 text-emerald-500 border-emerald-500/20',
    blue: 'from-blue-500/20 to-indigo-500/5 text-blue-500 border-blue-500/20',
    purple: 'from-purple-500/20 to-violet-500/5 text-purple-500 border-purple-500/20',
    amber: 'from-amber-500/20 to-orange-500/5 text-amber-500 border-amber-500/20',
    rose: 'from-rose-500/20 to-pink-500/5 text-rose-500 border-rose-500/20',
  };

  const badgeColorMap = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border bg-gradient-to-br ${colorMap[color] || colorMap.emerald}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </h3>
        {trend && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColorMap[color] || badgeColorMap.emerald}`}>
            {trend}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default StatCard;
