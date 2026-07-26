import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import T from '@/components/ui/T';
import ImageToPdfConverter from '@/components/tools/ImageToPdfConverter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ছবি থেকে PDF | Image to PDF Converter — চাকরির খবর',
  description: 'একাধিক JPG, PNG বা WEBP ছবি একসাথে PDF ফাইলে রূপান্তর করুন — সম্পূর্ণ বিনামূল্যে, কোনো আপলোড ছাড়াই | Combine multiple JPG, PNG or WEBP images into one PDF file — free, right in your browser.',
  alternates: { canonical: '/tools/image-to-pdf' },
};

export default function ImageToPdfPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/tools" className="hover:text-primary transition-colors"><T bn="টুলস" en="Tools" /></Link>
          <span>›</span>
          <span className="text-gray-700 font-medium"><T bn="ছবি থেকে PDF" en="Image to PDF" /></span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            <T bn="ছবি থেকে PDF কনভার্টার" en="Image to PDF Converter" />
          </h1>
          <p className="mt-1 text-sm text-warm-muted">
            <T
              bn="একাধিক JPG, PNG বা WEBP ছবি একসাথে একটি PDF ফাইলে রূপান্তর করুন — সম্পূর্ণ বিনামূল্যে, কোনো আপলোড নেই"
              en="Combine multiple JPG, PNG or WEBP images into a single PDF file — completely free, nothing is uploaded"
            />
          </p>
        </div>

        <ImageToPdfConverter />
      </main>
      <Footer />
    </>
  );
}
