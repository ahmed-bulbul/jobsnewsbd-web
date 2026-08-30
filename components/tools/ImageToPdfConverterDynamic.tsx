'use client';

import dynamic from 'next/dynamic';

// ssr:false is load-bearing here, not cosmetic — ImageToPdfConverter pulls in
// pdf-lib (via lib/fileConvert.ts) at module scope. Without this wrapper, the
// 4 tool pages that render it directly (all plain Server Components) force
// Next to include pdf-lib in the server-side Worker bundle, which is a major
// contributor to blowing past Cloudflare's 3 MiB Worker size limit. Wrapping
// with next/dynamic + ssr:false tells Next to exclude this branch from SSR
// entirely, so pdf-lib only ever ships in the browser-side chunk. Mirrors the
// same pattern already used for PdfViewer (see PdfViewerDynamic.tsx).
const ImageToPdfConverter = dynamic(() => import('./ImageToPdfConverter'), {
  ssr: false,
  loading: () => (
    <div className="card p-10 flex items-center justify-center text-warm-muted text-sm animate-pulse">
      লোড হচ্ছে...
    </div>
  ),
});

export default function ImageToPdfConverterDynamic() {
  return <ImageToPdfConverter />;
}
