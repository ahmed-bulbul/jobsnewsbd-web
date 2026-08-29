import Image from 'next/image';

/**
 * Shared phone-frame mockup showing the app dashboard screenshot — used by
 * both the hero's app-download panel and the lower AppDownloadBanner section.
 *
 * Design pass notes: the source screenshot has no reserved top margin for a
 * notch (the app's own header starts at y=0), so the bezel uses a tiny
 * punch-hole camera rather than a notch/pill — anything wider sits on real
 * text. Layered on top of that: a titanium-style bezel gradient with a
 * rim-light highlight, a soft diagonal screen glare, and a blurred ambient
 * contact shadow beneath the phone so it reads as sitting in the scene
 * rather than pasted flat onto the background — the layered-shadow +
 * highlight treatment real product marketing pages use for device mockups.
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
      className={`relative ${widthClass} shrink-0 ${stacked ? '-ml-12 rotate-6' : ''} ${dim ? 'opacity-40' : ''} ${className}`}
    >
      {/* Ambient contact shadow — grounds the phone instead of it looking pasted on */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[82%] h-5 bg-black/25 blur-lg rounded-full" />

      {/* Bezel — titanium-style gradient + rim-light edge */}
      <div className="relative aspect-[1/2.08] rounded-[2rem] bg-gradient-to-br from-gray-700 via-gray-900 to-black p-[3px] shadow-[0_30px_50px_-18px_rgba(15,23,32,0.5),0_10px_20px_-10px_rgba(15,23,32,0.3)] ring-1 ring-white/10">
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/25 via-transparent to-transparent opacity-60" />

        {/* Screen */}
        <div className="relative w-full h-full rounded-[1.75rem] overflow-hidden bg-black">
          <Image
            src="/app-screenshot-dashboard.png"
            alt="Job Radar app dashboard"
            fill
            className="object-cover object-top"
            sizes="176px"
          />
          {/* Soft diagonal glare */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.14] via-white/[0.02] to-transparent" />
          {/* Punch-hole camera — tiny, never overlaps real header text */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-black ring-[1.5px] ring-white/10 z-10" />
        </div>
      </div>

      {/* Side buttons, for realism */}
      <div className="absolute -left-[3px] top-[22%] w-[3px] h-6 rounded-l-sm bg-gradient-to-b from-gray-600 to-gray-800" />
      <div className="absolute -right-[3px] top-[18%] w-[3px] h-10 rounded-r-sm bg-gradient-to-b from-gray-600 to-gray-800" />
    </div>
  );
}
