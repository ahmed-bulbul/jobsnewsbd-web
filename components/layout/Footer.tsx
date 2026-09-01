'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-primary-900 text-primary-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                <Image src="/logo-mark.png" alt="Job Radar" width={36} height={36} className="w-full h-full object-cover" />
              </div>
              <div className="leading-tight">
                <span className="block font-bold text-white text-base">জব রাডার</span>
                <span className="block text-[10px] text-primary-300 -mt-0.5">Job Radar</span>
              </div>
            </div>
            <p className="text-sm text-primary-300 leading-relaxed mb-4">
              {t(
                'বাংলাদেশের সকল সরকারি ও বেসরকারি চাকরির বিজ্ঞপ্তি এক জায়গায়।',
                'All government and private job circulars in Bangladesh in one place.',
              )}
            </p>
            <div className="flex items-center gap-2">
              <a
                href="https://www.facebook.com/profile.php?id=61592111810490"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M13.5 21v-8.5h2.85l.43-3.3h-3.28V7.05c0-.96.27-1.61 1.64-1.61h1.75V2.5C16.6 2.4 15.6 2.3 14.44 2.3c-2.42 0-4.08 1.48-4.08 4.19v2.71H7.5v3.3h2.86V21h3.14z"/></svg>
              </a>
              <a
                href="https://www.youtube.com/@JobRadarBangladesh"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.75 15.5v-7l6.27 3.5-6.27 3.5Z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('দ্রুত লিংক', 'Quick Links')}</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/',     label: t('হোম', 'Home') },
                { href: '/jobs', label: t('সব চাকরি', 'All Jobs') },
                { href: '/study-corner', label: t('স্টাডি কর্নার', 'Study Corner') },
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
              {[
                { bn: 'সরকারি চাকরি', en: 'Government Jobs' },
                { bn: 'ব্যাংক চাকরি', en: 'Bank Jobs' },
                { bn: 'এনজিও চাকরি', en: 'NGO Jobs' },
                { bn: 'বেসরকারি চাকরি', en: 'Private Jobs' },
              ].map((c) => (
                <li key={c.en} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary-400 shrink-0" />
                  {t(c.bn, c.en)}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('কোম্পানি', 'Company')}</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/about',          label: t('আমাদের সম্পর্কে', 'About Us') },
                { href: '/contact',        label: t('যোগাযোগ', 'Contact') },
                { href: '/privacy-policy', label: t('প্রাইভেসি পলিসি', 'Privacy Policy') },
                { href: '/terms',          label: t('ব্যবহারের শর্তাবলী', 'Terms & Conditions') },
                { href: '/disclaimer',     label: t('ডিসক্লেইমার', 'Disclaimer') },
                { href: '/account-deletion', label: t('অ্যাকাউন্ট মুছে ফেলুন', 'Delete Account') },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-primary-300 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-700 mt-10 pt-6 text-center text-xs text-primary-400">
          © {new Date().getFullYear()} Job Radar.{' '}
          {t('সর্বস্বত্ব সংরক্ষিত।', 'All rights reserved.')}
        </div>
      </div>
    </footer>
  );
}
