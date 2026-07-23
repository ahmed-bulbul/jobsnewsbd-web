'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

interface HubTile {
  href: string;
  icon: string;
  color: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  comingSoon?: boolean;
}

const TILES: HubTile[] = [
  {
    href: '/prep',
    icon: '📘',
    color: '#1D4ED8',
    titleBn: 'চাকরির প্রস্তুতি',
    titleEn: 'Job Preparation',
    descBn: 'ক্যাটাগরি অনুযায়ী পড়াশোনা, মডেল টেস্ট ও পরীক্ষা',
    descEn: 'Category-wise study material, model tests and exams',
  },
  {
    href: '/study-corner/job-experience',
    icon: '💬',
    color: '#0F766E',
    titleBn: 'চাকরির অভিজ্ঞতা শেয়ার করুন',
    titleEn: 'Share Job Experience',
    descBn: 'আপনার আবেদন ও ইন্টারভিউ অভিজ্ঞতা অন্যদের সাথে শেয়ার করুন',
    descEn: 'Share your application and interview journey with others',
  },
  {
    href: '/study-corner/recommended-books',
    icon: '📚',
    color: '#7C3AED',
    titleBn: 'প্রস্তাবিত বই',
    titleEn: 'Recommended Books',
    descBn: 'প্রস্তুতির জন্য সেরা বইয়ের তালিকা',
    descEn: 'Curated list of the best books for exam prep',
  },
  {
    href: '/study-corner/book-marketplace',
    icon: '📦',
    color: '#BE185D',
    titleBn: 'পুরাতন বই কেনাবেচা',
    titleEn: 'Old Book Buy/Sell',
    descBn: 'পুরাতন প্রস্তুতির বই কিনুন বা বিক্রি করুন',
    descEn: 'Buy or sell used preparation books',
  },
  {
    href: '/study-corner/institute-reviews',
    icon: '🏫',
    color: '#0369A1',
    titleBn: 'ইনস্টিটিউট রিভিউ',
    titleEn: 'Institute Reviews',
    descBn: 'কোচিং সেন্টার ও ইনস্টিটিউট সম্পর্কে রিভিউ পড়ুন ও লিখুন',
    descEn: 'Read and write reviews of coaching centers and institutes',
  },
];

function Tile({ tile }: { tile: HubTile }) {
  const { t } = useLanguage();
  return (
    <Link
      href={tile.href}
      className="group bg-white rounded-2xl border border-warm-border hover:border-primary hover:shadow-lg transition-all overflow-hidden flex flex-col relative"
    >
      {tile.comingSoon && (
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {t('শীঘ্রই আসছে', 'Coming soon')}
          </span>
        </div>
      )}
      <div
        className="h-24 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${tile.color}22 0%, ${tile.color}44 100%)` }}
      >
        <span className="text-4xl select-none">{tile.icon}</span>
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-bold text-base leading-snug text-gray-900 group-hover:text-primary transition-colors">
          {t(tile.titleBn, tile.titleEn)}
        </h3>
        <p className="text-xs text-warm-muted leading-relaxed">{t(tile.descBn, tile.descEn)}</p>
        <div className="mt-auto pt-3 flex items-center gap-1 text-xs font-medium" style={{ color: tile.color }}>
          {tile.comingSoon ? t('বিস্তারিত দেখুন', 'Learn more') : t('শুরু করুন', 'Get started')}
          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function StudyCornerHubPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('স্টাডি কর্নার', 'Study Corner')}
          </h1>
          <p className="text-warm-muted mt-1 text-sm">
            {t(
              'প্রস্তুতি, অভিজ্ঞতা শেয়ারিং ও বই — সবকিছু এক জায়গায়',
              'Preparation, experience sharing and books — all in one place'
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {TILES.map((tile) => <Tile key={tile.href} tile={tile} />)}
        </div>
      </main>

      <Footer />
    </div>
  );
}
