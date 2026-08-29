'use client';

// Single reusable "Google Play" touchpoint — used in the hero strip and the
// homepage app-promo banner. The app is now live on the Play Store, so every
// instance links straight to the real store listing.
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.jobradarbd.mobile';

interface Props {
  compact?: boolean;
  className?: string;
}

export default function GooglePlayCta({ compact = false, className = '' }: Props) {
  return (
    <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className={className}>
      <GooglePlayBadge compact={compact} />
    </a>
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
