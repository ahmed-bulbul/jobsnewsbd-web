import type { MetadataRoute } from 'next';
import { getPosts } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jobsnewsbd.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/jobs`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Fetch all published posts across pages
  const postUrls: MetadataRoute.Sitemap = [];
  let page = 0;
  const size = 100;

  try {
    while (true) {
      const res = await getPosts({ page, size });
      for (const post of res.content) {
        postUrls.push({
          url: `${SITE_URL}/jobs/${post.slug}`,
          lastModified: post.applicationEnd ? new Date(post.applicationEnd) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
      if (res.last) break;
      page++;
    }
  } catch {
    // Return static routes if API is unavailable during build
  }

  return [...staticRoutes, ...postUrls];
}
