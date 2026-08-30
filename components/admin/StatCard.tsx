import type { ComponentType } from 'react';

type Color = 'primary' | 'blue' | 'emerald' | 'amber' | 'violet' | 'red';

const COLOR_MAP: Record<Color, { bg: string; text: string; iconBg: string }> = {
  primary: { bg: 'bg-primary-50 border-primary-100', text: 'text-primary-700', iconBg: 'bg-primary-100 text-primary-700' },
  blue:    { bg: 'bg-blue-50 border-blue-100',       text: 'text-blue-700',    iconBg: 'bg-blue-100 text-blue-700' },
  emerald: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', iconBg: 'bg-emerald-100 text-emerald-700' },
  amber:   { bg: 'bg-amber-50 border-amber-100',     text: 'text-amber-700',   iconBg: 'bg-amber-100 text-amber-700' },
  violet:  { bg: 'bg-violet-50 border-violet-100',   text: 'text-violet-700',  iconBg: 'bg-violet-100 text-violet-700' },
  red:     { bg: 'bg-red-50 border-red-100',         text: 'text-red-700',    iconBg: 'bg-red-100 text-red-700' },
};

type Props = {
  label: string;
  value: string | number;
  color?: Color;
  icon?: ComponentType<{ className?: string }>;
};

export default function StatCard({ label, value, color = 'primary', icon: Icon }: Props) {
  const c = COLOR_MAP[color];
  const displayValue = typeof value === 'number' ? value.toLocaleString('bn-BD') : value;
  return (
    <div className={`rounded-2xl border p-5 ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-warm-muted">{label}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{displayValue}</p>
    </div>
  );
}
