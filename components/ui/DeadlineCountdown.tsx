'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { toBanglaDigits } from '@/lib/utils';

interface Props {
  endDate: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function DeadlineCountdown({ endDate }: Props) {
  const { lang, t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    function calc() {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft({
        days:    Math.floor(diff / 86_400_000),
        hours:   Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1000),
      });
    }
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (!timeLeft) {
    return (
      <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm font-medium">
        🚫 {t('আবেদনের সময় শেষ হয়ে গেছে', 'Application deadline has passed')}
      </div>
    );
  }

  const units = [
    { value: timeLeft.days,    label: t('দিন', 'Days') },
    { value: timeLeft.hours,   label: t('ঘণ্টা', 'Hrs') },
    { value: timeLeft.minutes, label: t('মিনিট', 'Min') },
    { value: timeLeft.seconds, label: t('সেকেন্ড', 'Sec') },
  ];

  const isUrgent = timeLeft.days <= 3;

  return (
    <div className={`rounded-2xl p-4 border ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-cream border-warm-border'}`}>
      <p className={`text-xs font-semibold mb-3 ${isUrgent ? 'text-red-700' : 'text-gray-600'}`}>
        {isUrgent && <span className="animate-pulse mr-1">⚡</span>}
        {t('আবেদনের বাকি সময়', 'Time Remaining to Apply')}
      </p>
      <div className="flex gap-3">
        {units.map((u) => (
          <div key={u.label} className="flex-1 text-center">
            <div className={`text-2xl font-bold tabular-nums ${isUrgent ? 'text-red-700' : 'text-primary'}`}>
              {lang === 'bn' ? toBanglaDigits(u.value) : String(u.value).padStart(2, '0')}
            </div>
            <div className="text-xs text-warm-muted mt-0.5">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
