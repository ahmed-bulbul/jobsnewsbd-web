'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { getPrepContent } from '@/lib/api';
import type { PrepContent } from '@/lib/types';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function VideoPlayer({ url }: { url: string }) {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all text-sm">
        {url}
      </a>
    );
  }
  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    </div>
  );
}

function MarkdownBody({ body }: { body: string }) {
  return (
    <div
      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br/>') }}
    />
  );
}

export default function PrepContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const [data, setData] = useState<PrepContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPrepContent(Number(id))
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const typeBadge: Record<string, { label: string; labelEn: string }> = {
    VIDEO: { label: 'ভিডিও', labelEn: 'Video' },
    POST:  { label: 'আর্টিকেল', labelEn: 'Article' },
    PDF:   { label: 'পিডিএফ', labelEn: 'PDF' },
    QUIZ:  { label: 'কুইজ', labelEn: 'Quiz' },
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link href="/prep" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('প্রস্তুতি', 'Preparation')}
        </Link>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-7 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-64 bg-gray-200 rounded-2xl mt-4" />
          </div>
        ) : error || !data ? (
          <div className="text-center py-20 text-warm-muted">
            {t('কন্টেন্ট পাওয়া যায়নি', 'Content not found')}
          </div>
        ) : (
          <article className="bg-white rounded-2xl border border-warm-border overflow-hidden">
            <div className="p-6 border-b border-warm-border">
              <div className="flex items-center gap-2 mb-3">
                {data.contentType && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary">
                    {t(
                      typeBadge[data.contentType]?.label ?? data.contentType,
                      typeBadge[data.contentType]?.labelEn ?? data.contentType
                    )}
                  </span>
                )}
                {data.durationSeconds && (
                  <span className="text-xs text-warm-muted">
                    {Math.floor(data.durationSeconds / 60)} {t('মিনিট', 'min')}
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{data.title}</h1>
            </div>

            <div className="p-6 space-y-6">
              {data.contentType === 'VIDEO' && data.contentUrl && (
                <VideoPlayer url={data.contentUrl} />
              )}

              {data.contentType === 'PDF' && data.contentUrl && (
                <a
                  href={data.contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-dark transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('পিডিএফ ডাউনলোড', 'Download PDF')}
                </a>
              )}

              {data.body && <MarkdownBody body={data.body} />}

              {!data.contentUrl && !data.body && (
                <p className="text-warm-muted text-sm text-center py-8">
                  {t('কন্টেন্ট শীঘ্রই আসছে', 'Content coming soon')}
                </p>
              )}
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
