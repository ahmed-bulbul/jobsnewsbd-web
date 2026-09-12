import Link from 'next/link';
import T from '@/components/ui/T';
import { getDaysRemaining, toBanglaDigits, formatBanglaDate, formatEnDate } from '@/lib/utils';
import type { PostSummary } from '@/lib/types';
import type { TodaySummary } from './HeroSearch';

interface Props {
  summary: TodaySummary;
  latestList: PostSummary[];
}

// Server component — no client interactivity needed, just presents the
// numbers/rows passed in by the page. Rendered inside HeroSearch's right
// column in place of the old app-download promo panel.
export default function TodaySummaryCard({ summary, latestList }: Props) {
  const today = new Date().toISOString();

  return (
    <div className="bg-white rounded-2xl border border-warm-border shadow-card p-5 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-ink">
          <T bn="আজকের সারসংক্ষেপ" en="Today's Summary" />
        </h2>
        <span className="text-xs text-warm-muted">
          <T bn={formatBanglaDate(today)} en={formatEnDate(today)} />
        </span>
      </div>

      <div className="grid grid-cols-2 border border-warm-border rounded-xl divide-x divide-y divide-warm-border overflow-hidden">
        <div className="p-3.5">
          <p className="text-2xl font-bold text-primary">
            <T bn={toBanglaDigits(summary.newToday)} en={String(summary.newToday)} />
          </p>
          <p className="text-xs text-warm-muted mt-0.5">
            <T bn="নতুন বিজ্ঞপ্তি" en="New today" />
          </p>
        </div>
        <div className="p-3.5">
          <p className="text-2xl font-bold text-accent-dark">
            <T bn={toBanglaDigits(summary.closingToday)} en={String(summary.closingToday)} />
          </p>
          <p className="text-xs text-warm-muted mt-0.5">
            <T bn="আজ শেষ প্রাপ্তি" en="Closing today" />
          </p>
        </div>
        <div className="p-3.5">
          <p className="text-2xl font-bold text-primary">
            <T bn={toBanglaDigits(summary.active)} en={String(summary.active)} />
          </p>
          <p className="text-xs text-warm-muted mt-0.5">
            <T bn="সক্রিয় বিজ্ঞপ্তি" en="Active listings" />
          </p>
        </div>
        <div className="p-3.5">
          <p className="text-2xl font-bold text-ink">
            <T bn={toBanglaDigits(summary.liveExamCount)} en={String(summary.liveExamCount)} />
          </p>
          <p className="text-xs text-warm-muted mt-0.5">
            <T bn="চলমান পরীক্ষা" en="Live exams" />
          </p>
        </div>
      </div>

      {latestList.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-warm-muted mb-2">
            <T bn="আজকের নতুন বিজ্ঞপ্তি" en="New today" />
          </p>
          <div className="space-y-2.5">
            {latestList.slice(0, 3).map((post) => {
              const days = getDaysRemaining(post.applicationEnd);
              // Only show a "days left" caption when the deadline is a real,
              // still-upcoming date. `getDaysRemaining` can return 0 or a
              // negative number for a listing whose application window has
              // already closed (or oddly-seeded test data with a past end
              // date) — clamping that to 0 would have falsely read as
              // "0 days left" instead of just not showing a stale deadline.
              const hasDeadline = post.applicationEnd && Number.isFinite(days) && days > 0;
              return (
                <Link
                  key={post.id}
                  href={`/jobs/${post.slug}`}
                  className="flex items-start gap-2.5 group"
                >
                  <span className="w-7 h-7 shrink-0 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs mt-0.5">
                    📄
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-ink truncate group-hover:text-primary transition-colors">
                      {post.titleBn || post.titleEn}
                    </span>
                    {hasDeadline && (
                      <span className="block text-[10px] text-warm-muted mt-0.5">
                        <T bn={`${toBanglaDigits(days)} দিন বাকি`} en={`${days}d left`} />
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Link href="/jobs" className="block mt-4 text-xs font-semibold text-primary-600 hover:text-primary">
        <T bn="সব বিজ্ঞপ্তি দেখুন →" en="View all →" />
      </Link>
    </div>
  );
}
