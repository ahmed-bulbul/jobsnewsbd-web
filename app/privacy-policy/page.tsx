'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function PrivacyPolicyPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('প্রাইভেসি পলিসি', 'Privacy Policy')}</h1>
          <p className="text-xs text-warm-muted mb-8">{t('সর্বশেষ হালনাগাদ: ২৫ জুলাই, ২০২৬', 'Last updated: July 25, 2026')}</p>

          <p className="text-sm text-gray-700 leading-relaxed mb-6">
            {t(
              'Job Radar একটি বাংলাদেশভিত্তিক চাকরির বিজ্ঞপ্তি ও ক্যারিয়ার প্রস্তুতি প্ল্যাটফর্ম, যা jobradarbd.com ওয়েবসাইট ও আমাদের মোবাইল অ্যাপের মাধ্যমে পরিচালিত হয়। আপনার গোপনীয়তা আমাদের কাছে গুরুত্বপূর্ণ। এই প্রাইভেসি পলিসিতে আমরা কী তথ্য সংগ্রহ করি, কীভাবে তা ব্যবহার করি এবং আপনার অধিকার কী তা ব্যাখ্যা করা হয়েছে।',
              'Job Radar is a Bangladesh-based job circular and career preparation platform, operated through the website jobradarbd.com and our mobile app. Your privacy matters to us. This Privacy Policy explains what information we collect, how we use it, and what rights you have.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('১. আমরা যে তথ্য সংগ্রহ করি', '1. Information We Collect')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            {t('অ্যাকাউন্ট তথ্য: ', 'Account information: ')}
            {t(
              'নাম, ইমেইল, ঐচ্ছিক ফোন নম্বর এবং পাসওয়ার্ড (এনক্রিপ্টেড/হ্যাশড অবস্থায় সংরক্ষিত, কখনো প্লেইন টেক্সটে নয়)। আপনি চাইলে Google অ্যাকাউন্ট দিয়েও সাইন-ইন করতে পারেন, যেক্ষেত্রে আমরা Google থেকে আপনার নাম, ইমেইল ও প্রোফাইল ছবি গ্রহণ করি।',
              'name, email, an optional phone number, and password (stored encrypted/hashed, never in plain text). You may also sign in with Google, in which case we receive your name, email, and profile photo from Google.'
            )}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            {t('আপনার তৈরি কনটেন্ট: ', 'Content you create: ')}
            {t(
              'স্টাডি কর্নারে আপনি যদি চাকরির অভিজ্ঞতা, ইনস্টিটিউট রিভিউ, বা পুরাতন বই বিক্রির বিজ্ঞাপন পোস্ট করেন, তাহলে সেই লেখা, ছবি এবং (বই বিক্রির ক্ষেত্রে) যোগাযোগ নম্বর আমরা সংরক্ষণ করি।',
              'if you post a Job Experience share, an Institute Review, or a Book Marketplace listing in Study Corner, we store that text, any photo you upload, and (for book listings) the contact number you provide.'
            )}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            {t('লেনদেন তথ্য: ', 'Enrollment & payment information: ')}
            {t(
              'যদি আপনি কোনো প্রস্তুতি কোর্সে ভর্তি হওয়ার জন্য পেমেন্ট করেন, তাহলে ভর্তি নিশ্চিত করতে প্রয়োজনীয় তথ্য আমরা সংরক্ষণ করি। আমরা আপনার কার্ড নম্বর বা মোবাইল ব্যাংকিং পিন কখনোই সংরক্ষণ করি না — প্রকৃত পেমেন্ট প্রক্রিয়াকরণ সংশ্লিষ্ট পেমেন্ট চ্যানেলের (যেমন bKash/Nagad) মাধ্যমে সরাসরি সম্পন্ন হয়।',
              'if you pay to enroll in a preparation course, we store the information necessary to verify and confirm that enrollment. We never store your card number or mobile-banking PIN — actual payment processing happens directly through the payment channel you use (e.g. bKash/Nagad).'
            )}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            {t('প্রযুক্তিগত তথ্য: ', 'Technical information: ')}
            {t(
              'আপনাকে লগইন অবস্থায় রাখতে অ্যাক্সেস টোকেন ও রিফ্রেশ টোকেন আপনার ডিভাইসে সংরক্ষিত হয়। ভাষা পছন্দ (বাংলা/ইংরেজি) সংরক্ষণ করতেও লোকাল স্টোরেজ ব্যবহার করা হয়। পুশ নোটিফিকেশন পাঠাতে চাইলে ডিভাইস টোকেনও সংরক্ষণ করা হতে পারে।',
              'to keep you signed in, an access token and refresh token are stored on your device. Local storage is also used to remember your language preference (Bengali/English). A device token may be stored if you enable push notifications.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('২. আমরা তথ্য কীভাবে ব্যবহার করি', '2. How We Use Your Information')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আপনার অ্যাকাউন্ট পরিচালনা, লগইন যাচাই (ইমেইল OTP-সহ), নতুন সার্কুলার বা এডমিন-অনুমোদন সংক্রান্ত ইমেইল/পুশ নোটিফিকেশন পাঠানো, স্টাডি কর্নারে আপনার পোস্ট প্রকাশ করা, বই বিক্রির ক্ষেত্রে ক্রেতা-বিক্রেতার মধ্যে যোগাযোগ সহজ করা, এবং প্ল্যাটফর্মের নিরাপত্তা ও অপব্যবহার প্রতিরোধে আমরা এই তথ্য ব্যবহার করি। আমরা আপনার ব্যক্তিগত তথ্য বিক্রি করি না।',
              'we use this information to operate your account, verify sign-in (including email OTP), send email/push notifications about new circulars or admin approvals, publish your Study Corner posts, help connect buyers and sellers in the Book Marketplace, and keep the platform secure and free of abuse. We do not sell your personal information.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৩. কুকি ও স্থানীয় স্টোরেজ', '3. Cookies & Local Storage')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আমরা আপনার সেশন বজায় রাখতে এবং ভাষা পছন্দ মনে রাখতে কুকি ও ব্রাউজার লোকাল স্টোরেজ ব্যবহার করি। এছাড়া, আমাদের ওয়েবসাইটে Google AdSense-এর মাধ্যমে বিজ্ঞাপন প্রদর্শিত হতে পারে। Google এবং তার অংশীদাররা কুকি (যেমন DoubleClick DART কুকি) ব্যবহার করে আপনার এই ও অন্যান্য ওয়েবসাইট ভ্রমণের ভিত্তিতে বিজ্ঞাপন প্রদর্শন করতে পারে। আপনি Google Ads Settings (adssettings.google.com) থেকে ব্যক্তিগতকৃত বিজ্ঞাপন বন্ধ করতে পারেন।',
              'we use cookies and browser local storage to maintain your session and remember your language preference. Our website may also display ads served by Google AdSense. Google and its partners may use cookies (such as the DoubleClick DART cookie) to serve ads based on your visits to this and other websites. You can opt out of personalized advertising at any time via Google Ads Settings (adssettings.google.com).'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৪. তৃতীয় পক্ষের সেবা', '4. Third-Party Services')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আমরা নিম্নলিখিত তৃতীয় পক্ষের সেবা ব্যবহার করি: Google Sign-In (অ্যাকাউন্ট লগইনের জন্য), Google AdSense (বিজ্ঞাপন প্রদর্শনের জন্য), এবং আমাদের নিজস্ব নোটিফিকেশন সিস্টেম (ইমেইল/পুশ নোটিফিকেশন পাঠাতে)। এই সেবাগুলোর নিজস্ব প্রাইভেসি পলিসি রয়েছে এবং আমরা আপনাকে সেগুলো পর্যালোচনা করার পরামর্শ দিই।',
              'we use the following third-party services: Google Sign-In (for account login), Google AdSense (to serve ads), and our own notification system (to send email/push notifications). These services have their own privacy policies, and we encourage you to review them.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৫. তথ্য সংরক্ষণ ও নিরাপত্তা', '5. Data Retention & Security')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আমরা HTTPS এনক্রিপশনের মাধ্যমে ডেটা ট্রান্সমিশন সুরক্ষিত রাখি এবং পাসওয়ার্ড সবসময় হ্যাশড অবস্থায় সংরক্ষণ করি। আপনার তথ্য ততক্ষণ সংরক্ষিত থাকে যতক্ষণ আপনার অ্যাকাউন্ট সক্রিয় থাকে বা আইনি প্রয়োজনে প্রয়োজন হয়।',
              'we protect data in transit using HTTPS encryption and always store passwords in hashed form. Your information is retained as long as your account remains active, or as needed to comply with legal obligations.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৬. আপনার অধিকার', '6. Your Rights')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আপনি আপনার ব্যক্তিগত তথ্য দেখতে, সংশোধন করতে, অথবা আপনার অ্যাকাউন্ট ও সংশ্লিষ্ট তথ্য মুছে ফেলার অনুরোধ করতে পারেন। এই অনুরোধের জন্য যোগাযোগ করুন ',
              'you can view or correct your personal information, or request deletion of your account and associated data. To make such a request, contact us at '
            )}
            <a href="mailto:support@jobradarbd.com" className="text-primary font-semibold hover:underline">support@jobradarbd.com</a>।
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৭. শিশুদের গোপনীয়তা', '7. Children\'s Privacy')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আমাদের প্ল্যাটফর্ম চাকরিপ্রার্থী প্রাপ্তবয়স্কদের জন্য এবং সচেতনভাবে ১৩ বছরের কম বয়সী শিশুদের কাছ থেকে তথ্য সংগ্রহ করে না।',
              'our platform is intended for adult job seekers and we do not knowingly collect information from children under 13.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৮. এই পলিসির পরিবর্তন', '8. Changes to This Policy')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আমরা মাঝে মাঝে এই প্রাইভেসি পলিসি হালনাগাদ করতে পারি। কোনো পরিবর্তন হলে এই পৃষ্ঠায় "সর্বশেষ হালনাগাদ" তারিখসহ প্রকাশ করা হবে।',
              'we may update this Privacy Policy from time to time. Any changes will be posted on this page along with an updated "last updated" date.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৯. যোগাযোগ', '9. Contact Us')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {t('গোপনীয়তা সংক্রান্ত যেকোনো প্রশ্নের জন্য যোগাযোগ করুন: ', 'For any privacy-related questions, contact us at: ')}
            <a href="mailto:support@jobradarbd.com" className="text-primary font-semibold hover:underline">support@jobradarbd.com</a>
            {' '}{t('অথবা', 'or')}{' '}
            <a href="mailto:info@jobradarbd.com" className="text-primary font-semibold hover:underline">info@jobradarbd.com</a>।
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
