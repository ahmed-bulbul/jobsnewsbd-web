'use client';

import dynamic from 'next/dynamic';

// ssr:false for the same reason as MarkdownBodyDynamic: isomorphic-dompurify
// pulls in jsdom (~12 MiB), which must stay out of the server-side Cloudflare
// Worker bundle (that bundle-size limit has bitten this app before).
const JobDescriptionBody = dynamic(() => import('./JobDescriptionBody'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="h-4 bg-gray-100 rounded w-5/6" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
    </div>
  ),
});

export default function JobDescriptionBodyDynamic({ description }: { description: string }) {
  return <JobDescriptionBody description={description} />;
}
