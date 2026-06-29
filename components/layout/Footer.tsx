'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-primary-900 text-primary-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary font-bold text-sm">চ</div>
              <span className="font-bold text-white text-lg">চাকরির খবর</span>
            </div>
            <p className="text-sm text-primary-300 leading-relaxed">
              {t(
                'বাংলাদেশের সকল সরকারি ও বেসরকারি চাকরির বিজ্ঞপ্তি এক জায়গায়।',
                'All government and private job circulars in Bangladesh in one place.',
              )}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('দ্রুত লিংক', 'Quick Links')}</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/',     label: t('হোম', 'Home') },
                { href: '/jobs', label: t('সব চাকরি', 'All Jobs') },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-primary-300 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('চাকরির ধরন', 'Job Categories')}</h4>
            <ul className="space-y-2 text-sm text-primary-300">
              <li>🏛️ {t('সরকারি চাকরি', 'Government Jobs')}</li>
              <li>🏦 {t('ব্যাংক চাকরি', 'Bank Jobs')}</li>
              <li>🌿 {t('এনজিও চাকরি', 'NGO Jobs')}</li>
              <li>🏢 {t('বেসরকারি চাকরি', 'Private Jobs')}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-700 mt-10 pt-6 text-center text-xs text-primary-400">
          © {new Date().getFullYear()} চাকরির খবর — Jobs News BD.{' '}
          {t('সর্বস্বত্ব সংরক্ষিত।', 'All rights reserved.')}
        </div>
      </div>
    </footer>
  );
}
