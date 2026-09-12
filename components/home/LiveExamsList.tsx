import Link from 'next/link';
import T from '@/components/ui/T';
import ExamCountdown from '@/components/home/ExamCountdown';
import type { LiveExam, UpcomingExam } from '@/lib/types';

interface Props {
  exams: LiveExam[];
  upcoming: UpcomingExam[];
}

// List-style rendition of the live/upcoming exam feed for the two-column
// homepage row — same data and links as LiveExamsToday, just a compact
// vertical list instead of horizontal-scroll cards, capped at 5 rows.
export default function LiveExamsList({ exams, upcoming }: Props) {
  if (exams.length === 0 && upcoming.length === 0) return null;

  const liveRows = exams.slice(0, 5);
  const upcomingRows = upcoming.slice(0, Math.max(0, 5 - liveRows.length));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-ink flex items-center gap-1.5">
          <span className="text-red-500">●</span>
          <T bn="লাইভ ও আসন্ন পরীক্ষা" en="Live & Upcoming Exams" />
        </h2>
        <Link href="/prep" className="text-xs font-medium text-primary-600 shrink-0">
          <T bn="সব দেখুন →" en="View all →" />
        </Link>
      </div>

      <div className="divide-y divide-warm-border/70">
        {liveRows.map((exam) => {
          const href = `/prep/exam/${exam.id}?title=${encodeURIComponent(exam.titleBn)}&duration=${exam.durationMinutes}&slug=${exam.topicSlug}`;

          return (
            <div key={`live-${exam.id}`} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                    </span>
                    <T bn="লাইভ" en="Live" />
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink truncate">{exam.titleBn}</p>
                <p className="text-xs text-warm-muted truncate">{exam.topicNameBn}</p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-red-600 bg-red-50 rounded-full px-2 py-1 whitespace-nowrap">
                  <ExamCountdown endsAt={exam.endsAt} /> <T bn="বাকি" en="left" />
                </span>
                <Link href={href} className="text-xs font-medium text-primary-600 whitespace-nowrap">
                  <T bn="অংশ নিন →" en="Take exam →" />
                </Link>
              </div>
            </div>
          );
        })}

        {upcomingRows.map((exam) => {
          const scheduled = new Date(exam.scheduledAt);
          const dateBn = scheduled.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
          const timeBn = scheduled.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' });
          const dateEn = scheduled.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          const timeEn = scheduled.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

          const href = exam.topicSlug
            ? `/prep/topics/${exam.topicSlug}/exam`
            : `/prep/${exam.categorySlug}`;

          return (
            <div key={`upcoming-${exam.id}`} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    <T bn="আসছে" en="Upcoming" />
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink truncate">{exam.titleBn}</p>
                <p className="text-xs text-warm-muted truncate">{exam.topicNameBn ?? exam.categoryNameBn}</p>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-full px-2 py-1 whitespace-nowrap">
                  <T bn={`${dateBn}, ${timeBn}`} en={`${dateEn}, ${timeEn}`} />
                </span>
                <Link href={href} className="text-xs font-medium text-primary-600 whitespace-nowrap">
                  <T bn="বিস্তারিত →" en="Details →" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
