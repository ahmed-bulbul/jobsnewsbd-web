import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import T from '@/components/ui/T';
import PdfToJpgConverter from '@/components/tools/PdfToJpgConverter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PDF থেকে JPG কনভার্টার | PDF to JPG Converter — চাকরির খবর',
  description: 'PDF-এর প্রতিটি পৃষ্ঠা JPG বা PNG ছবিতে রূপান্তর করুন — একাধিক পৃষ্ঠা হলে ZIP ফাইলে ডাউনলোড, সম্পূর্ণ বিনামূল্যে | Convert every page of a PDF into a JPG or PNG image — multi-page PDFs download as a ZIP, completely free.',
  alternates: { canonical: '/tools/pdf-to-jpg' },
};

export default function PdfToJpgPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/tools" className="hover:text-primary transition-colors"><T bn="টুলস" en="Tools" /></Link>
          <span>›</span>
          <span className="text-gray-700 font-medium"><T bn="PDF থেকে JPG" en="PDF to JPG" /></span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            <T bn="PDF থেকে JPG কনভার্টার" en="PDF to JPG Converter" />
          </h1>
          <p className="mt-1 text-sm text-warm-muted">
            <T
              bn="PDF-এর প্রতিটি পৃষ্ঠা আলাদা JPG বা PNG ছবিতে রূপান্তর করুন — একাধিক পৃষ্ঠা হলে ZIP ফাইলে ডাউনলোড করুন, সম্পূর্ণ বিনামূল্যে"
              en="Turn every page of a PDF into a separate JPG or PNG image — multi-page PDFs download as a single ZIP, completely free"
            />
          </p>
        </div>

        <PdfToJpgConverter />
      </main>
      <Footer />
    </>
  );
}
