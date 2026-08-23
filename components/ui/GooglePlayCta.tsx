'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

// Single reusable "Google Play" touchpoint — used in the hero strip and the
// homepage app-promo banner. The app is submitted but not live yet, so every
// instance opens the same Coming Soon modal instead of a dead store link.
interface Props {
  compact?: boolean;
  className?: string;
}

export default function GooglePlayCta({ compact = false, className = '' }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <GooglePlayBadge compact={compact} />
      </button>
      <ComingSoonModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function GooglePlayBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg bg-black text-white hover:bg-gray-900 transition-colors ${
        compact ? 'gap-2 px-2.5 py-1.5' : 'gap-2.5 px-4 py-2'
      }`}
    >
      <svg className={compact ? 'w-4 h-4 shrink-0' : 'w-6 h-6 shrink-0'} viewBox="0 0 512 512" aria-hidden="true">
        <path d="M99 20c-6 5-9 13-9 23v426c0 10 3 18 9 23l2 2 239-239v-5L101 18l-2 2z" fill="#00d2ff" />
        <path d="M340 296l-80-80v-5l80-80 2 1 95 54c27 15 27 40 0 55l-95 54-2 1z" fill="#ffbc00" />
        <path d="M342 295L260 213 99 374c6 6 15 7 26 1l217-80z" fill="#ff3a44" />
        <path d="M342 131L125 8c-11-6-20-5-26 1l217 161z" fill="#00d449" />
      </svg>
      <span className="flex flex-col leading-tight text-left">
        {!compact && <span className="text-[9px] uppercase tracking-wide text-gray-300">Get it on</span>}
        <span className={compact ? 'text-xs font-medium' : 'text-base font-medium -mt-0.5'} style={{ fontFamily: 'sans-serif' }}>
          Google Play
        </span>
      </span>
    </span>
  );
}

export function ComingSoonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-overlay-fade"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7 text-center animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center text-3xl">
          🚀
        </div>
        <h3 className="text-lg font-bold text-ink mb-2">
          {t('Job Radar — খুব শীঘ্রই আসছে', 'Job Radar — Coming Soon')}
        </h3>
        <p className="text-sm text-ink-soft leading-relaxed mb-6">
          {t(
            'আমাদের Job Radar অ্যান্ড্রয়েড অ্যাপটি খুব শীঘ্রই Google Play Store-এ উপলব্ধ হবে।',
            'Our Job Radar Android app will be available on the Google Play Store very soon.'
          )}
        </p>
        <button type="button" onClick={onClose} className="btn-primary justify-center w-full py-2.5">
          {t('ঠিক আছে', 'Got it')}
        </button>
      </div>
    </div>
  );
}
