import Link from 'next/link';
import T from '@/components/ui/T';
import type { LiveExam, UpcomingExam } from '@/lib/types';
import { getMinutesRemaining, toBanglaDigits } from '@/lib/utils';

interface Props {
  exams: LiveExam[];
  upcoming: UpcomingExam[];
}

// Site-wide "live + upcoming exam" strip — every currently-live exam across
// all categories linking straight into the exam-taking flow, followed by
// what's coming up next from the routine so the section still has content
// (and gives people a reason to come back) when nothing is live right now.
export default function LiveExamsToday({ exams, upcoming }: Props) {
  if (exams.length === 0 && upcoming.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">
          <span className="text-red-500">●</span>
          <T bn="লাইভ ও আসন্ন পরীক্ষা" en="Live & Upcoming Exams" />
        </h2>
        <span className="text-xs text-warm-muted">
          {exams.length > 0 && <T bn={`${toBanglaDigits(exams.length)}টি চলছে`} en={`${exams.length} live`} />}
          {exams.length > 0 && upcoming.length > 0 && ' · '}
          {upcoming.length > 0 && <T bn={`${toBanglaDigits(upcoming.length)}টি আসছে`} en={`${upcoming.length} upcoming`} />}
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
        {exams.map((exam) => {
          const minutesLeft = getMinutesRemaining(exam.endsAt);
          const href = `/prep/exam/${exam.id}?title=${encodeURIComponent(exam.titleBn)}&duration=${exam.durationMinutes}&slug=${exam.topicSlug}`;

          return (
            <Link
              key={`live-${exam.id}`}
              href={href}
              className="card p-4 shrink-0 w-72 snap-start border-l-4 hover:shadow-md transition-shadow"
              style={{ borderLeftColor: exam.categoryColorHex ?? '#ef4444' }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
                  <T bn="লাইভ" en="Live" />
                </span>
                <span className="text-[10px] text-warm-muted ml-auto truncate max-w-[110px]">
                  {exam.categoryNameBn}
                </span>
              </div>

              <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                {exam.titleBn}
              </p>
              <p className="text-xs text-warm-muted truncate mb-3">{exam.topicNameBn}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-600 bg-red-50 rounded-full px-2 py-1 whitespace-nowrap">
                  <T bn={`${toBanglaDigits(minutesLeft)} মিনিট বাকি`} en={`${minutesLeft}m left`} />
                </span>
                <span className="text-xs font-medium text-primary-600">
                  <T bn="পরীক্ষা দিন →" en="Take Exam →" />
                </span>
              </div>
            </Link>
          );
        })}

        {upcoming.map((exam) => {
          const scheduled = new Date(exam.scheduledAt);
          const dateBn = scheduled.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
          const timeBn = scheduled.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' });
          const dateEn = scheduled.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          const timeEn = scheduled.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

          const href = exam.topicSlug
            ? `/prep/topics/${exam.topicSlug}/exam`
            : `/prep/${exam.categorySlug}`;

          return (
            <Link
              key={`upcoming-${exam.id}`}
              href={href}
              className="card p-4 shrink-0 w-72 snap-start border-l-4 hover:shadow-md transition-shadow"
              style={{ borderLeftColor: exam.categoryColorHex ?? '#3378dd' }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                  <T bn="আসছে" en="Upcoming" />
                </span>
                <span className="text-[10px] text-warm-muted ml-auto truncate max-w-[110px]">
                  {exam.categoryNameBn}
                </span>
              </div>

              <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                {exam.titleBn}
              </p>
              <p className="text-xs text-warm-muted truncate mb-3">{exam.topicNameBn ?? exam.categoryNameBn}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-full px-2 py-1 whitespace-nowrap">
                  <T bn={`${dateBn}, ${timeBn}`} en={`${dateEn}, ${timeEn}`} />
                </span>
                <span className="text-xs font-medium text-primary-600">
                  <T bn="বিস্তারিত →" en="Details →" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
