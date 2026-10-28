import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

type Tone = 'blue' | 'emerald' | 'amber' | 'red' | 'purple';

export interface StatCardItem {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  tone: Tone;
  trend?: { direction: 'up' | 'down'; label: string };
}

// کلاس‌ها کامل نوشته شده‌اند تا Tailwind آن‌ها را بسازد
const toneClasses: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

// اعداد طولانی کوچک‌تر نمایش داده می‌شوند تا از کارت بیرون نزنند
function valueSizeClass(value: string | number) {
  const length = String(value).length;
  if (length > 13) return 'text-sm xl:text-base leading-6';
  if (length > 10) return 'text-base xl:text-lg leading-6 sm:leading-7';
  if (length > 7) return 'text-lg xl:text-xl leading-7 sm:leading-8';
  return 'text-xl sm:text-[22px] xl:text-2xl leading-7 sm:leading-8';
}

export default function StatCards({ cards }: { cards: StatCardItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4">
      {cards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="group bg-white rounded-xl sm:rounded-2xl border border-[rgba(226,232,240,0.8)] shadow-[0_4px_20px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.1)] p-3 sm:p-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-2 sm:flex sm:gap-4 min-w-0 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-[#DDE3EA] hover:shadow-[0_16px_48px_rgba(15,23,42,0.12),0_8px_24px_rgba(15,23,42,0.08)]"
          >
            <span className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${toneClasses[stat.tone]}`}>
              <Icon className="w-4 h-4 sm:w-6 sm:h-6" strokeWidth={1.8} />
            </span>
            <div className="contents sm:block sm:min-w-0 sm:flex-1">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <p className="text-xs sm:text-sm text-slate-500 truncate">{stat.label}</p>
                {stat.trend && (
                  <span
                    className={`hidden sm:inline-flex items-center gap-1 text-xs font-medium flex-shrink-0 ${
                      stat.trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {stat.trend.direction === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {stat.trend.label}
                  </span>
                )}
              </div>
              <p className="col-span-2 sm:mt-1.5 flex flex-wrap items-baseline gap-x-1 sm:gap-x-1.5 min-w-0">
                <span data-sensitive className={`${valueSizeClass(stat.value)} font-bold text-slate-800 min-w-0 max-w-full [overflow-wrap:anywhere]`}>{stat.value}</span>
                {stat.unit && <span className="text-xs text-slate-400 flex-shrink-0">{stat.unit}</span>}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
