import { getCategoryTypes, getCategories, getPosts, getLiveExams, getUpcomingExams, getJobExperiences } from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSearch from '@/components/home/HeroSearch';
import CategoryPills from '@/components/home/CategoryPills';
import QuickAccessChips, { type QuickAccessItem } from '@/components/home/QuickAccessChips';
import FeaturedJobsRow from '@/components/home/FeaturedJobsRow';
import LiveExamsToday from '@/components/home/LiveExamsToday';
import ClosingTodayTicker from '@/components/home/ClosingTodayTicker';
import ExplorePlatform from '@/components/home/ExplorePlatform';
import SuccessStories from '@/components/home/SuccessStories';
import AppDownloadBanner from '@/components/home/AppDownloadBanner';
import FaqSection from '@/components/home/FaqSection';
import T from '@/components/ui/T';
import type { Category, CategoryType, JobExperience, LiveExam, PostSummary, UpcomingExam } from '@/lib/types';

export const revalidate = 60;

const emptyPage = <Item,>(size: number) => ({ content: [] as Item[], totalElements: 0, totalPages: 0, page: 0, size, last: true });

function StatIcon({ path }: { path: string }) {
  return (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}

export default async function HomePage() {
  const [categoryTypes, categories, latestPosts, closingToday, liveExams, upcomingExams, successStories] = await Promise.all([
    getCategoryTypes().catch((): CategoryType[] => []),
    getCategories().catch((): Category[] => []),
    getPosts({ size: 6 }).catch(() => emptyPage<PostSummary>(6)),
    getPosts({ status: 'ONGOING', deadlineWithinDays: 1, size: 6 }).catch(() => emptyPage<PostSummary>(6)),
    getLiveExams().catch((): LiveExam[] => []),
    getUpcomingExams().catch((): UpcomingExam[] => []),
    getJobExperiences({ outcome: 'SELECTED', size: 3 }).catch(() => emptyPage<JobExperience>(3)),
  ]);

  // category name → category type slug (for JobCard border color)
  const nameToTypeSlug: Record<string, string> = {};
  categories.forEach((c) => {
    const ct = categoryTypes.find((t) => t.id === c.categoryTypeId);
    if (ct) nameToTypeSlug[c.nameBn] = ct.slug;
  });

  // Per-type job counts for the quick-access cards — one lightweight
  // (size: 1) count-only request per known type, run alongside each other.
  const typeId = (slug: string) => categoryTypes.find((ct) => ct.slug === slug)?.id;
  const [govtCount, privateCount, bankCount] = await Promise.all(
    (['government', 'private', 'bank'] as const).map((slug) => {
      const id = typeId(slug);
      return id ? getPosts({ categoryTypeId: id, size: 1 }).then((r) => r.totalElements).catch(() => 0) : Promise.resolve(0);
    })
  );

  const quickAccessItems: QuickAccessItem[] = [
    { href: `/jobs${typeId('government') ? `?categoryTypeId=${typeId('government')}` : ''}`, icon: '🏛️', bn: 'সরকারি চাকরি', en: 'Government Jobs', count: govtCount, color: 'bg-amber-50 text-amber-700' },
    { href: `/jobs${typeId('private') ? `?categoryTypeId=${typeId('private')}` : ''}`, icon: '🏢', bn: 'বেসরকারি চাকরি', en: 'Private Jobs', count: privateCount, color: 'bg-rose-50 text-rose-700' },
    { href: `/jobs${typeId('bank') ? `?categoryTypeId=${typeId('bank')}` : ''}`, icon: '🏦', bn: 'ব্যাংক চাকরি', en: 'Bank Jobs', count: bankCount, color: 'bg-blue-50 text-blue-700' },
    { href: '/prep', icon: '📝', bn: 'চাকরির প্রস্তুতি', en: 'Exam Prep', subtitleBn: 'প্রশ্ন ও সমাধান', subtitleEn: 'Questions & solutions', color: 'bg-emerald-50 text-emerald-700' },
    { href: '/study-corner', icon: '📚', bn: 'স্টাডি কর্নার', en: 'Study Corner', subtitleBn: 'PDF ও নোটস', subtitleEn: 'PDFs & notes', color: 'bg-violet-50 text-violet-700' },
  ];

  const closingTodayPosts = [...closingToday.content].sort(
    (a, b) => new Date(a.applicationEnd!).getTime() - new Date(b.applicationEnd!).getTime()
  );

  return (
    <>
      <Header />
      <ClosingTodayTicker posts={closingTodayPosts} />
      <main>
        <HeroSearch categoryTypes={categoryTypes} />

        <QuickAccessChips items={quickAccessItems} />

        <FeaturedJobsRow posts={latestPosts.content.slice(0, 6)} nameToTypeSlug={nameToTypeSlug} />

        <LiveExamsToday exams={liveExams} upcoming={upcomingExams} />

        <ExplorePlatform />

        <SuccessStories experiences={successStories.content} />

        <AppDownloadBanner />

        {/* Categories */}
        <CategoryPills categoryTypes={categoryTypes} categories={categories} />

        {/* About / intro — real content about the site for visitors and search engines */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              <T bn="Job Radar কী এবং কেন ব্যবহার করবেন" en="What is Job Radar, and why use it" />
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                <T
                  bn="Job Radar বাংলাদেশের সরকারি, বেসরকারি, ব্যাংক ও এনজিও প্রতিষ্ঠানের চাকরির বিজ্ঞপ্তি প্রতিদিন সংগ্রহ করে এক জায়গায় নিয়ে আসে। প্রতিটি বিজ্ঞপ্তির সাথে মূল সার্কুলার (PDF), গুরুত্বপূর্ণ তারিখ, আবেদনের যোগ্যতা ও শেষ সময়সীমার কাউন্টডাউন যুক্ত থাকে, যাতে কোনো সুযোগ হাতছাড়া না হয়।"
                  en="Job Radar collects government, private, bank and NGO job circulars from across Bangladesh every day and brings them into one place. Each listing includes the official circular (PDF), key dates, eligibility details, and a countdown to the application deadline so nothing slips by."
                />
              </p>
              <p>
                <T
                  bn="বিজ্ঞপ্তি ছাড়াও, স্টাডি কর্নার বিভাগে রয়েছে প্রকৃত প্রার্থীদের লেখা চাকরির অভিজ্ঞতা, প্রতিষ্ঠান রিভিউ, রিকমেন্ডেড বই তালিকা এবং একটি বই মার্কেটপ্লেস যেখানে ব্যবহারকারীরা নিজেদের মধ্যে পুরনো বই কেনাবেচা করতে পারেন। টুলস বিভাগে আছে ছবি রিসাইজার, বয়স ক্যালকুলেটর এবং ছবি-PDF কনভার্টার — আবেদন ফর্ম পূরণের সময় যা যা লাগে, তার সবকিছু।"
                  en="Beyond circulars, the Study Corner section has real candidates' interview and exam experiences, institute reviews, a recommended-books list, and a book marketplace where users buy and sell used books directly with each other. The Tools section has an image resizer, an age calculator, and image/PDF converters — everything needed while filling out an application form."
                />
              </p>
              <p>
                <T
                  bn="সাইটের সব সুবিধা সম্পূর্ণ বিনামূল্যে এবং কোনো নিবন্ধন ছাড়াই ব্যবহার করা যায়; অ্যাকাউন্ট তৈরি করলে অতিরিক্ত সুবিধা যেমন প্রিয় বিজ্ঞপ্তি সংরক্ষণ ও তথ্য সংরক্ষণের সুযোগ পাওয়া যায়।"
                  en="Every feature is free to use and most require no account at all; creating one unlocks extras like saving favorite listings and storing your personal details for quick reuse on application forms."
                />
              </p>
            </div>
          </div>
        </section>

        <FaqSection />

        {/* Stats bar — closing summary just above the footer */}
        <div className="bg-primary-900 text-white">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 grid grid-cols-4 divide-x divide-primary-700">
            {[
              { bn: 'মোট বিজ্ঞপ্তি', en: 'Total Circulars', value: latestPosts.totalElements, icon: <StatIcon path="M12 2a5 5 0 015 5v2a5 5 0 01-10 0V7a5 5 0 015-5zM4 21a8 8 0 0116 0" /> },
              { bn: 'বিভাগ',         en: 'Categories',      value: categories.length, icon: <StatIcon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
              { bn: 'ধরন',           en: 'Job Types',       value: categoryTypes.length, icon: <StatIcon path="M4 21V9l8-6 8 6v12M9 21v-6h6v6" /> },
              { bn: 'আপডেট',         en: 'Updates',         value: '24/7', icon: <StatIcon path="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36A5.5 5.5 0 1112.36 3.1 9 9 0 0012 3z" /> },
            ].map((s) => (
              <div key={s.bn} className="flex items-center gap-2 sm:gap-3 justify-center px-1 sm:px-4">
                <span className="hidden xs:flex sm:flex w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-white/10 items-center justify-center text-accent">
                  {s.icon}
                </span>
                <div className="text-center sm:text-left">
                  <div className="text-lg sm:text-2xl font-bold text-accent">
                    {typeof s.value === 'number' ? `${s.value}+` : s.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-primary-300 mt-0.5 leading-tight"><T bn={s.bn} en={s.en} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
