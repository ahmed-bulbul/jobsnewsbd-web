import Link from 'next/link';
import T from '@/components/ui/T';

const TOOLS = [
  {
    href: '/tools/image-resizer',
    emoji: '🖼️',
    bn: 'ছবি ও স্বাক্ষর রিসাইজার',
    en: 'Photo & Signature Resizer',
    descBn: 'সঠিক সাইজে ছবি তৈরি করুন',
    descEn: 'Resize to the exact required size',
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    href: '/tools/age-calculator',
    emoji: '🎂',
    bn: 'বয়স ক্যালকুলেটর',
    en: 'Age Calculator',
    descBn: 'আবেদনের বয়স নির্ভুলভাবে গণনা করুন',
    descEn: 'Calculate your exact age for applications',
    accent: 'bg-rose-50 text-rose-700',
  },
  {
    href: '/tools/image-to-pdf',
    emoji: '📄',
    bn: 'ছবি থেকে PDF',
    en: 'Image to PDF',
    descBn: 'একাধিক ছবি PDF-এ রূপান্তর করুন',
    descEn: 'Convert multiple images into one PDF',
    accent: 'bg-blue-50 text-blue-700',
  },
  {
    href: '/tools/info-store',
    emoji: '🗂️',
    bn: 'আবেদন তথ্য সংরক্ষণ',
    en: 'Save Application Info',
    descBn: 'আপনার তথ্য সংরক্ষণ করে দ্রুত ফর্ম পূরণ করুন',
    descEn: 'Save your details once, reuse on every form',
    accent: 'bg-violet-50 text-violet-700',
  },
];

export default function ToolsShortcuts() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="section-title mb-5">
        <span className="text-primary">▍</span>
        <T bn="আবেদনের কাজ সহজ করার টুলস" en="Tools to make applying easier" />
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="card p-4 flex flex-col items-start gap-2.5">
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${tool.accent}`}>
              {tool.emoji}
            </span>
            <span>
              <p className="text-sm font-semibold text-ink leading-tight mb-0.5">
                <T bn={tool.bn} en={tool.en} />
              </p>
              <p className="text-xs text-ink-soft leading-snug">
                <T bn={tool.descBn} en={tool.descEn} />
              </p>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
