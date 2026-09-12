'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import CompactJobCard from '@/components/home/CompactJobCard';
import type { PostSummary, CategoryType } from '@/lib/types';

interface Props {
  posts: PostSummary[];
  categoryTypes: CategoryType[];
  nameToTypeSlug: Record<string, string>;
}

export default function FeaturedListingsSection({ posts, categoryTypes, nameToTypeSlug }: Props) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');

  const tabs = useMemo(
    () => [
      { slug: 'all', labelBn: 'সব', labelEn: 'All' },
      ...categoryTypes.map((ct) => ({ slug: ct.slug, labelBn: ct.nameBn, labelEn: ct.nameEn ?? ct.nameBn })),
    ],
    [categoryTypes],
  );

  const filteredPosts = useMemo(() => {
    if (activeTab === 'all') return posts;
    return posts.filter((p) => nameToTypeSlug[p.categoryNameBn ?? ''] === activeTab);
  }, [posts, activeTab, nameToTypeSlug]);

  const visiblePosts = filteredPosts.slice(0, 6);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="section-title">
          <span className="text-primary">▍</span>
          {t('নির্বাচিত নিয়োগ বিজ্ঞপ্তি', 'Featured Listings')}
        </h2>
        <Link href="/jobs" className="text-sm text-primary-600 hover:text-primary font-medium hover:underline">
          {t('সব বিজ্ঞপ্তি দেখুন →', 'View all →')}
        </Link>
      </div>
      <p className="text-sm text-warm-muted mb-5">
        {t('যাচাই করা বিজ্ঞপ্তি, আবেদনের শেষ তারিখ অনুযায়ী সাজানো', 'Verified listings, sorted by deadline')}
      </p>

      <div className="flex gap-2 flex-wrap mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.slug}
            onClick={() => setActiveTab(tab.slug)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.slug
                ? 'bg-primary text-white'
                : 'bg-white border border-warm-border text-gray-600 hover:border-primary-300'
            }`}
          >
            {t(tab.labelBn, tab.labelEn)}
          </button>
        ))}
      </div>

      {visiblePosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visiblePosts.map((post) => (
            <CompactJobCard
              key={post.id}
              post={post}
              categoryTypeSlug={nameToTypeSlug[post.categoryNameBn ?? '']}
            />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center text-sm text-warm-muted">
          {t('এই মুহূর্তে এই বিভাগে কোনো বিজ্ঞপ্তি নেই', 'No listings in this category right now')}
        </div>
      )}
    </section>
  );
}
