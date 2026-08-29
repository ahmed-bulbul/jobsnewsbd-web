import Image from 'next/image';

/**
 * Shared phone-frame mockup showing the app dashboard screenshot — used by
 * both the hero's app-download panel and the lower AppDownloadBanner section.
 *
 * Design notes: the source screenshot has no reserved top margin for a
 * notch/status bar (the app's own header starts at y=0), so an overlaid
 * notch/pill would sit directly on top of real text ("হ্যালো, Bulbul" etc.)
 * and cut it off — that's what made the previous version look broken. This
 * version drops the notch entirely in favour of a slim, punch-hole-camera
 * bezel (like a modern Android flagship), which reads as "a phone" without
 * ever overlapping content, plus side buttons and a soft ambient shadow for
 * a more premium, realistic feel.
 *
 * `stacked` offsets + rotates the phone behind the primary one; `dim` fades
 * it. `size="lg"` is the hero's bigger, more prominent pair of phones.
 */
export default function PhoneMockup({
  stacked = false,
  dim = false,
  size = 'sm',
  className = '',
}: {
  stacked?: boolean;
  dim?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
}) {
  const widthClass = size === 'lg' ? 'w-36 sm:w-44' : 'w-28 sm:w-32';
  return (
    <div
      className={`relative ${widthClass} shrink-0 ${stacked ? '-ml-12 rotate-6' : ''} ${dim ? 'opacity-45' : ''} ${className}`}
    >
      {/* Frame */}
      <div className="relative aspect-[1/2.08] rounded-[2rem] bg-gradient-to-b from-gray-800 to-gray-950 p-[3px] shadow-[0_20px_45px_-15px_rgba(16,24,32,0.35)]">
        {/* Screen */}
        <div className="relative w-full h-full rounded-[1.75rem] overflow-hidden bg-black">
          <Image
            src="/app-screenshot-dashboard.png"
            alt="Job Radar app dashboard"
            fill
            className="object-cover object-top"
            sizes="176px"
          />
          {/* Punch-hole camera — tiny, doesn't overlap real header text */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-black/70 ring-1 ring-white/10 z-10" />
        </div>

        {/* Side buttons, for realism */}
        <div className="absolute -left-[3px] top-[22%] w-[3px] h-6 rounded-l-sm bg-gray-700" />
        <div className="absolute -right-[3px] top-[18%] w-[3px] h-10 rounded-r-sm bg-gray-700" />
      </div>
    </div>
  );
}
