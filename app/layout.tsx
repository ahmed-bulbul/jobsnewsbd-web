import type { Metadata } from 'next';
import { Hind_Siliguri, Inter } from 'next/font/google';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import AuthModal from '@/components/ui/AuthModal';
import './globals.css';

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-hind',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'চাকরির খবর | Job Radar BD', template: '%s | চাকরির খবর' },
  description: 'বাংলাদেশের সরকারি ও বেসরকারি চাকরির বিজ্ঞপ্তি এক জায়গায়',
  keywords: ['সরকারি চাকরি', 'বাংলাদেশ ব্যাংক চাকরি', 'job circular bangladesh', 'bd jobs'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          <LanguageProvider>
            {children}
            <AuthModal />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
