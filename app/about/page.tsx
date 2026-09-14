'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('আমাদের সম্পর্কে', 'About Us')}</h1>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'Job Radar একটি বাংলাদেশভিত্তিক চাকরির বিজ্ঞপ্তি ও ক্যারিয়ার প্রস্তুতি প্ল্যাটফর্ম। আমাদের লক্ষ্য হলো সরকারি, বেসরকারি, ব্যাংক ও এনজিও চাকরির বিজ্ঞপ্তি এক জায়গায় সহজবোধ্য ও নির্ভরযোগ্যভাবে চাকরিপ্রার্থীদের কাছে পৌঁছে দেওয়া, এবং পরীক্ষা প্রস্তুতিতে সহায়তা করা।',
              'Job Radar is a Bangladesh-based job circular and career preparation platform. Our goal is to bring government, private, bank, and NGO job circulars together in one place — presented clearly and reliably for job seekers — while also helping them prepare for exams.'
            )}
          </p>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'শুধু বিজ্ঞপ্তি প্রকাশের বাইরেও, আমরা "স্টাডি কর্নার" নামে একটি কমিউনিটি এলাকা তৈরি করেছি, যেখানে চাকরিপ্রার্থীরা একে অপরের সাথে চাকরির আবেদন ও ইন্টারভিউ অভিজ্ঞতা শেয়ার করতে পারেন, বিভিন্ন কোচিং সেন্টার ও ইনস্টিটিউট সম্পর্কে রিভিউ পড়তে ও লিখতে পারেন, এবং পুরাতন প্রস্তুতির বই কেনাবেচা করতে পারেন — যাতে প্রস্তুতির যাত্রাটা একা না হয়ে একটি সহায়ক কমিউনিটির অংশ হয়ে ওঠে।',
              'beyond just publishing circulars, we\'ve built a community area called "Study Corner," where job seekers can share their application and interview experiences with each other, read and write reviews of coaching centers and institutes, and buy or sell used preparation books — so the preparation journey feels less like something you do alone, and more like something a supportive community goes through together.'
            )}
          </p>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আমরা একটি ছোট দল হিসেবে এই প্ল্যাটফর্মটি তৈরি ও পরিচালনা করি, এবং প্রতিটি চাকরির বিজ্ঞপ্তি ও কমিউনিটি পোস্ট প্রকাশের আগে মান বজায় রাখতে যাচাই-বাছাই করার চেষ্টা করি।',
              'we are a small team building and running this platform, and we make an effort to review job circulars and community posts for quality before they go live.'
            )}
          </p>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-4">
            <p className="text-sm text-amber-900 leading-relaxed">
              {t(
                'Job Radar কোনো সরকারি প্রতিষ্ঠান নয় এবং বাংলাদেশ সরকারের কোনো মন্ত্রণালয়/দপ্তরের সাথে আনুষ্ঠানিকভাবে সম্পৃক্ত বা অনুমোদিত নয়। এটি একটি স্বতন্ত্র বেসরকারি প্ল্যাটফর্ম যা সরকারি চাকরির বিজ্ঞপ্তি সংশ্লিষ্ট প্রতিষ্ঠানের অফিসিয়াল ওয়েবসাইট ও প্রজ্ঞাপন থেকে সংগ্রহ করে উপস্থাপন করে। বিস্তারিত জানতে দেখুন আমাদের ',
                'Job Radar is not a government entity and is not officially affiliated with or endorsed by the Government of Bangladesh or any of its ministries/departments. It is an independent, privately-run platform that collects and presents government job circulars from the respective organizations\' official websites and notices. See our '
              )}
              <Link href="/disclaimer" className="font-semibold underline">{t('ডিসক্লেইমার পাতা', 'Disclaimer page')}</Link>{t('।', '.')}
            </p>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('যোগাযোগ', 'Get in Touch')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {t('কোনো পরামর্শ, প্রশ্ন বা সহযোগিতার প্রস্তাব থাকলে আমাদের সাথে যোগাযোগ করুন: ', 'If you have suggestions, questions, or a partnership proposal, reach out to us at: ')}
            <a href="mailto:info@jobradarbd.com" className="text-primary font-semibold hover:underline">info@jobradarbd.com</a>
            {' '}{t('অথবা দেখুন আমাদের', 'or visit our')}{' '}
            <Link href="/contact" className="text-primary font-semibold hover:underline">{t('যোগাযোগ পাতা', 'Contact page')}</Link>।
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
