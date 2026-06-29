'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  url: string;
}

export default function PdfViewer({ url }: Props) {
  const [numPages, setNumPages]     = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom]             = useState(1.0);
  const [loading, setLoading]       = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pageRefs      = useRef<(HTMLDivElement | null)[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width for responsive page sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Update current page indicator as user scrolls
  useEffect(() => {
    if (!numPages || !scrollAreaRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry with the highest intersection ratio as "current"
        let best = -1;
        let bestRatio = 0;
        entries.forEach((entry) => {
          const idx = pageRefs.current.indexOf(entry.target as HTMLDivElement);
          if (idx >= 0 && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            best = idx;
          }
        });
        if (best >= 0) setCurrentPage(best + 1);
      },
      { root: scrollAreaRef.current, threshold: [0.25, 0.5, 0.75] },
    );
    pageRefs.current.forEach((ref) => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [numPages]);

  const onLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages).fill(null);
    setLoading(false);
  }, []);

  const scrollToPage = (page: number) => {
    const target = pageRefs.current[page - 1];
    if (target && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: target.offsetTop - 16, behavior: 'smooth' });
    }
    setCurrentPage(page);
  };

  const prev = () => scrollToPage(Math.max(1, currentPage - 1));
  const next = () => scrollToPage(Math.min(numPages, currentPage + 1));
  const zoomIn  = () => setZoom((z) => Math.min(2.0, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));

  const toBn = (n: number) =>
    n.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]);

  const pageWidth = containerWidth > 0 ? (containerWidth - 32) * zoom : undefined;

  return (
    <div className="card overflow-hidden" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary-900 text-white flex-wrap">
        <span className="text-sm font-semibold">📄 বিজ্ঞপ্তি (PDF)</span>

        {!loading && (
          <div className="flex items-center gap-2 text-sm">
            <button onClick={prev} disabled={currentPage <= 1}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors">
              ←
            </button>
            <span className="min-w-[90px] text-center">
              পৃষ্ঠা {toBn(currentPage)} / {toBn(numPages)}
            </span>
            <button onClick={next} disabled={currentPage >= numPages}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors">
              →
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button onClick={zoomOut}
            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-sm" title="জুম আউট">
            −
          </button>
          <span className="text-xs min-w-[42px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn}
            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-sm" title="জুম ইন">
            +
          </button>
          <a href={url} download
            className="ml-2 px-3 py-1 rounded bg-accent hover:bg-accent-dark text-white text-xs font-medium transition-colors">
            ⬇ ডাউনলোড
          </a>
        </div>
      </div>

      {/* Scrollable area — all pages stacked, scroll through them */}
      <div
        ref={scrollAreaRef}
        className="overflow-y-auto bg-gray-100 p-4"
        style={{ maxHeight: '80vh' }}
      >
        {loading && (
          <div className="flex items-center justify-center min-h-[400px] text-gray-500 text-sm animate-pulse">
            PDF লোড হচ্ছে...
          </div>
        )}

        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          onLoadError={() => setLoading(false)}
          loading=""
        >
          {numPages > 0 && Array.from({ length: numPages }, (_, i) => (
            <div
              key={i}
              ref={(el) => { pageRefs.current[i] = el; }}
              className="mb-4 flex justify-center"
            >
              <Page
                pageNumber={i + 1}
                width={pageWidth}
                className="shadow-lg"
                renderAnnotationLayer
                renderTextLayer
              />
            </div>
          ))}
        </Document>
      </div>

      {/* Page jump strip — quick-access page numbers */}
      {!loading && numPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2.5 border-t border-warm-border bg-white flex-wrap px-4">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => scrollToPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                p === currentPage
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary'
              }`}
            >
              {toBn(p)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
