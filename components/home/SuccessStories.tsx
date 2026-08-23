import Link from 'next/link';
import T from '@/components/ui/T';
import type { JobExperience } from '@/lib/types';

interface Props {
  experiences: JobExperience[];
}

// Real, moderated Job Experience Share submissions from selected candidates
// — genuine social proof pulled from content that already exists, not
// fabricated testimonials.
const ICONS = ['💻', '🏆'];

export default function SuccessStories({ experiences }: Props) {
  if (experiences.length === 0) return null;
  const featured = experiences.slice(0, 2);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {featured.map((exp, i) => (
          <Link
            key={exp.id}
            href={`/study-corner/job-experience/${exp.id}`}
            className="card relative overflow-hidden p-6 flex items-start gap-4"
          >
            {/* Subtle decorative quote mark — editorial feel without a stock illustration */}
            <svg className="pointer-events-none absolute -top-2 -right-2 w-16 h-16 text-primary-50" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
              <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
            </svg>
            <span className="w-12 h-12 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center text-xl relative">
              {ICONS[i % ICONS.length]}
            </span>
            <div className="min-w-0 relative">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 mb-2">
                ✓ <T bn="নির্বাচিত" en="Selected" />
              </span>
              <p className="text-base font-semibold text-ink line-clamp-2 leading-snug mb-1.5">
                {exp.title}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
                {exp.body}
              </p>
              <p className="text-xs text-ink-soft truncate">
                {exp.isAnonymous ? <T bn="বেনামী প্রার্থী" en="Anonymous candidate" /> : exp.authorName} · {exp.organizationName}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
