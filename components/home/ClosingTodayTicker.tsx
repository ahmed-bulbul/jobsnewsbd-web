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
    <div className="bg-red-50 border-b border-red-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 overflow-x-auto">
        <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide bg-red-600 text-white rounded-full px-2 py-0.5">
          <T bn="শেষ হচ্ছে" en="Ending Soon" />
        </span>
        <div className="flex items-center gap-4 overflow-x-auto text-red-700">
          {posts.map((p, i) => {
            const days = getDaysRemaining(p.applicationEnd);
            const title = p.titleBn || p.titleEn;
            return (
              <Link
                key={p.id}
                href={`/jobs/${p.slug}`}
                className="shrink-0 flex items-center gap-1.5 text-xs sm:text-sm font-medium hover:underline whitespace-nowrap"
              >
                {i > 0 && <span className="text-red-300">•</span>}
                <span className="max-w-[160px] sm:max-w-xs truncate">{title}</span>
                <span className="font-bold bg-red-100 rounded-full px-1.5 py-0.5 text-[10px]">
                  <T bn={days <= 0 ? 'আজই শেষ' : `${toBanglaDigits(days)} দিন বাকি`} en={days <= 0 ? 'ends today' : `${days}d left`} />
                </span>
              </Link>
            );
          })}
        </div>
        <Link href="/jobs?deadlineWithinDays=3" className="ml-auto shrink-0 text-xs sm:text-sm font-semibold text-red-700 hover:underline whitespace-nowrap">
          <T bn="সকল আপডেট দেখুন →" en="See all updates →" />
        </Link>
      </div>
    </div>
  );
}
