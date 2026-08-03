'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getQuestionBankCategories } from '@/lib/api';
import type { QuestionBankCategory } from '@/lib/types';

function CategoryCard({ cat }: { cat: QuestionBankCategory }) {
  const { t } = useLanguage();
  const color = cat.colorHex ?? '#B45309';
  return (
    <Link
      href={`/study-corner/question-bank/${cat.slug}`}
      className="group bg-white rounded-2xl border border-warm-border hover:border-primary hover:shadow-md transition-all p-5 flex flex-col gap-2"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl select-none"
        style={{ background: `${color}22` }}
      >
        {cat.icon || '❓'}
      </div>
      <h3 className="font-bold text-base text-gray-900 group-hover:text-primary transition-colors">{cat.nameBn}</h3>
      {cat.nameEn && <p className="text-xs text-warm-muted">{cat.nameEn}</p>}
      {cat.description && <p className="text-xs text-gray-500 leading-relaxed mt-1 line-clamp-2">{cat.description}</p>}
      <p className="text-xs font-semibold mt-auto pt-2" style={{ color }}>
        {cat.questionCount} {t('টি প্রশ্ন', 'questions')}
      </p>
    </Link>
  );
}

export default function QuestionBankListPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<QuestionBankCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuestionBankCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/study-corner" className="hover:text-primary transition-colors">{t('স্টাডি কর্নার', 'Study Corner')}</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">{t('প্রশ্ন ব্যাংক', 'Question Bank')}</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('প্রশ্ন ব্যাংক', 'Question Bank')}</h1>
          <p className="mt-1 text-sm text-warm-muted">
            {t('বিষয়ভিত্তিক MCQ, লিখিত ও ল্যাব প্রশ্নের সংগ্রহ, উত্তরসহ', 'Category-wise MCQ, written and lab questions with answers')}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 bg-white rounded-2xl border border-warm-border animate-pulse" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 text-warm-muted text-sm">{t('এখনো কোনো ক্যাটাগরি যোগ করা হয়নি', 'No categories added yet')}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
