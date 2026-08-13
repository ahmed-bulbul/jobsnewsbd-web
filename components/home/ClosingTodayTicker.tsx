import Link from 'next/link';
import T from '@/components/ui/T';
import type { PostSummary } from '@/lib/types';
import { getDaysRemaining, toBanglaDigits } from '@/lib/utils';

interface Props {
  posts: PostSummary[];
}

// Thin urgency strip at the very top of the homepage — jobs whose deadline
// is imminent, first thing a first-time visitor sees. Deliberately a static
// horizontal scroll row (not a marquee — marquees were removed from this
// homepage before, see UrgencyTicker history) so it stays readable and
// doesn't feel gimmicky.
export default function ClosingTodayTicker({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <div className="bg-red-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 overflow-x-auto">
        <span className="shrink-0 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <T bn="শেষ হচ্ছে শীঘ্রই" en="Closing soon" />
        </span>
        <div className="flex items-center gap-4 overflow-x-auto">
          {posts.map((p, i) => {
            const days = getDaysRemaining(p.applicationEnd);
            const title = p.titleBn || p.titleEn;
            return (
              <Link
                key={p.id}
                href={`/jobs/${p.slug}`}
                className="shrink-0 flex items-center gap-1.5 text-xs sm:text-sm hover:underline whitespace-nowrap"
              >
                {i > 0 && <span className="text-red-300">•</span>}
                <span className="max-w-[160px] sm:max-w-xs truncate">{title}</span>
                <span className="font-bold bg-white/20 rounded-full px-1.5 py-0.5 text-[10px]">
                  <T bn={days <= 0 ? 'আজই শেষ' : `${toBanglaDigits(days)} দিন বাকি`} en={days <= 0 ? 'ends today' : `${days}d left`} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
