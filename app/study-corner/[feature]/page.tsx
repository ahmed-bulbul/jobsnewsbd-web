'use client';

import { use } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

interface FeatureMeta {
  icon: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
}

const FEATURES: Record<string, FeatureMeta> = {
  'job-experience': {
    icon: '💬',
    titleBn: 'চাকরির অভিজ্ঞতা শেয়ার করুন',
    titleEn: 'Share Job Experience',
    descBn: 'আপনার চাকরির আবেদন থেকে শুরু করে ভাইভা পর্যন্ত পুরো যাত্রার অভিজ্ঞতা অন্যদের সাথে শেয়ার করতে পারবেন — শীঘ্রই আসছে।',
    descEn: "Share your full application-to-viva journey with other job seekers — coming soon.",
  },
  'recommended-books': {
    icon: '📚',
    titleBn: 'প্রস্তাবিত বই',
    titleEn: 'Recommended Books',
    descBn: 'প্রতিটি পরীক্ষার জন্য সেরা প্রস্তুতির বইয়ের একটি কিউরেটেড তালিকা শীঘ্রই যুক্ত হবে।',
    descEn: 'A curated list of the best prep books for each exam is coming soon.',
  },
  'book-marketplace': {
    icon: '📦',
    titleBn: 'পুরাতন বই কেনাবেচা',
    titleEn: 'Old Book Buy/Sell',
    descBn: 'পুরাতন প্রস্তুতির বই কেনা ও বিক্রি করার জন্য একটি মার্কেটপ্লেস শীঘ্রই আসছে।',
    descEn: 'A marketplace to buy and sell used preparation books is coming soon.',
  },
  'institute-reviews': {
    icon: '🏫',
    titleBn: 'ইনস্টিটিউট রিভিউ',
    titleEn: 'Institute Reviews',
    descBn: 'কোচিং সেন্টার ও প্রস্তুতির ইনস্টিটিউট সম্পর্কে অন্যদের রিভিউ পড়ুন এবং নিজের অভিজ্ঞতা শেয়ার করুন। শীঘ্রই আসছে।',
    descEn: 'Read reviews of coaching centers and prep institutes, and share your own — coming soon.',
  },
};

export default function StudyCornerFeaturePage({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = use(params);
  const { t } = useLanguage();
  const meta = FEATURES[feature];

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/study-corner" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('স্টাডি কর্নার', 'Study Corner')}
        </Link>

        {meta ? (
          <div className="card p-10 text-center">
            <div className="text-5xl mb-4">{meta.icon}</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t(meta.titleBn, meta.titleEn)}</h1>
            <p className="text-sm text-warm-muted max-w-md mx-auto leading-relaxed">{t(meta.descBn, meta.descEn)}</p>
            <span className="inline-block mt-5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
              {t('শীঘ্রই আসছে', 'Coming soon')}
            </span>
          </div>
        ) : (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('পেজটি পাওয়া যায়নি', 'Page not found')}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
