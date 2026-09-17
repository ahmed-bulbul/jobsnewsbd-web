'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import type { PostImage } from '@/lib/types';

interface Props {
  images: PostImage[];
}

/**
 * Thumbnail grid + full-screen lightbox for circular images uploaded from
 * the admin panel — the image-based alternative to PdfCircularSection.
 * `img.url` is already an absolute URL (FileStorageService.store() returns
 * `baseUrl + "/uploads/..."`), same as organizationLogoUrl elsewhere, so it's
 * used directly without re-prefixing NEXT_PUBLIC_API_URL.
 */
export default function PostImageGallery({ images }: Props) {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length],
  );
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, close, prev, next]);

  if (images.length === 0) return null;

  return (
    <>
      <div className={`grid gap-3 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative w-full rounded-xl overflow-hidden border border-warm-border bg-cream hover:opacity-90 transition-opacity"
            style={{ aspectRatio: '3 / 4' }}
          >
            <Image src={img.url} alt="Job circular" fill className="object-cover" unoptimized />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-xl hover:bg-white/20 transition-colors"
            aria-label={t('বন্ধ করুন', 'Close')}
          >
            ✕
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-xl hover:bg-white/20 transition-colors"
                aria-label={t('আগের ছবি', 'Previous image')}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center text-xl hover:bg-white/20 transition-colors"
                aria-label={t('পরের ছবি', 'Next image')}
              >
                ›
              </button>
            </>
          )}

          <div
            className="relative w-full h-full max-w-3xl max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[openIndex].url}
              alt="Job circular"
              fill
              className="object-contain"
              unoptimized
              sizes="100vw"
            />
          </div>

          {images.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
              {openIndex + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </>
  );
}
