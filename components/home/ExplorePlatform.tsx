import Link from 'next/link';
import T from '@/components/ui/T';

const TILES = [
  {
    href: '/prep',
    emoji: '📚',
    bn: 'পরীক্ষার প্রস্তুতি',
    en: 'Exam Prep',
    descBn: 'ভিডিও, নোট ও লাইভ পরীক্ষা',
    descEn: 'Videos, notes, live exams',
    accent: 'bg-violet-50 text-violet-700',
  },
  {
    href: '/study-corner/question-bank',
    emoji: '📝',
    bn: 'প্রশ্ন ব্যাংক',
    en: 'Question Bank',
    descBn: 'বিষয়ভিত্তিক MCQ অনুশীলন',
    descEn: 'Subject-wise MCQ practice',
    accent: 'bg-primary-50 text-primary-700',
  },
  {
    href: '/tools',
    emoji: '🛠️',
    bn: 'টুলস',
    en: 'Tools',
    descBn: 'ছবি-PDF কনভার্টার, ক্যালকুলেটর',
    descEn: 'Image-PDF converters, calculators',
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    href: '/study-corner/job-experience',
    emoji: '💬',
    bn: 'চাকরির অভিজ্ঞতা',
    en: 'Job Experience',
    descBn: 'প্রকৃত প্রার্থীদের অভিজ্ঞতা',
    descEn: 'Real candidates share their story',
    accent: 'bg-blue-50 text-blue-700',
  },
  {
    href: '/study-corner/book-marketplace',
    emoji: '📖',
    bn: 'বই মার্কেটপ্লেস',
    en: 'Book Marketplace',
    descBn: 'পুরনো বই কেনাবেচা',
    descEn: 'Buy and sell used books',
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    href: '/exam-centers',
    emoji: '📍',
    bn: 'পরীক্ষা কেন্দ্র',
    en: 'Exam Centers',
    descBn: 'কেন্দ্র খুঁজুন ও টিপস দেখুন',
    descEn: 'Find centers and read tips',
    accent: 'bg-rose-50 text-rose-700',
  },
];

// Cross-sell grid — most first-time visitors only see the job board; this
// makes the rest of the platform (prep, question bank, tools, community
// content, marketplace) discoverable in one scan instead of staying buried
// in a single sidebar card. Trimmed to icon + single label (no description
// line) so the whole row reads at a glance, matching the leaner spacing
// used across the rest of the redesigned homepage.
export default function ExplorePlatform() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="section-title mb-5">
        <span className="text-primary">▍</span>
        <T bn="একসেস টুলস ও রিসোর্স" en="Explore Tools & Resources" />
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="card p-4 flex flex-col items-start text-left gap-2.5"
          >
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${tile.accent}`}>
              {tile.emoji}
            </span>
            <span>
              <p className="text-sm font-semibold text-ink leading-tight mb-0.5">
                <T bn={tile.bn} en={tile.en} />
              </p>
              <p className="text-xs text-ink-soft leading-snug">
                <T bn={tile.descBn} en={tile.descEn} />
              </p>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
