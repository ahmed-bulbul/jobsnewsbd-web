import { getCategoryTypes, getCategories, getPosts } from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSearch from '@/components/home/HeroSearch';
import CategoryPills from '@/components/home/CategoryPills';
import UrgencyTicker from '@/components/home/UrgencyTicker';
import JobCard from '@/components/jobs/JobCard';
import T from '@/components/ui/T';
import type { Category, CategoryType } from '@/lib/types';
import Link from 'next/link';

export const revalidate = 60;

export default async function HomePage() {
  const [categoryTypes, categories, latestPosts] = await Promise.all([
    getCategoryTypes().catch((): CategoryType[] => []),
    getCategories().catch((): Category[] => []),
    getPosts({ size: 9 }).catch(() => ({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 9, last: true })),
  ]);

  const catTypeMap = new Map(
    categories.map((c) => {
      const ct = categoryTypes.find((t) => t.id === c.categoryTypeId);
      return [c.id, ct?.slug ?? ''];
    }),
  );

  return (
    <>
      <Header />
      <main>
        <HeroSearch />

        <UrgencyTicker posts={latestPosts.content} />

        {/* Stats bar */}
        <div className="bg-primary-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-3 divide-x divide-primary-700">
            {[
              { bn: 'মোট বিজ্ঞপ্তি', en: 'Total Circulars', value: latestPosts.totalElements },
              { bn: 'বিভাগ', en: 'Categories', value: categories.length },
              { bn: 'ধরন', en: 'Job Types', value: categoryTypes.length },
            ].map((s) => (
              <div key={s.bn} className="text-center px-4">
                <div className="text-2xl font-bold text-accent">{s.value}+</div>
                <div className="text-xs text-primary-300 mt-0.5"><T bn={s.bn} en={s.en} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <CategoryPills categoryTypes={categoryTypes} categories={categories} />

        {/* Latest jobs */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">
              <span className="text-primary">▍</span>
              <T bn="সর্বশেষ চাকরির বিজ্ঞপ্তি" en="Latest Job Circulars" />
            </h2>
            <Link href="/jobs" className="text-sm text-primary-600 hover:text-primary font-medium hover:underline">
              <T bn="সব দেখুন →" en="View all →" />
            </Link>
          </div>

          {latestPosts.content.length === 0 ? (
            <div className="text-center py-16 text-warm-muted">
              <div className="text-5xl mb-4">📋</div>
              <p><T bn="এখনো কোনো বিজ্ঞপ্তি নেই" en="No circulars yet" /></p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {latestPosts.content.map((post) => (
                <JobCard
                  key={post.id}
                  post={post}
                  categoryTypeSlug={catTypeMap.get(
                    categories.find((c) => c.name === post.categoryName)?.id ?? 0,
                  )}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
