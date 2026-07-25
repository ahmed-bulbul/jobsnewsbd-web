'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('যোগাযোগ করুন', 'Contact Us')}</h1>
          <p className="text-sm text-warm-muted mb-8">
            {t(
              'কোনো প্রশ্ন, সমস্যা বা মতামত থাকলে নিচের ঠিকানায় ইমেইল করুন — আমরা যত দ্রুত সম্ভব উত্তর দেওয়ার চেষ্টা করি।',
              'Have a question, an issue, or feedback? Email us at either address below — we try to respond as quickly as we can.'
            )}
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-gray-50 rounded-xl px-4 py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">🛟</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('সাপোর্ট (অ্যাকাউন্ট, বিজ্ঞাপন, বই মার্কেটপ্লেস সংক্রান্ত সহায়তা)', 'Support (account, listings, marketplace help)')}</p>
                <a href="mailto:support@jobradarbd.com" className="text-primary font-semibold hover:underline text-sm">support@jobradarbd.com</a>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-gray-50 rounded-xl px-4 py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">✉️</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('সাধারণ ও ব্যবসায়িক যোগাযোগ', 'General & business inquiries')}</p>
                <a href="mailto:info@jobradarbd.com" className="text-primary font-semibold hover:underline text-sm">info@jobradarbd.com</a>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-gray-50 rounded-xl px-4 py-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">📘</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t('ফেসবুক পেজ', 'Facebook Page')}</p>
                <a href="https://www.facebook.com/profile.php?id=61592111810490" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline text-sm">
                  {t('জব রাডার বিডি — ফেসবুকে দেখুন', 'Job Radar BD on Facebook')}
                </a>
              </div>
            </div>
          </div>

          <p className="text-xs text-warm-muted mt-8">
            {t(
              'গোপনীয়তা সংক্রান্ত অনুরোধের জন্য দেখুন আমাদের ',
              'For privacy-related requests, see our '
            )}
            <Link href="/privacy-policy" className="text-primary hover:underline">{t('প্রাইভেসি পলিসি', 'Privacy Policy')}</Link>।
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
