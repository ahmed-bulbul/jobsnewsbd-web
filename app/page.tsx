import { getCategoryTypes, getCategories, getPosts } from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSearch from '@/components/home/HeroSearch';
import CategoryPills from '@/components/home/CategoryPills';
import UrgencyTicker from '@/components/home/UrgencyTicker';
import InfiniteJobList from '@/components/home/InfiniteJobList';
import T from '@/components/ui/T';
import type { Category, CategoryType } from '@/lib/types';
import Link from 'next/link';

export const revalidate = 60;

export default async function HomePage() {
  const [categoryTypes, categories, latestPosts] = await Promise.all([
    getCategoryTypes().catch((): CategoryType[] => []),
    getCategories().catch((): Category[] => []),
    getPosts({ size: 9 }).catch(() => ({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 9, last: true })),
  ]);

  // category name → category type slug (for JobCard border color)
  const nameToTypeSlug: Record<string, string> = {};
  categories.forEach((c) => {
    const ct = categoryTypes.find((t) => t.id === c.categoryTypeId);
    if (ct) nameToTypeSlug[c.nameBn] = ct.slug;
  });

  return (
    <>
      <Header />
      <main>
        <HeroSearch />

        <UrgencyTicker posts={latestPosts.content} />

        {/* Stats bar */}
        <div className="bg-primary-900 text-white">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 grid grid-cols-3 divide-x divide-primary-700">
            {[
              { bn: 'মোট বিজ্ঞপ্তি', en: 'Total Circulars', value: latestPosts.totalElements },
              { bn: 'বিভাগ',         en: 'Categories',      value: categories.length },
              { bn: 'ধরন',           en: 'Job Types',       value: categoryTypes.length },
            ].map((s) => (
              <div key={s.bn} className="text-center px-1 sm:px-4">
                <div className="text-lg sm:text-2xl font-bold text-accent">{s.value}+</div>
                <div className="text-[10px] sm:text-xs text-primary-300 mt-0.5 leading-tight"><T bn={s.bn} en={s.en} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <CategoryPills categoryTypes={categoryTypes} categories={categories} />

        {/* Job listing with infinite scroll */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">
              <span className="text-primary">▍</span>
              <T bn="সর্বশেষ চাকরির বিজ্ঞপ্তি" en="Latest Job Circulars" />
            </h2>
            <Link href="/jobs" className="text-sm text-primary-600 hover:text-primary font-medium hover:underline">
              <T bn="ফিল্টার করুন →" en="Filter jobs →" />
            </Link>
          </div>

          <InfiniteJobList
            initialPosts={latestPosts.content}
            initialLast={latestPosts.last}
            initialPage={latestPosts.page}
            nameToTypeSlug={nameToTypeSlug}
          />
        </section>

        {/* About / intro — real content about the site for visitors and search engines */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
          <div className="card p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              <T bn="জব রাডার বাংলাদেশ কী এবং কেন ব্যবহার করবেন" en="What is Job Radar BD, and why use it" />
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                <T
                  bn="জব রাডার বাংলাদেশ (আগে চাকরির খবর নামে পরিচিত) বাংলাদেশের সরকারি, বেসরকারি, ব্যাংক ও এনজিও প্রতিষ্ঠানের চাকরির বিজ্ঞপ্তি প্রতিদিন সংগ্রহ করে এক জায়গায় নিয়ে আসে। প্রতিটি বিজ্ঞপ্তির সাথে মূল সার্কুলার (PDF), গুরুত্বপূর্ণ তারিখ, আবেদনের যোগ্যতা ও শেষ সময়সীমার কাউন্টডাউন যুক্ত থাকে, যাতে কোনো সুযোগ হাতছাড়া না হয়।"
                  en="Job Radar BD (formerly চাকরির খবর) collects government, private, bank and NGO job circulars from across Bangladesh every day and brings them into one place. Each listing includes the official circular (PDF), key dates, eligibility details, and a countdown to the application deadline so nothing slips by."
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
      </main>
      <Footer />
    </>
  );
}
