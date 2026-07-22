import { getPostBySlug, getCategoryTypes, getCategories } from '@/lib/api';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CommentsSection from './CommentsSection';
import DeadlineCountdown from '@/components/ui/DeadlineCountdown';
import StatusBadge from '@/components/ui/StatusBadge';
import CopyLinkButton from '@/components/ui/CopyLinkButton';
import PdfViewerDynamic from '@/components/ui/PdfViewerDynamic';
import T from '@/components/ui/T';
import SaveJobButton from '@/components/profile/SaveJobButton';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) return { title: 'চাকরি পাওয়া যায়নি' };

  const title = post.titleBn ?? post.titleEn;
  const description = [
    post.organizationName,
    post.district,
    post.qualification,
    post.titleEn,
  ].filter(Boolean).join(' | ');
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jobradarbd.com'}/jobs/${slug}`;
  const ogImage = post.images?.[0]?.url
    ? `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.jobradarbd.com'}${post.images[0].url}`
    : `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://api.jobradarbd.com'}/og-default.png`;

  return {
    title,
    description,
    keywords: [
      post.titleEn,
      post.titleBn ?? '',
      post.organizationName ?? '',
      post.district ?? '',
      post.category.nameBn,
      'চাকরি', 'job circular', 'Bangladesh job',
    ].filter(Boolean),
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: 'bn_BD',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      siteName: 'চাকরির খবর',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: url },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;
  const [post, categoryTypes, categories] = await Promise.all([
    getPostBySlug(slug).catch(() => null),
    getCategoryTypes().catch(() => []),
    getCategories().catch(() => []),
  ]);

  if (!post) notFound();

  const category = categories.find((c) => c.id === post.category.id);
  const categoryType = categoryTypes.find((ct) => ct.id === category?.categoryTypeId);

  const TYPE_BORDER: Record<string, string> = {
    government: 'from-primary-900 to-primary-600',
    bank:       'from-blue-900 to-blue-600',
    ngo:        'from-amber-700 to-amber-500',
    private:    'from-violet-900 to-violet-600',
  };
  const gradientClass = TYPE_BORDER[categoryType?.slug ?? ''] ?? 'from-gray-800 to-gray-600';

  const infoCards = [
    { icon: '📍', bn: 'জেলা', en: 'District', value: post.district },
    { icon: '🎓', bn: 'যোগ্যতা', en: 'Qualification', value: post.qualification },
    { icon: '📁', bn: 'বিভাগ', en: 'Category', value: post.category.nameBn },
    { icon: '📅', bn: 'প্রকাশের তারিখ', en: 'Published Date', value: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('bn-BD') : null },
  ].filter((item) => item.value);

  // Every post type frames "the CTA button", "the dates card", and "the countdown"
  // differently — a result isn't something you "apply" to, an admit card isn't a
  // "deadline", a question paper archive doesn't need a countdown at all.
  interface PostTypeMeta {
    cta: { bn: string; en: string };
    cardTitle: { bn: string; en: string };
    startLabel: { bn: string; en: string };
    endLabel: { bn: string; en: string };
    countdown: null | { titleBn: string; titleEn: string; expiredBn: string; expiredEn: string };
  }

  const POST_TYPE_META: Record<string, PostTypeMeta> = {
    'job-circular': {
      cta: { bn: 'অনলাইনে আবেদন করুন →', en: 'Apply Online →' },
      cardTitle: { bn: 'আবেদনের সময়সীমা', en: 'Application Deadline' },
      startLabel: { bn: 'আবেদন শুরু', en: 'Application Start' },
      endLabel: { bn: 'আবেদনের শেষ তারিখ', en: 'Application End Date' },
      countdown: {
        titleBn: 'আবেদনের বাকি সময়', titleEn: 'Time Remaining to Apply',
        expiredBn: 'আবেদনের সময় শেষ হয়ে গেছে', expiredEn: 'Application deadline has passed',
      },
    },
    'admit-card': {
      cta: { bn: 'প্রবেশপত্র ডাউনলোড করুন →', en: 'Download Admit Card →' },
      cardTitle: { bn: 'ডাউনলোডের সময়সীমা', en: 'Download Period' },
      startLabel: { bn: 'ডাউনলোড শুরু', en: 'Download Start' },
      endLabel: { bn: 'ডাউনলোডের শেষ তারিখ', en: 'Download End Date' },
      countdown: {
        titleBn: 'ডাউনলোডের বাকি সময়', titleEn: 'Time Remaining to Download',
        expiredBn: 'ডাউনলোডের সময় শেষ হয়ে গেছে', expiredEn: 'Download period has ended',
      },
    },
    'exam-date': {
      cta: { bn: 'সময়সূচী দেখুন →', en: 'See Exam Date →' },
      cardTitle: { bn: 'পরীক্ষার সময়সূচী', en: 'Exam Schedule' },
      startLabel: { bn: 'পরীক্ষা শুরু', en: 'Exam Start' },
      endLabel: { bn: 'পরীক্ষার তারিখ', en: 'Exam Date' },
      countdown: {
        titleBn: 'পরীক্ষার বাকি সময়', titleEn: 'Time Until Exam',
        expiredBn: 'পরীক্ষা অনুষ্ঠিত হয়ে গেছে', expiredEn: 'Exam has already taken place',
      },
    },
    'job-result': {
      cta: { bn: 'ফলাফল দেখুন →', en: 'See Result →' },
      cardTitle: { bn: 'ফলাফল সংক্রান্ত তথ্য', en: 'Result Information' },
      startLabel: { bn: 'পরীক্ষার তারিখ', en: 'Exam Date' },
      endLabel: { bn: 'ফলাফল প্রকাশের তারিখ', en: 'Result Publish Date' },
      countdown: null, // a published result doesn't need a ticking countdown
    },
    'exam-question': {
      cta: { bn: 'প্রশ্নপত্র দেখুন →', en: 'See Question Paper →' },
      cardTitle: { bn: 'পরীক্ষার তথ্য', en: 'Exam Information' },
      startLabel: { bn: 'পরীক্ষার তারিখ', en: 'Exam Date' },
      endLabel: { bn: 'প্রকাশের তারিখ', en: 'Published Date' },
      countdown: null, // a static question-paper archive doesn't need a countdown
    },
  };

  const typeMeta = POST_TYPE_META[post.postType?.slug ?? ''] ?? POST_TYPE_META['job-circular'];
  const applyCta = typeMeta.cta;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jobsnewsbd.com';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: post.titleBn ?? post.titleEn,
    description: post.description ?? `${post.organizationName ?? ''} — ${post.titleEn}`,
    identifier: { '@type': 'PropertyValue', name: 'jobsnewsbd', value: post.id },
    datePosted: post.publishedAt,
    validThrough: post.applicationEnd ?? undefined,
    hiringOrganization: {
      '@type': 'Organization',
      name: post.organizationName ?? 'N/A',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: post.district ?? 'Bangladesh',
        addressCountry: 'BD',
      },
    },
    employmentType: 'FULL_TIME',
    url: `${siteUrl}/jobs/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        {/* Hero banner */}
        <div className={`bg-gradient-to-br ${gradientClass} text-white`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <Link href="/jobs" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-xs mb-3 transition-colors">
              <T bn="← বিজ্ঞপ্তি তালিকায় ফিরুন" en="← Back to listings" />
            </Link>

            <div className="flex flex-wrap gap-1.5 mb-2">
              <StatusBadge status={post.status} />
              {post.postType && (
                <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                  <T bn={post.postType.nameBn} en={post.postType.nameEn ?? post.postType.nameBn} />
                </span>
              )}
              {categoryType && (
                <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                  <T bn={categoryType.nameBn} en={categoryType.nameEn ?? categoryType.nameBn} />
                </span>
              )}
            </div>

            <h1 className="text-xl lg:text-2xl font-bold leading-snug mb-1">
              {post.titleBn ?? post.titleEn}
            </h1>
            {post.titleBn && post.titleEn !== post.titleBn && (
              <p className="text-white/75 font-sans text-sm">{post.titleEn}</p>
            )}

            {post.organizationName && (
              <p className="mt-2 text-white/90 font-semibold text-sm">🏢 {post.organizationName}</p>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Key info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {infoCards.map((item) => (
                  <div key={item.en} className="card p-4 flex flex-col gap-1">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs text-warm-muted"><T bn={item.bn} en={item.en} /></span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              {post.description && (
                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 mb-4 text-lg"><T bn="বিজ্ঞপ্তির বিবরণ" en="Job Description" /></h2>
                  <div
                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: post.description }}
                  />
                </div>
              )}

              {/* Images */}
              {post.images.length > 0 && (
                <div className="card p-6">
                  <h2 className="font-bold text-gray-900 mb-4 text-lg"><T bn="বিজ্ঞপ্তির ছবি" en="Circular Images" /></h2>
                  <div className="grid grid-cols-1 gap-4">
                    {post.images.map((img) => (
                      <div key={img.id} className="relative w-full rounded-xl overflow-hidden border border-warm-border" style={{ minHeight: 300 }}>
                        <Image
                          src={`${process.env.NEXT_PUBLIC_API_URL}${img.url}`}
                          alt="Job circular image"
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 600px"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Countdown — only for post types where a ticking countdown makes sense */}
              {post.applicationEnd && typeMeta.countdown && (
                <DeadlineCountdown
                  endDate={post.applicationEnd}
                  titleBn={typeMeta.countdown.titleBn}
                  titleEn={typeMeta.countdown.titleEn}
                  expiredBn={typeMeta.countdown.expiredBn}
                  expiredEn={typeMeta.countdown.expiredEn}
                />
              )}

              {/* Dates card — title/labels adapt to post type */}
              <div className="card p-5 space-y-4">
                <h3 className="font-bold text-gray-900"><T bn={typeMeta.cardTitle.bn} en={typeMeta.cardTitle.en} /></h3>
                {post.applicationStart && (
                  <div>
                    <p className="text-xs text-warm-muted mb-1"><T bn={typeMeta.startLabel.bn} en={typeMeta.startLabel.en} /></p>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(post.applicationStart).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {post.applicationEnd && (
                  <div>
                    <p className="text-xs text-warm-muted mb-1"><T bn={typeMeta.endLabel.bn} en={typeMeta.endLabel.en} /></p>
                    <p className="text-sm font-bold text-red-700">
                      {new Date(post.applicationEnd).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Apply button */}
              {post.sourceUrl && (
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full justify-center py-3 text-base"
                >
                  <T bn={applyCta.bn} en={applyCta.en} />
                </a>
              )}

              {/* Save job */}
              <SaveJobButton postId={post.id} />

              {/* Share */}
              <CopyLinkButton />
            </div>
          </div>
        </div>

        {/* PDF Circular — full width below the 3-col grid */}
        {post.circularPdfUrl && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <h2 className="font-bold text-gray-900 text-lg mb-3"><T bn="মূল বিজ্ঞপ্তি (PDF)" en="Official Circular (PDF)" /></h2>
            <PdfViewerDynamic url={post.circularPdfUrl} />
          </div>
        )}

        {/* Comments */}
        <div className="border-t border-warm-border mt-6 pt-8">
          <CommentsSection slug={slug} />
        </div>
      </main>
      <Footer />
    </>
  );
}
