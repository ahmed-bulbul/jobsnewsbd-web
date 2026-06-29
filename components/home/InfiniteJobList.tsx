'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getPosts } from '@/lib/api';
import JobCard from '@/components/jobs/JobCard';
import T from '@/components/ui/T';
import type { PostSummary } from '@/lib/types';

interface Props {
  initialPosts: PostSummary[];
  initialLast: boolean;
  initialPage: number;
  nameToTypeSlug: Record<string, string>;
}

export default function InfiniteJobList({ initialPosts, initialLast, initialPage, nameToTypeSlug }: Props) {
  const [posts, setPosts] = useState<PostSummary[]>(initialPosts);
  const [page, setPage] = useState(initialPage);
  const [last, setLast] = useState(initialLast);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || last) return;
    setLoading(true);
    try {
      const next = page + 1;
      const result = await getPosts({ page: next, size: 9 });
      setPosts((prev) => [...prev, ...result.content]);
      setPage(next);
      setLast(result.last);
    } catch {
      /* silent — user can scroll again to retry */
    } finally {
      setLoading(false);
    }
  }, [loading, last, page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-warm-muted">
        <div className="text-5xl mb-4">📋</div>
        <p><T bn="এখনো কোনো বিজ্ঞপ্তি নেই" en="No circulars yet" /></p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <JobCard
            key={post.id}
            post={post}
            categoryTypeSlug={nameToTypeSlug[post.categoryName ?? '']}
          />
        ))}
      </div>

      {/* Sentinel — IntersectionObserver target */}
      <div ref={sentinelRef} className="h-4 mt-6" />

      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {last && posts.length > 9 && (
        <p className="text-center text-sm text-warm-muted py-4">
          ✓ <T bn="সব বিজ্ঞপ্তি দেখা হয়েছে" en="All circulars loaded" />
        </p>
      )}
    </>
  );
}
