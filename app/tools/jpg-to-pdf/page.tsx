import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import T from '@/components/ui/T';
import ImageToPdfConverter from '@/components/tools/ImageToPdfConverter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JPG থেকে PDF কনভার্টার | JPG to PDF Converter — চাকরির খবর',
  description: 'JPG বা JPEG ছবি সহজে PDF ফাইলে রূপান্তর করুন — একাধিক ছবি এক PDF-এ, সম্পূর্ণ বিনামূল্যে | Convert JPG or JPEG images to a PDF file — combine multiple photos into one PDF, completely free.',
  alternates: { canonical: '/tools/jpg-to-pdf' },
};

export default function JpgToPdfPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/tools" className="hover:text-primary transition-colors"><T bn="টুলস" en="Tools" /></Link>
          <span>›</span>
          <span className="text-gray-700 font-medium"><T bn="JPG থেকে PDF" en="JPG to PDF" /></span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            <T bn="JPG থেকে PDF কনভার্টার" en="JPG to PDF Converter" />
          </h1>
          <p className="mt-1 text-sm text-warm-muted">
            <T
              bn="আপনার JPG বা JPEG ছবি সহজে PDF ফাইলে রূপান্তর করুন — একাধিক ছবি বেছে নিলে একটি PDF-এ যোগ হবে, সম্পূর্ণ বিনামূল্যে"
              en="Turn your JPG or JPEG photos into a PDF file in seconds — pick multiple images and they combine into one PDF, completely free"
            />
          </p>
        </div>

        <ImageToPdfConverter />

        <p className="mt-8 text-xs text-warm-muted text-center">
          <T
            bn="PNG বা WEBP ছবি রূপান্তর করতে চান? দেখুন"
            en="Need to convert PNG or WEBP images instead? See our"
          />{' '}
          <Link href="/tools/png-to-pdf" className="text-primary hover:underline"><T bn="PNG থেকে PDF টুল" en="PNG to PDF tool" /></Link>।
        </p>
      </main>
      <Footer />
    </>
  );
}
