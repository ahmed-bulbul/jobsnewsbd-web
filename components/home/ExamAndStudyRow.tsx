import type { LiveExam, UpcomingExam } from '@/lib/types';
import LiveExamsList from '@/components/home/LiveExamsList';
import StudyCornerMiniCard from '@/components/home/StudyCornerMiniCard';

interface Props {
  exams: LiveExam[];
  upcoming: UpcomingExam[];
}

// Two-column homepage row pairing the live/upcoming exam list with a
// Study Corner promo tile. Falls back to a single-column layout with just
// the study corner card when there's no exam data to show.
export default function ExamAndStudyRow({ exams, upcoming }: Props) {
  const hasExams = exams.length > 0 || upcoming.length > 0;

  if (!hasExams) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          <StudyCornerMiniCard />
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveExamsList exams={exams} upcoming={upcoming} />
        <StudyCornerMiniCard />
      </div>
    </section>
  );
}
