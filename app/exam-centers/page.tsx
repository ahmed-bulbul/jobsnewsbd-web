'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getExamCenters } from '@/lib/api';
import type { ExamCenterSummary } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

function MobileVoteBadge({ allowed, notAllowed }: { allowed: number; notAllowed: number }) {
  const total = allowed + notAllowed;
  const { t } = useLanguage();
  if (total === 0) return (
    <span className="text-xs text-warm-muted">{t('ভোট নেই', 'No votes')}</span>
  );
  const pct = Math.round((allowed / total) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden w-16">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-emerald-700 font-medium">{pct}%</span>
      <span className="text-xs text-warm-muted">{t('মোবাইল অনুমতি', 'Mobile ok')}</span>
    </div>
  );
}

function CenterCard({ center }: { center: ExamCenterSummary }) {
  const { t } = useLanguage();
  return (
    <Link
      href={`/exam-centers/${center.id}`}
      className="bg-white rounded-2xl border border-warm-border hover:border-primary hover:shadow-md transition-all group flex flex-col overflow-hidden"
    >
      {center.photoUrl ? (
        <div className="relative h-40 w-full overflow-hidden">
          <Image src={center.photoUrl} alt={center.nameBn} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute bottom-2 left-3 text-white text-xs font-medium bg-black/30 rounded px-1.5 py-0.5">
            {center.area}
          </span>
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative">
          <svg className="w-14 h-14 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="absolute bottom-2 left-3 text-primary-600 text-xs font-medium bg-primary-100 rounded px-1.5 py-0.5">
            {center.area}
          </span>
        </div>
      )}

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-primary transition-colors">{center.nameBn}</h3>
          <p className="text-xs text-warm-muted mt-0.5">{center.nameEn}</p>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 flex-1">{center.address}</p>

        <div className="flex items-center justify-between pt-1 border-t border-warm-border mt-auto">
          <MobileVoteBadge allowed={center.mobileAllowed} notAllowed={center.mobileNotAllowed} />
          <span className="text-xs text-warm-muted">
            {center.tipCount} {t('টিপস', 'tips')}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CenterCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-border overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

export default function ExamCentersPage() {
  const { t } = useLanguage();
  const [centers, setCenters] = useState<ExamCenterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const data = await getExamCenters(q || undefined);
      setCenters(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(query); }, [load, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-warm-bg">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-2">
              {t('পরীক্ষা কেন্দ্র কমিউনিটি', 'Exam Center Community')}
            </h1>
            <p className="text-primary-200 mb-8 text-sm max-w-lg mx-auto">
              {t(
                'বাস রুট, মোবাইল নীতি, খাবার — পরীক্ষার দিন সব তথ্য এক জায়গায়',
                'Bus routes, mobile policy, food — all exam day info in one place',
              )}
            </p>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('কেন্দ্র খুঁজুন...', 'Search center...')}
                className="flex-1 px-4 py-2.5 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button type="submit" className="bg-white text-primary font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary-50 transition-colors">
                {t('খুঁজুন', 'Search')}
              </button>
            </form>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {query && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-gray-600">
                {t(`"${query}" খুঁজে পাওয়া গেছে:`, `Results for "${query}":`)}
              </span>
              <button
                onClick={() => { setSearch(''); setQuery(''); }}
                className="text-xs text-primary underline"
              >
                {t('পরিষ্কার করুন', 'Clear')}
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CenterCardSkeleton key={i} />)}
            </div>
          ) : centers.length === 0 ? (
            <div className="text-center py-20 text-warm-muted">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-lg font-medium text-gray-500">{t('কোনো কেন্দ্র পাওয়া যায়নি', 'No centers found')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {centers.map((c) => <CenterCard key={c.id} center={c} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
