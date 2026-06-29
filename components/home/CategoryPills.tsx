'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { categoryTypeEmoji } from '@/lib/utils';
import type { Category, CategoryType } from '@/lib/types';

interface Props {
  categoryTypes: CategoryType[];
  categories: Category[];
}

const TYPE_COLORS: Record<string, string> = {
  government: 'border-primary-400 bg-primary-50 text-primary-700 hover:bg-primary-100',
  bank:        'border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100',
  ngo:         'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100',
  private:     'border-violet-400 bg-violet-50 text-violet-700 hover:bg-violet-100',
};

export default function CategoryPills({ categoryTypes, categories }: Props) {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="section-title mb-5">
        <span className="text-primary">▍</span>
        {t('বিভাগ অনুযায়ী চাকরি', 'Browse by Category')}
      </h2>

      {/* Category type cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {categoryTypes.map((ct) => {
          const colorClass = TYPE_COLORS[ct.slug] ?? 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100';
          const count = categories.filter((c) => c.categoryTypeId === ct.id).length;
          return (
            <Link
              key={ct.id}
              href={`/jobs?categoryTypeId=${ct.id}`}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all duration-200 hover:shadow-sm active:scale-[0.98] ${colorClass}`}
            >
              <span className="text-xl shrink-0">{categoryTypeEmoji(ct.slug)}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight">{ct.name}</p>
                {count > 0 && (
                  <p className="text-xs opacity-60 leading-tight">{count} {t('বিভাগ', 'categories')}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Individual category chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const parentType = categoryTypes.find((ct) => ct.id === cat.categoryTypeId);
          const chipColors = TYPE_COLORS[parentType?.slug ?? ''] ?? 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50';
          return (
            <Link
              key={cat.id}
              href={`/jobs?categoryId=${cat.id}`}
              className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${chipColors}`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
