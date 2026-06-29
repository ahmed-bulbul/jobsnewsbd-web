'use client';

import { useLanguage } from '@/context/LanguageContext';
import { getDaysRemaining, getDeadlineProgress, toBanglaDigits } from '@/lib/utils';

interface Props {
  applicationStart: string | null;
  applicationEnd: string | null;
  status: string;
}

export default function DeadlineBar({ applicationStart, applicationEnd, status }: Props) {
  const { lang } = useLanguage();
  const progress = getDeadlineProgress(applicationStart, applicationEnd);
  const days = getDaysRemaining(applicationEnd);
  const isEndingSoon = days > 0 && days <= 3;
  const isClosed = status === 'CLOSED' || status === 'EXPIRED' || days <= 0;

  if (!applicationEnd) return null;

  const barColor = isClosed
    ? 'bg-gray-300'
    : isEndingSoon
    ? 'bg-red-500'
    : 'bg-accent';

  const daysText = isClosed
    ? (lang === 'bn' ? 'সময় শেষ' : 'Deadline passed')
    : isEndingSoon
    ? (lang === 'bn' ? `মাত্র ${toBanglaDigits(days)} দিন বাকি!` : `Only ${days} days left!`)
    : (lang === 'bn' ? `${toBanglaDigits(days)} দিন বাকি` : `${days} days left`);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-medium ${isEndingSoon && !isClosed ? 'text-red-600 animate-pulse' : 'text-warm-muted'}`}>
          {daysText}
        </span>
        <span className="text-xs text-warm-muted">{progress}%</span>
      </div>
      <div className="h-1.5 bg-cream-dark rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}
