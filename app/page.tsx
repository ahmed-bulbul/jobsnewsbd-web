import { getCategoryTypes, getCategories, getPosts } from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSearch from '@/components/home/HeroSearch';
import CategoryPills from '@/components/home/CategoryPills';
import UrgencyTicker from '@/components/home/UrgencyTicker';
import InfiniteJobList from '@/components/home/InfiniteJobList';
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

  // category name → category type slug (for JobCard border color)
  const nameToTypeSlug: Record<string, string> = {};
  categories.forEach((c) => {
    const ct = categoryTypes.find((t) => t.id === c.categoryTypeId);
    if (ct) nameToTypeSlug[c.nameBn] = ct.slug;
  });

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
              { bn: 'বিভাগ',         en: 'Categories',      value: categories.length },
              { bn: 'ধরন',           en: 'Job Types',       value: categoryTypes.length },
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

        {/* Job listing with infinite scroll */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">
              <span className="text-primary">▍</span>
              <T bn="সর্বশেষ চাকরির বিজ্ঞপ্তি" en="Latest Job Circulars" />
            </h2>
            <Link href="/jobs" className="text-sm text-primary-600 hover:text-primary font-medium hover:underline">
              <T bn="ফিল্টার করুন →" en="Filter jobs →" />
            </Link>
          </div>

          <InfiniteJobList
            initialPosts={latestPosts.content}
            initialLast={latestPosts.last}
            initialPage={latestPosts.page}
            nameToTypeSlug={nameToTypeSlug}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
