'use client';

import { useLanguage } from '@/context/LanguageContext';
import { toBanglaDigits } from '@/lib/utils';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  const { lang, t } = useLanguage();
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i;
    if (page < 4) return i;
    if (page > totalPages - 4) return totalPages - 7 + i;
    return page - 3 + i;
  });

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="px-3 py-2 rounded-lg border border-warm-border text-sm text-gray-600 hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {t('← আগে', '← Prev')}
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
            p === page
              ? 'bg-primary text-white shadow-sm'
              : 'border border-warm-border text-gray-600 hover:bg-cream'
          }`}
        >
          {lang === 'bn' ? toBanglaDigits(p + 1) : p + 1}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="px-3 py-2 rounded-lg border border-warm-border text-sm text-gray-600 hover:bg-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {t('পরে →', 'Next →')}
      </button>
    </nav>
  );
}
