'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function TermsPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('ব্যবহারের শর্তাবলী', 'Terms & Conditions')}</h1>
          <p className="text-xs text-warm-muted mb-8">{t('সর্বশেষ হালনাগাদ: ২৫ জুলাই, ২০২৬', 'Last updated: July 25, 2026')}</p>

          <p className="text-sm text-gray-700 leading-relaxed mb-6">
            {t(
              'jobradarbd.com ওয়েবসাইট বা আমাদের মোবাইল অ্যাপ ব্যবহার করার মাধ্যমে আপনি নিচের শর্তাবলীতে সম্মত হচ্ছেন। অনুগ্রহ করে ব্যবহারের আগে মনোযোগ সহকারে পড়ুন।',
              'By using the jobradarbd.com website or our mobile app, you agree to the following terms. Please read them carefully before using the platform.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('১. সেবার বর্ণনা', '1. Description of Service')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'চাকরির খবর (Job Radar BD) বাংলাদেশের সরকারি ও বেসরকারি চাকরির বিজ্ঞপ্তি একত্রিত করে প্রদর্শন করে এবং চাকরিপ্রার্থীদের জন্য প্রস্তুতি সামগ্রী (মডেল টেস্ট, পরীক্ষা) ও একটি কমিউনিটি এলাকা ("স্টাডি কর্নার") প্রদান করে, যেখানে ব্যবহারকারীরা চাকরির অভিজ্ঞতা শেয়ার করতে, ইনস্টিটিউট রিভিউ লিখতে এবং পুরাতন বই কেনাবেচা করতে পারেন। আমরা চাকরিদাতা নই এবং কোনো নিয়োগ প্রক্রিয়ায় সরাসরি জড়িত নই — আমরা কেবল তথ্য একত্রিত করে প্রদর্শন করি।',
              'Job Radar BD aggregates government and private job circulars in Bangladesh and provides preparation material (model tests, exams) and a community area ("Study Corner") where users can share job experiences, write institute reviews, and buy/sell used preparation books. We are not an employer and are not directly involved in any hiring process — we aggregate and display publicly available information.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('২. অ্যাকাউন্ট', '2. Accounts')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'কিছু সুবিধা ব্যবহার করতে (যেমন স্টাডি কর্নারে পোস্ট করা, বই বিক্রি বা কোর্সে ভর্তি হওয়া) আপনাকে একটি অ্যাকাউন্ট তৈরি করতে হবে। আপনার লগইন তথ্যের গোপনীয়তা রক্ষা করা এবং আপনার অ্যাকাউন্টে সংঘটিত সকল কার্যক্রমের দায়িত্ব আপনার। মিথ্যা তথ্য দিয়ে অ্যাকাউন্ট তৈরি করা নিষিদ্ধ।',
              'to use certain features (such as posting in Study Corner, selling a book, or enrolling in a course) you must create an account. You are responsible for keeping your login credentials confidential and for all activity under your account. Creating an account with false information is prohibited.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৩. ব্যবহারকারীর তৈরি কনটেন্ট', '3. User-Generated Content')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'স্টাডি কর্নারে পোস্ট করা চাকরির অভিজ্ঞতা, ইনস্টিটিউট রিভিউ, এবং বই বিক্রির বিজ্ঞাপন সবই এডমিন কর্তৃক প্রকাশের আগে পর্যালোচনা করা হয়। আপনি নিশ্চিত করবেন যে আপনার পোস্ট করা কনটেন্ট সত্য, আপত্তিকর নয়, এবং কোনো তৃতীয় পক্ষের অধিকার লঙ্ঘন করে না। আমরা যেকোনো কনটেন্ট যেকোনো সময় সরিয়ে ফেলার অধিকার রাখি যদি তা আমাদের নীতিমালা লঙ্ঘন করে।',
              'Job Experience shares, Institute Reviews, and Book Marketplace listings posted in Study Corner are all reviewed by an admin before being published. You agree that content you post is truthful, not offensive, and does not infringe any third party\'s rights. We reserve the right to remove any content at any time if it violates our policies.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৪. বই মার্কেটপ্লেস', '4. Book Marketplace')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'বই মার্কেটপ্লেস কেবল ক্রেতা ও বিক্রেতার মধ্যে যোগাযোগ সহজ করে — প্রকৃত লেনদেন (মূল্য পরিশোধ, বই হস্তান্তর) ব্যবহারকারীদের মধ্যে সরাসরি সম্পন্ন হয়। আমরা কোনো লেনদেনের পক্ষ নই এবং কোনো বিজ্ঞাপনের সত্যতা, বইয়ের অবস্থা, বা লেনদেনের ফলাফলের জন্য দায়ী নই।',
              'the Book Marketplace only facilitates contact between a buyer and a seller — the actual transaction (payment, handover of the book) happens directly between users. We are not a party to any transaction and are not responsible for the accuracy of any listing, the condition of a book, or the outcome of a transaction.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৫. পেমেন্ট ও ভর্তি', '5. Payments & Enrollment')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'পেইড প্রস্তুতি কোর্সে ভর্তির জন্য পেমেন্ট প্রযোজ্য পেমেন্ট চ্যানেলের (যেমন bKash/Nagad) মাধ্যমে সম্পন্ন হয়। ভর্তি এডমিন কর্তৃক যাচাই ও অনুমোদনের পর কার্যকর হয়। রিফান্ড নীতি নির্দিষ্ট কোর্স অনুযায়ী ভিন্ন হতে পারে — বিস্তারিত জানতে যোগাযোগ করুন।',
              'payment for paid preparation courses is made through the applicable payment channel (e.g. bKash/Nagad). Enrollment takes effect once verified and approved by an admin. Refund policies may vary by course — contact us for details.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৬. নিষিদ্ধ কার্যক্রম', '6. Prohibited Activities')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আপনি প্ল্যাটফর্মে মিথ্যা তথ্য প্রচার, হয়রানি, স্প্যাম, বেআইনি কনটেন্ট পোস্ট, বা সিস্টেমে অননুমোদিত প্রবেশের চেষ্টা করতে পারবেন না। এই নিয়ম লঙ্ঘন করলে আপনার অ্যাকাউন্ট স্থগিত বা বাতিল করা হতে পারে।',
              'you may not spread false information, harass others, spam, post illegal content, or attempt unauthorized access to our systems. Violating these rules may result in your account being suspended or terminated.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৭. দায়বদ্ধতার সীমাবদ্ধতা', '7. Limitation of Liability')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আমরা "যেমন আছে" ভিত্তিতে সেবা প্রদান করি এবং চাকরির বিজ্ঞপ্তি বা কনটেন্টের সম্পূর্ণ সঠিকতার নিশ্চয়তা দিই না। যেকোনো চাকরিতে আবেদনের আগে মূল উৎস থেকে বিজ্ঞপ্তি যাচাই করার পরামর্শ দেওয়া হচ্ছে। আইন দ্বারা অনুমোদিত সর্বোচ্চ সীমা পর্যন্ত, আমরা প্ল্যাটফর্ম ব্যবহারের ফলে সৃষ্ট কোনো পরোক্ষ ক্ষতির জন্য দায়ী থাকব না।',
              'we provide the service "as is" and do not guarantee that job circulars or other content are fully accurate. We recommend verifying any circular from its original source before applying. To the maximum extent permitted by law, we are not liable for any indirect damages arising from your use of the platform.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৮. শর্তাবলীর পরিবর্তন', '8. Changes to These Terms')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {t(
              'আমরা প্রয়োজন অনুসারে এই শর্তাবলী পরিবর্তন করতে পারি। পরিবর্তনের পর প্ল্যাটফর্ম ব্যবহার চালিয়ে গেলে তা নতুন শর্তাবলীতে সম্মতি হিসেবে গণ্য হবে।',
              'we may update these terms as needed. Continued use of the platform after a change constitutes your acceptance of the updated terms.'
            )}
          </p>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-2">{t('৯. যোগাযোগ', '9. Contact Us')}</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {t('শর্তাবলী সংক্রান্ত প্রশ্নের জন্য যোগাযোগ করুন: ', 'For questions about these terms, contact us at: ')}
            <a href="mailto:support@jobradarbd.com" className="text-primary font-semibold hover:underline">support@jobradarbd.com</a>।
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
