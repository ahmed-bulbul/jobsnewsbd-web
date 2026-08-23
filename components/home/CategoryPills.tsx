'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { categoryTypeEmoji } from '@/lib/utils';
import type { Category, CategoryType } from '@/lib/types';

interface Props {
  categoryTypes: CategoryType[];
  categories: Category[];
}

// Pastel icon-badge colors (matches the QuickAccessChips treatment) instead
// of a full 2px colored border per card — the border was the one place on
// the homepage still doing the "heavy box" thing after the redesign pass.
const TYPE_BADGE: Record<string, string> = {
  government: 'bg-primary-50 text-primary-700',
  bank:        'bg-blue-50 text-blue-700',
  ngo:         'bg-amber-50 text-amber-700',
  private:     'bg-violet-50 text-violet-700',
};

const TYPE_CHIP_TEXT: Record<string, string> = {
  government: 'text-primary-700 hover:bg-primary-50',
  bank:        'text-blue-700 hover:bg-blue-50',
  ngo:         'text-amber-700 hover:bg-amber-50',
  private:     'text-violet-700 hover:bg-violet-50',
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
          const badgeClass = TYPE_BADGE[ct.slug] ?? 'bg-gray-100 text-gray-700';
          const count = categories.filter((c) => c.categoryTypeId === ct.id).length;
          return (
            <Link key={ct.id} href={`/jobs?categoryTypeId=${ct.id}`} className="card flex items-center gap-3 px-4 py-3.5">
              <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg ${badgeClass}`}>
                {categoryTypeEmoji(ct.slug)}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-ink leading-tight truncate">{t(ct.nameBn, ct.nameEn ?? ct.nameBn)}</p>
                {count > 0 && (
                  <p className="text-xs text-ink-soft leading-tight">{count} {t('বিভাগ', 'categories')}</p>
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
          const chipTextClass = TYPE_CHIP_TEXT[parentType?.slug ?? ''] ?? 'text-gray-600 hover:bg-cream';
          return (
            <Link
              key={cat.id}
              href={`/jobs?categoryId=${cat.id}`}
              className={`px-3.5 py-1.5 rounded-full bg-white border border-warm-border/70 text-xs font-medium transition-colors ${chipTextClass}`}
            >
              {t(cat.nameBn, cat.nameEn ?? cat.nameBn)}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
