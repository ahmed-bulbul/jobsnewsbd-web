'use client';

import dynamic from 'next/dynamic';

// ssr:false is load-bearing — PdfToJpgConverter's imports (via
// lib/fileConvert.ts) reach react-pdf/pdfjs-dist and jszip. Rendering it
// directly from a Server Component page forces Next to include those
// (tens of MB combined) in the server-side Worker bundle. Excluding it from
// SSR keeps them client-only. Mirrors ImageToPdfConverterDynamic.tsx.
const PdfToJpgConverter = dynamic(() => import('./PdfToJpgConverter'), {
  ssr: false,
  loading: () => (
    <div className="card p-10 flex items-center justify-center text-warm-muted text-sm animate-pulse">
      লোড হচ্ছে...
    </div>
  ),
});

export default function PdfToJpgConverterDynamic() {
  return <PdfToJpgConverter />;
}
