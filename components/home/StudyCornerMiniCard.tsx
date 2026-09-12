import Link from 'next/link';
import T from '@/components/ui/T';

const TILES = [
  {
    href: '/study-corner/question-bank',
    icon: '📝',
    badge: 'bg-primary-50 text-primary-700',
    bn: 'প্রশ্ন ব্যাংক',
    en: 'Question Bank',
  },
  {
    href: '/prep',
    icon: '📄',
    badge: 'bg-amber-50 text-amber-700',
    bn: 'মডেল টেস্ট',
    en: 'Model Tests',
  },
  {
    href: '/study-corner',
    icon: '📋',
    badge: 'bg-violet-50 text-violet-700',
    bn: 'সংক্ষিপ্ত নোট',
    en: 'Short Notes',
  },
  {
    href: '/study-corner/job-experience',
    icon: '💬',
    badge: 'bg-blue-50 text-blue-700',
    bn: 'ভাইবা অভিজ্ঞতা',
    en: 'Interview Experience',
  },
] as const;

// Small static tile card promoting the Study Corner section — pairs with
// LiveExamsList in the homepage's two-column exam/study row.
export default function StudyCornerMiniCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-ink">
          <T bn="প্রস্তুতি ও স্টাডি কর্নার" en="Prep & Study Corner" />
        </h2>
        <Link href="/study-corner" className="text-xs font-medium text-primary-600 shrink-0">
          <T bn="চেক করুন →" en="Check it out →" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TILES.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="flex flex-col items-start gap-2 p-3 rounded-xl border border-warm-border hover:border-primary-300 transition-colors"
          >
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-base ${tile.badge}`}>
              {tile.icon}
            </span>
            <span className="text-xs font-semibold text-ink">
              <T bn={tile.bn} en={tile.en} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
