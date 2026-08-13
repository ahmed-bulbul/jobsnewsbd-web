import Link from 'next/link';
import T from '@/components/ui/T';
import type { JobExperience } from '@/lib/types';

interface Props {
  experiences: JobExperience[];
}

// Real, moderated Job Experience Share submissions from selected candidates
// — genuine social proof pulled from content that already exists, not
// fabricated testimonials.
export default function SuccessStories({ experiences }: Props) {
  if (experiences.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">
          <span className="text-emerald-500">▍</span>
          <T bn="তাদের গল্প থেকে অনুপ্রেরণা নিন" en="Real stories from selected candidates" />
        </h2>
        <Link href="/study-corner/job-experience" className="text-sm text-primary-600 hover:text-primary font-medium hover:underline">
          <T bn="সব দেখুন →" en="View All →" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {experiences.map((exp) => (
          <Link
            key={exp.id}
            href={`/study-corner/job-experience/${exp.id}`}
            className="card p-4 hover:shadow-md transition-shadow flex flex-col"
          >
            <span className="inline-flex items-center gap-1 self-start text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 mb-2">
              ✓ <T bn="নির্বাচিত" en="Selected" />
            </span>
            <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
              {exp.title}
            </p>
            <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-3 flex-1">
              {exp.body}
            </p>
            <p className="text-xs text-warm-muted mt-auto truncate">
              {exp.isAnonymous ? <T bn="বেনামী প্রার্থী" en="Anonymous candidate" /> : exp.authorName} · {exp.organizationName}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
