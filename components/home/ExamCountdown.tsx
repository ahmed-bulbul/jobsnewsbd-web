'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { toBanglaDigits } from '@/lib/utils';

interface Props {
  endsAt: string;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Live-ticking H:MM:SS (or MM:SS once under an hour) countdown to the exam's
// end time — a client island inside an otherwise server-rendered card, since
// a per-second countdown can't be computed once at request time like the
// rest of the homepage.
export default function ExamCountdown({ endsAt }: Props) {
  const { lang } = useLanguage();
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));

  useEffect(() => {
    const tick = () => setRemainingMs(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const digits = hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return <span>{lang === 'bn' ? toBanglaDigits(digits) : digits}</span>;
}
