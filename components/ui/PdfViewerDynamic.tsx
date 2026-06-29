'use client';

import dynamic from 'next/dynamic';

const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="card p-8 flex items-center justify-center text-warm-muted text-sm animate-pulse min-h-[200px]">
      PDF লোড হচ্ছে...
    </div>
  ),
});

export default function PdfViewerDynamic({ url }: { url: string }) {
  return <PdfViewer url={url} />;
}
