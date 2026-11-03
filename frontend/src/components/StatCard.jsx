import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  color = 'navy', // 'navy', 'ocean', 'teal', 'amber'
  badge,
}) => {
  const colorMap = {
    navy: {
      iconBg: 'bg-[#142B45]/10',
      iconText: 'text-[#142B45]',
      borderTop: 'border-t-[#142B45]',
    },
    ocean: {
      iconBg: 'bg-[#2376A8]/10',
      iconText: 'text-[#2376A8]',
      borderTop: 'border-t-[#2376A8]',
    },
    teal: {
      iconBg: 'bg-[#27A69A]/10',
      iconText: 'text-[#27A69A]',
      borderTop: 'border-t-[#27A69A]',
    },
    amber: {
      iconBg: 'bg-amber-500/10',
      iconText: 'text-amber-600',
      borderTop: 'border-t-amber-500',
    },
  };

  const scheme = colorMap[color] || colorMap.navy;

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 border-t-4 ${scheme.borderTop}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scheme.iconBg} ${scheme.iconText}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </h3>
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md ${
                trendPositive
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-rose-700 bg-rose-50'
              }`}
            >
              {trendPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;

