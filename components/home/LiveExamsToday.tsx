import Link from 'next/link';
import T from '@/components/ui/T';
import type { LiveExam } from '@/lib/types';
import { getMinutesRemaining, toBanglaDigits } from '@/lib/utils';

interface Props {
  exams: LiveExam[];
}

// Site-wide "today's live exam" strip — every currently-live exam across all
// categories, one click straight into the exam-taking flow. Mirrors the
// FeaturedJobsRow horizontal-scroll layout and the CurriculumCard's red
// pulse "LIVE" styling used elsewhere for live exams.
export default function LiveExamsToday({ exams }: Props) {
  if (exams.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">
          <span className="text-red-500">●</span>
          <T bn="আজকের লাইভ পরীক্ষা" en="Today's Live Exam" />
        </h2>
        <span className="text-xs text-warm-muted">
          <T bn={`${toBanglaDigits(exams.length)}টি চলছে`} en={`${exams.length} running`} />
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
        {exams.map((exam) => {
          const minutesLeft = getMinutesRemaining(exam.endsAt);
          const href = `/prep/exam/${exam.id}?title=${encodeURIComponent(exam.titleBn)}&duration=${exam.durationMinutes}&slug=${exam.topicSlug}`;

          return (
            <Link
              key={exam.id}
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
      </div>
    </section>
  );
}
