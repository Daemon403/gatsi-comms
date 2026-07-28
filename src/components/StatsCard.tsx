import { ArrowUp, ArrowDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
  color?: 'brand' | 'accent' | 'blue' | 'rose' | 'violet' | 'teal';
}

const colorMap = {
  brand: {
    icon: 'bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700',
    ring: 'ring-brand-50',
  },
  accent: {
    icon: 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-700',
    ring: 'ring-accent-50',
  },
  blue: {
    icon: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700',
    ring: 'ring-blue-50',
  },
  rose: {
    icon: 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700',
    ring: 'ring-rose-50',
  },
  violet: {
    icon: 'bg-gradient-to-br from-violet-100 to-violet-200 text-violet-700',
    ring: 'ring-violet-50',
  },
  teal: {
    icon: 'bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700',
    ring: 'ring-teal-50',
  },
};

export default function StatsCard({
  title,
  value,
  change,
  icon,
  trend,
  color = 'brand',
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className="card-hover group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-4 ${colors.icon} ${colors.ring} transition-transform duration-200 group-hover:scale-110`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-gray-900">{value}</p>
        <div className="mt-2 flex items-center gap-1.5">
          {trend === 'up' ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
              <ArrowUp size={12} className="text-emerald-600" />
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100">
              <ArrowDown size={12} className="text-rose-600" />
            </div>
          )}
          <span
            className={`text-sm font-semibold ${
              trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {change}%
          </span>
          <span className="text-sm text-gray-400">vs last period</span>
        </div>
      </div>
    </div>
  );
}
