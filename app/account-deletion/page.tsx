'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function AccountDeletionPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t('অ্যাকাউন্ট ও ডেটা মুছে ফেলার অনুরোধ', 'Request Account & Data Deletion')}
          </h1>
          <p className="text-xs text-warm-muted mb-8">
            {t('সর্বশেষ হালনাগাদ: ২৬ আগস্ট, ২০২৬', 'Last updated: August 26, 2026')}
          </p>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'Job Radar BD-তে আপনার অ্যাকাউন্ট এবং সংশ্লিষ্ট ব্যক্তিগত তথ্য মুছে ফেলার সম্পূর্ণ অধিকার আপনার রয়েছে। বর্তমানে এই অনুরোধটি ইমেইলের মাধ্যমে করা যায় — নিচে ধাপগুলো দেওয়া হলো।',
              'You have full control to request deletion of your Job Radar BD account and associated personal data. This request is currently handled by email — the steps are below.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">
            {t('যেভাবে অনুরোধ করবেন', 'How to request deletion')}
          </h2>
          <ol className="text-sm text-gray-700 leading-relaxed mb-4 list-decimal list-inside space-y-2">
            <li>
              {t(
                'আপনার Job Radar BD অ্যাকাউন্টে নিবন্ধিত ইমেইল ঠিকানা থেকে ',
                'Send an email from the address registered on your Job Radar BD account to '
              )}
              <a href="mailto:support@jobradarbd.com" className="text-primary font-semibold hover:underline">support@jobradarbd.com</a>
              {t(' এ ইমেইল পাঠান।', '.')}
            </li>
            <li>
              {t('বিষয় লাইনে লিখুন: ', 'Use the subject line: ')}
              <span className="font-semibold text-gray-900">
                {t('"অ্যাকাউন্ট মুছে ফেলার অনুরোধ"', '"Account Deletion Request"')}
              </span>
            </li>
            <li>
              {t(
                'মেইলের মূল অংশে আপনার নিবন্ধিত নাম ও ফোন নম্বর (যদি থাকে) উল্লেখ করুন, যাতে আমরা আপনার অ্যাকাউন্ট শনাক্ত করতে পারি।',
                'In the body, include your registered name and phone number (if any) so we can identify and verify your account.'
              )}
            </li>
            <li>
              {t(
                'আমরা যাচাই করে সাধারণত ৩০ দিনের মধ্যে আপনার অ্যাকাউন্ট ও তথ্য মুছে ফেলি এবং একটি নিশ্চিতকরণ ইমেইল পাঠাই।',
                'After verification, we typically delete your account and data within 30 days and send a confirmation email.'
              )}
            </li>
          </ol>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">
            {t('কোন তথ্য মুছে ফেলা হয়', 'What gets deleted')}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'অনুরোধ যাচাই হওয়ার পর আমরা মুছে ফেলি: আপনার প্রোফাইল তথ্য (নাম, ইমেইল, ফোন নম্বর, ছবি), সংরক্ষিত চাকরির তালিকা, নোটিফিকেশন সেটিংস এবং ডিভাইস টোকেন।',
              'Once verified, we delete: your profile information (name, email, phone number, photo), saved jobs, notification settings, and device token.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">
            {t('কোন তথ্য কিছুদিন রাখা হতে পারে', 'What may be retained, and why')}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'জালিয়াতি প্রতিরোধ ও প্ল্যাটফর্মের নিরাপত্তার জন্য পরীক্ষার ফলাফল বা বই কেনাবেচার অর্ডার সংক্রান্ত রেকর্ড সীমিত সময়ের জন্য (সাধারণত ৯০ দিন পর্যন্ত) অ্যানোনিমাইজড আকারে রাখা হতে পারে, এরপর স্থায়ীভাবে মুছে ফেলা হয়। আইন দ্বারা নির্দিষ্টভাবে বাধ্যতামূলক না হলে অন্য কোনো ব্যক্তিগত তথ্য রাখা হয় না।',
              'For fraud prevention and platform integrity, records related to exam results or book marketplace orders may be retained in anonymized form for a limited period (typically up to 90 days), after which they are permanently deleted. No other personal data is retained unless specifically required by law.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">
            {t('আরও প্রশ্ন থাকলে', 'Questions')}
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {t(
              'ডেটা প্রাইভেসি সংক্রান্ত আরও তথ্যের জন্য আমাদের ',
              'For more on how we handle your data, see our '
            )}
            <Link href="/privacy-policy" className="text-primary font-semibold hover:underline">
              {t('প্রাইভেসি পলিসি', 'Privacy Policy')}
            </Link>
            {t(' দেখুন, অথবা সরাসরি যোগাযোগ করুন ', ' or reach out directly at ')}
            <a href="mailto:support@jobradarbd.com" className="text-primary font-semibold hover:underline">support@jobradarbd.com</a>।
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
