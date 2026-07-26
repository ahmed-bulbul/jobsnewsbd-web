import type { Metadata } from 'next';
import { Noto_Sans_Bengali, Inter } from 'next/font/google';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import AuthModal from '@/components/ui/AuthModal';
import './globals.css';

const notoSansBengali = Noto_Sans_Bengali({
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

const siteUrl = 'https://jobradarbd.com';
const siteTitle = 'চাকরির খবর | Job Radar BD';
const siteDescription = 'বাংলাদেশের সরকারি ও বেসরকারি চাকরির বিজ্ঞপ্তি এক জায়গায়';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteTitle, template: '%s | চাকরির খবর' },
  description: siteDescription,
  keywords: ['সরকারি চাকরি', 'বাংলাদেশ ব্যাংক চাকরি', 'job circular bangladesh', 'bd jobs'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'bn_BD',
    url: siteUrl,
    siteName: 'চাকরির খবর — Job Radar BD',
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'চাকরির খবর — Job Radar BD',
      url: siteUrl,
      sameAs: ['https://www.facebook.com/profile.php?id=61592111810490'],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@jobradarbd.com',
        contactType: 'customer support',
      },
    },
    {
      '@type': 'WebSite',
      name: 'চাকরির খবর — Job Radar BD',
      url: siteUrl,
      inLanguage: 'bn',
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${notoSansBengali.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
