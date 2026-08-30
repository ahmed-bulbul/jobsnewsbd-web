import type { ReactNode } from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'violet';

const TONE_MAP: Record<Tone, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-600',
  neutral: 'bg-gray-100 text-gray-600',
  info:    'bg-blue-100 text-blue-700',
  violet:  'bg-violet-100 text-violet-700',
};

type Props = {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
};

export default function Badge({ tone = 'neutral', dot = false, children }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${TONE_MAP[tone]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      {children}
    </span>
  );
}
