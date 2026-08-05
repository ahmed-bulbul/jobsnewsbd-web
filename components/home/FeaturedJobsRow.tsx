import Link from 'next/link';
import FeaturedJobCard from '@/components/jobs/FeaturedJobCard';
import T from '@/components/ui/T';
import type { PostSummary } from '@/lib/types';

interface Props {
  posts: PostSummary[];
  nameToTypeSlug: Record<string, string>;
}

export default function FeaturedJobsRow({ posts, nameToTypeSlug }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title">
          <span className="text-primary">▍</span>
          🔥 <T bn="ফিচারড চাকরি" en="Featured Jobs" />
        </h2>
        <Link href="/jobs" className="text-sm text-primary-600 hover:text-primary font-medium hover:underline">
          <T bn="সব দেখুন →" en="View All →" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
        {posts.map((post) => (
          <FeaturedJobCard
            key={post.id}
            post={post}
            categoryTypeSlug={nameToTypeSlug[post.categoryNameBn ?? '']}
          />
        ))}
      </div>
    </section>
  );
}
