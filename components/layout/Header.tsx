'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const { user, logout, openModal } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/',               label: t('হোম', 'Home') },
    { href: '/jobs',           label: t('সব চাকরি', 'All Jobs') },
    { href: '/study-corner',   label: t('স্টাডি কর্নার', 'Study Corner') },
    { href: '/exam-centers',   label: t('পরীক্ষা কেন্দ্র', 'Exam Centers') },
    { href: '/tools',          label: t('টুলস', 'Tools') },
  ];

  const initials = user?.name
    ? user.name.trim().split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-warm-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group min-w-0 shrink">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden shadow-sm shrink-0">
              <Image src="/logo-mark.svg" alt="Job Radar" width={36} height={36} className="w-full h-full" />
            </div>
            <div className="leading-tight min-w-0">
              <span className="block font-bold text-primary text-sm sm:text-lg whitespace-nowrap">জব রাডার</span>
              <span className="hidden sm:block text-[10px] text-gray-800 -mt-0.5 font-sans font-semibold">Job Radar</span>
            </div>
          </Link>

          {/* Nav — subtle underline indicator instead of a filled pill, so the
              bar reads lighter with five items sitting side by side. */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-2 text-sm font-medium transition-colors ${
                    active ? 'text-primary-700' : 'text-gray-600 hover:text-primary-700'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute left-3.5 right-3.5 -bottom-[1px] h-[2px] rounded-full bg-primary-600 transition-opacity ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-warm-border text-gray-600 hover:border-primary hover:text-primary transition-all"
              aria-label={t('মেনু', 'Menu')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-warm-border text-sm font-medium text-gray-700 hover:border-primary hover:text-primary transition-all"
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
            >
              <span className="text-base">{lang === 'bn' ? '🇧🇩' : '🇬🇧'}</span>
              <span className="font-sans text-xs hidden sm:inline">{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
            </button>

            {user ? (
              /* Logged-in user avatar + dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-warm-border hover:border-primary transition-all"
                >
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                    {user.photoUrl
                      ? <Image src={user.photoUrl} alt={initials} width={28} height={28} className="object-cover w-full h-full" />
                      : initials}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate hidden sm:block">
                    {user.name || user.email}
                  </span>
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-warm-border py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-warm-border">
                      <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
                      <p className="text-xs text-warm-muted truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-cream transition-colors"
                    >
                      <svg className="w-4 h-4 text-warm-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t('আমার প্রোফাইল', 'My profile')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t('লগআউট করুন', 'Logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Guest: login + register — hidden on narrow mobile, moved into the hamburger panel there */
              <div className="hidden md:flex items-center gap-2">
                <button onClick={() => openModal('login')} className="btn-outline text-sm px-4 py-2 whitespace-nowrap">
                  {t('লগইন', 'Login')}
                </button>
                <button onClick={() => openModal('register')} className="btn-primary text-sm px-4 py-2 whitespace-nowrap">
                  {t('নিবন্ধন', 'Register')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile nav — collapsible panel */}
        {mobileMenuOpen && (
          <nav className="md:hidden flex flex-col gap-1 pb-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  (link.href === '/' ? pathname === '/' : pathname.startsWith(link.href))
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:text-primary hover:bg-primary-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Guest auth actions — only shown here on mobile, where the top row hides them */}
            {!user && (
              <div className="flex items-center gap-2 mt-2 pt-3 border-t border-warm-border">
                <button
                  onClick={() => { setMobileMenuOpen(false); openModal('login'); }}
                  className="btn-outline flex-1 justify-center text-sm py-2"
                >
                  {t('লগইন', 'Login')}
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); openModal('register'); }}
                  className="btn-primary flex-1 justify-center text-sm py-2"
                >
                  {t('নিবন্ধন', 'Register')}
                </button>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
