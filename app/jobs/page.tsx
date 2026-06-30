'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import JobCard from '@/components/jobs/JobCard';
import JobFilters from '@/components/jobs/JobFilters';
import Pagination from '@/components/ui/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { getCategoryTypes, getCategories, getPostTypes, getPosts } from '@/lib/api';
import type { Category, CategoryType, PagedResponse, PostFilters, PostSummary, PostType } from '@/lib/types';

export default function JobsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();

  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [postTypes, setPostTypes]         = useState<PostType[]>([]);
  const [result, setResult]               = useState<PagedResponse<PostSummary> | null>(null);
  const [loading, setLoading]             = useState(true);

  const [filters, setFilters] = useState<PostFilters>({
    q:             searchParams.get('q') ?? undefined,
    categoryId:    searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined,
    categoryTypeId: searchParams.get('categoryTypeId') ? Number(searchParams.get('categoryTypeId')) : undefined,
    postTypeId:    searchParams.get('postTypeId') ? Number(searchParams.get('postTypeId')) : undefined,
    status:        (searchParams.get('status') as PostFilters['status']) ?? undefined,
    page:          0,
    size:          12,
  });

  // Load static data once
  useEffect(() => {
    Promise.all([getCategoryTypes(), getCategories(), getPostTypes()]).then(([ct, c, pt]) => {
      setCategoryTypes(ct);
      setCategories(c);
      setPostTypes(pt);
    });
  }, []);

  // Fetch jobs whenever filters change
  useEffect(() => {
    setLoading(true);
    getPosts(filters)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [filters]);

  const updateFilters = useCallback((partial: Partial<PostFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ page: 0, size: 12 });
    router.push('/jobs');
  }, [router]);

  // Build category → type slug map
  const catTypeMap = new Map(
    categories.map((c) => {
      const ct = categoryTypes.find((t) => t.id === c.categoryTypeId);
      return [c.id, ct?.slug ?? ''];
    }),
  );

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('সব চাকরির বিজ্ঞপ্তি', 'All Job Circulars')}
          </h1>
          {filters.q && (
            <p className="mt-1 text-warm-muted text-sm">
              &ldquo;{filters.q}&rdquo; {t('এর জন্য ফলাফল', 'search results')}
            </p>
          )}
        </div>

        {/* Search bar */}
        <form
          className="flex gap-3 mb-8"
          onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); updateFilters({ q: (fd.get('q') as string) || undefined, page: 0 }); }}
        >
          <input
            name="q"
            defaultValue={filters.q}
            placeholder={t('পদের নাম বা প্রতিষ্ঠান...', 'Search posts or organizations...')}
            className="input flex-1"
          />
          <button type="submit" className="btn-primary">
            {t('খুঁজুন', 'Search')}
          </button>
        </form>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <JobFilters
              filters={filters}
              categoryTypes={categoryTypes}
              categories={categories}
              postTypes={postTypes}
              onChange={updateFilters}
              onReset={resetFilters}
              totalElements={result?.totalElements ?? 0}
            />
          </div>

          {/* Results */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card p-5 h-52 animate-pulse bg-cream" />
                ))}
              </div>
            ) : result && result.content.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {result.content.map((post) => (
                    <JobCard
                      key={post.id}
                      post={post}
                      categoryTypeSlug={catTypeMap.get(
                        categories.find((c) => c.nameBn === post.categoryNameBn)?.id ?? 0,
                      )}
                    />
                  ))}
                </div>
                <Pagination
                  page={result.page}
                  totalPages={result.totalPages}
                  onPageChange={(p) => updateFilters({ page: p })}
                />
              </>
            ) : (
              <div className="text-center py-24 text-warm-muted">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-lg font-medium">{t('কোনো চাকরি পাওয়া যায়নি', 'No jobs found')}</p>
                <p className="text-sm mt-2">{t('ভিন্ন ফিল্টার ব্যবহার করুন', 'Try different filters')}</p>
                <button onClick={resetFilters} className="btn-outline mt-6">
                  {t('সব দেখান', 'Show all')}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
