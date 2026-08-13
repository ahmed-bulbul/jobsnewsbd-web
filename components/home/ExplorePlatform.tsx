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
// in a single sidebar card.
export default function ExplorePlatform() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-5">
        <h2 className="section-title">
          <span className="text-primary">▍</span>
          <T bn="শুধু চাকরি নয়, আরও অনেক কিছু" en="Beyond job circulars" />
        </h2>
        <p className="text-sm text-warm-muted mt-1">
          <T bn="প্রস্তুতি থেকে শুরু করে অভিজ্ঞতা শেয়ার — সবকিছু এক জায়গায়" en="From exam prep to shared experience — all in one place" />
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="card p-4 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow"
          >
            <span className={`w-11 h-11 rounded-full flex items-center justify-center text-lg ${tile.accent}`}>
              {tile.emoji}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">
                <T bn={tile.bn} en={tile.en} />
              </p>
              <p className="text-[11px] text-warm-muted mt-0.5 leading-snug">
                <T bn={tile.descBn} en={tile.descEn} />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
