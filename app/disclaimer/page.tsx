'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function DisclaimerPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('হোমে ফিরুন', 'Back to Home')}
        </Link>

        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('ডিসক্লেইমার', 'Disclaimer')}</h1>
          <p className="text-xs text-warm-muted mb-8">{t('সর্বশেষ হালনাগাদ: ১৪ সেপ্টেম্বর, ২০২৬', 'Last updated: September 14, 2026')}</p>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-8">
            <h2 className="text-base font-bold text-amber-900 mb-1.5">{t('সরকারি সংস্থা নয়', 'Not a Government Entity')}</h2>
            <p className="text-sm text-amber-900 leading-relaxed">
              {t(
                'জব রাডার (Job Radar) কোনো সরকারি প্রতিষ্ঠান নয় এবং বাংলাদেশ সরকার বা এর কোনো মন্ত্রণালয়/দপ্তরের সাথে আনুষ্ঠানিকভাবে সম্পৃক্ত, অনুমোদিত বা অধিভুক্ত নয়। এটি একটি স্বাধীন, বেসরকারি তথ্য-সংকলন প্ল্যাটফর্ম। এখানে প্রকাশিত সরকারি চাকরির বিজ্ঞপ্তিগুলো সংশ্লিষ্ট মন্ত্রণালয়/দপ্তরের নিজস্ব অফিসিয়াল ওয়েবসাইট ও প্রজ্ঞাপন (যেমন bpsc.gov.bd, mopa.gov.bd, bb.org.bd এবং সংশ্লিষ্ট প্রতিষ্ঠানের ওয়েবসাইট) থেকে সংগ্রহ করা হয়। প্রতিটি বিজ্ঞপ্তির বিস্তারিত পাতায় সম্ভব ক্ষেত্রে মূল উৎসের লিংক দেওয়া থাকে — চূড়ান্ত সিদ্ধান্তের আগে অনুগ্রহ করে সেই মূল সরকারি উৎস থেকে তথ্য যাচাই করে নিন।',
                'Job Radar is not a government entity and is not officially affiliated with, endorsed by, or connected to the Government of Bangladesh or any of its ministries/departments. It is an independent, privately-run information platform. Government job circulars published here are collected from the respective ministry/department\'s own official websites and notices (e.g. bpsc.gov.bd, mopa.gov.bd, bb.org.bd, and the relevant organization\'s website). Where available, each circular\'s detail page links to its original source — please verify with that official government source before making any final decision.'
              )}
            </p>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mt-2 mb-2">{t('চাকরির বিজ্ঞপ্তি সংক্রান্ত', 'On Job Circulars')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'Job Radar-এ প্রকাশিত সকল চাকরির বিজ্ঞপ্তি সরকারি ও বেসরকারি প্রতিষ্ঠানের সরকারি বিজ্ঞপ্তি/পত্রিকা থেকে সংগ্রহ করে সংক্ষিপ্ত ও সহজবোধ্য আকারে উপস্থাপন করা হয়। আমরা কোনো নিয়োগকারী প্রতিষ্ঠান নই এবং কোনো নিয়োগ প্রক্রিয়ায় সরাসরি জড়িত নই। বিজ্ঞপ্তির তথ্যে ভুল বা পরিবর্তন হতে পারে — আবেদনের আগে অনুগ্রহ করে সংশ্লিষ্ট প্রতিষ্ঠানের মূল বিজ্ঞপ্তি বা ওয়েবসাইট থেকে তথ্য যাচাই করে নিন। কোনো ভুল তথ্যের কারণে সৃষ্ট কোনো ক্ষতির জন্য আমরা দায়ী থাকব না।',
              'all job circulars published on Job Radar are collected from official notices/publications of government and private organizations and presented in a summarized, easy-to-read format. We are not a hiring organization and are not directly involved in any recruitment process. Circular details may contain errors or change after publication — please verify with the original notice or the relevant organization\'s official website before applying. We are not liable for any loss arising from inaccurate information.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('স্টাডি কর্নার কনটেন্ট সংক্রান্ত', 'On Study Corner Content')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'স্টাডি কর্নারে প্রকাশিত চাকরির অভিজ্ঞতা এবং ইনস্টিটিউট রিভিউগুলো ব্যবহারকারীদের ব্যক্তিগত মতামত ও অভিজ্ঞতা — এগুলো আমাদের প্ল্যাটফর্মের মতামত নয় এবং এর সত্যতার নিশ্চয়তা আমরা দিতে পারি না। বই মার্কেটপ্লেসে তালিকাভুক্ত বইয়ের অবস্থা ও মূল্য সংশ্লিষ্ট বিক্রেতার দেওয়া তথ্যের ভিত্তিতে — আমরা কোনো লেনদেনের পক্ষ নই।',
              'Job Experience shares and Institute Reviews published in Study Corner reflect the personal opinions and experiences of individual users — they do not represent the views of our platform, and we cannot guarantee their accuracy. Book condition and pricing in the Book Marketplace are as described by the respective seller — we are not a party to any transaction.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('বাহ্যিক লিংক', 'External Links')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আমাদের সাইটে অন্য ওয়েবসাইটের লিংক থাকতে পারে (যেমন নিয়োগকারী প্রতিষ্ঠানের ওয়েবসাইট)। সেই সাইটগুলোর কনটেন্ট বা প্রাইভেসি প্র্যাকটিসের জন্য আমরা দায়ী নই।',
              'our site may contain links to other websites (e.g. an employer\'s official site). We are not responsible for the content or privacy practices of those external sites.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('বিজ্ঞাপন', 'Advertising')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আমাদের সাইটে Google AdSense-এর মাধ্যমে তৃতীয় পক্ষের বিজ্ঞাপন প্রদর্শিত হতে পারে। এই বিজ্ঞাপনগুলোর কনটেন্ট বা পণ্য/সেবার জন্য আমরা দায়ী নই এবং কোনো বিজ্ঞাপনদাতার সাথে আমাদের কোনো অনুমোদন-সম্পর্ক বোঝায় না।',
              'our site may display third-party ads served through Google AdSense. We are not responsible for the content of these ads or the products/services they promote, and their presence does not imply endorsement of any advertiser.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('যোগাযোগ', 'Contact Us')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {t('এই ডিসক্লেইমার সম্পর্কে প্রশ্ন থাকলে যোগাযোগ করুন: ', 'If you have questions about this disclaimer, contact us at: ')}
            <a href="mailto:support@jobradarbd.com" className="text-primary font-semibold hover:underline">support@jobradarbd.com</a>।
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
