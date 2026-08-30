'use client';

import dynamic from 'next/dynamic';

const MarkdownBody = dynamic(() => import('./MarkdownBody'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="h-4 bg-gray-100 rounded w-5/6" />
      <div className="h-4 bg-gray-100 rounded w-2/3" />
    </div>
  ),
});

export default function MarkdownBodyDynamic({ body }: { body: string }) {
  return <MarkdownBody body={body} />;
}
