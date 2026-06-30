'use client';

import { useLanguage } from '@/context/LanguageContext';
import type { Category, CategoryType, PostType, PostFilters } from '@/lib/types';

interface Props {
  filters: PostFilters;
  categoryTypes: CategoryType[];
  categories: Category[];
  postTypes: PostType[];
  onChange: (f: Partial<PostFilters>) => void;
  onReset: () => void;
  totalElements: number;
}

export default function JobFilters({
  filters,
  categoryTypes,
  categories,
  postTypes,
  onChange,
  onReset,
  totalElements,
}: Props) {
  const { t } = useLanguage();

  const filteredCategories = filters.categoryId
    ? categories
    : categories;

  const hasFilters = !!(filters.categoryId || filters.postTypeId || filters.status || filters.q);

  const statusOptions = [
    { value: 'ONGOING',  label: t('চলমান', 'Ongoing') },
    { value: 'UPCOMING', label: t('আসছে', 'Upcoming') },
    { value: 'CLOSED',   label: t('বন্ধ', 'Closed') },
  ];

  return (
    <aside className="bg-white rounded-2xl border border-warm-border shadow-card p-5 space-y-5 h-fit sticky top-20">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{t('ফিল্টার', 'Filters')}</h3>
        {hasFilters && (
          <button onClick={onReset} className="text-xs text-red-500 hover:text-red-700 font-medium">
            {t('রিসেট', 'Reset')}
          </button>
        )}
      </div>

      <div className="text-xs text-warm-muted font-medium pb-3 border-b border-warm-border">
        {t(`${totalElements} টি চাকরি পাওয়া গেছে`, `${totalElements} jobs found`)}
      </div>

        {/* Post type */}
        <div>
            <label className="label">{t('বিজ্ঞপ্তির ধরন', 'Post Type')}</label>
            <select
                value={filters.postTypeId ?? ''}
                onChange={(e) => onChange({ postTypeId: e.target.value ? Number(e.target.value) : undefined, page: 0 })}
                className="input text-sm"
            >
                <option value="">{t('সব ধরন', 'All Types')}</option>
                {postTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>{t(pt.nameBn, pt.nameEn ?? pt.nameBn)}</option>
                ))}
            </select>
        </div>

      {/* Category Type */}
      <div>
        <label className="label">{t('বিভাগের ধরন', 'Category Type')}</label>
        <div className="space-y-1.5">
          {categoryTypes.map((ct) => (
            <button
              key={ct.id}
              onClick={() => onChange({ categoryId: undefined })}
              className="w-full text-left"
            >
              <div className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                categories.some((c) => c.id === filters.categoryId && c.categoryTypeId === ct.id)
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-cream'
              }`}>
                {t(ct.nameBn, ct.nameEn ?? ct.nameBn)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="label">{t('বিভাগ', 'Category')}</label>
        <select
          value={filters.categoryId ?? ''}
          onChange={(e) => onChange({ categoryId: e.target.value ? Number(e.target.value) : undefined, page: 0 })}
          className="input text-sm"
        >
          <option value="">{t('সব বিভাগ', 'All Categories')}</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>{t(c.nameBn, c.nameEn ?? c.nameBn)}</option>
          ))}
        </select>
      </div>



      {/* Status */}
      <div>
        <label className="label">{t('অবস্থা', 'Status')}</label>
        <div className="space-y-1.5">
          {statusOptions.map((s) => (
            <label key={s.value} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="status"
                value={s.value}
                checked={filters.status === s.value}
                onChange={() => onChange({ status: s.value as PostFilters['status'], page: 0 })}
                className="accent-primary"
              />
              <span className="text-sm text-gray-700 group-hover:text-primary">{s.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="status"
              value=""
              checked={!filters.status}
              onChange={() => onChange({ status: undefined, page: 0 })}
              className="accent-primary"
            />
            <span className="text-sm text-gray-700 group-hover:text-primary">{t('সব', 'All')}</span>
          </label>
        </div>
      </div>
    </aside>
  );
}
