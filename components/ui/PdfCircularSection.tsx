'use client';

import { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import PdfViewerDynamic from './PdfViewerDynamic';

interface Props {
  url: string;
}

/**
 * Click-to-load facade for the circular PDF viewer.
 *
 * Mounting react-pdf eagerly on every page load means fetching its JS bundle,
 * downloading the full PDF, spinning up the pdf.js worker, and rendering pages
 * to canvas — all before the visitor has asked for it. Most people land here
 * for the deadline/apply info (already summarized above), so the actual
 * viewer only mounts once someone explicitly asks to see it.
 *
 * Two refinements beyond a bare click-to-load:
 * 1. Hovering/focusing the button prefetches just the *code* (not the PDF
 *    itself, not a render) so a real click feels instant instead of waiting
 *    on a fresh chunk download.
 * 2. A plain download link sits next to the button so anyone who only wants
 *    the file can skip the viewer's JS entirely — zero extra cost for them.
 */
export default function PdfCircularSection({ url }: Props) {
  const { t } = useLanguage();
  const [loaded, setLoaded] = useState(false);
  const prefetched = useRef(false);

  // Warm the code-split chunk on hover/focus — cheap (JS only, no PDF bytes,
  // no render) and means the click below usually resolves from cache instead
  // of kicking off a fresh network fetch.
  const prefetch = useCallback(() => {
    if (prefetched.current) return;
    prefetched.current = true;
    import('./PdfViewer');
  }, []);

  if (loaded) {
    return (
      <div className="animate-fadeIn">
        <PdfViewerDynamic url={url} />
      </div>
    );
  }

  return (
    <div className="card w-full flex items-center justify-between gap-3 p-5">
      <button
        onClick={() => setLoaded(true)}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        aria-expanded={loaded}
        className="flex-1 flex items-center gap-3 text-left"
      >
        <span className="text-2xl shrink-0">📄</span>
        <span className="min-w-0">
          <span className="block font-semibold text-gray-900 text-sm">
            {t('মূল বিজ্ঞপ্তি (PDF) দেখুন', 'View official circular (PDF)')}
          </span>
          <span className="block text-xs text-warm-muted mt-0.5">
            {t('ক্লিক করলে PDF লোড হবে', 'Click to load the PDF')}
          </span>
        </span>
        <span className="text-primary-600 text-sm font-medium shrink-0 ml-auto">
          {t('দেখুন →', 'View →')}
        </span>
      </button>

      <a
        href={url}
        download
        onClick={(e) => e.stopPropagation()}
        title={t('সরাসরি ডাউনলোড করুন', 'Download directly')}
        className="shrink-0 p-2 rounded-lg text-warm-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
      </a>
    </div>
  );
}
