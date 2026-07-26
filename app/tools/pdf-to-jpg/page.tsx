import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import T from '@/components/ui/T';
import PdfToJpgConverter from '@/components/tools/PdfToJpgConverter';
import ToolFaq from '@/components/tools/ToolFaq';
import type { Metadata } from 'next';

const faqItems = [
  {
    qBn: 'একাধিক পৃষ্ঠার PDF হলে ডাউনলোড কীভাবে হবে?',
    qEn: 'How does download work for a multi-page PDF?',
    aBn: 'প্রতিটি পৃষ্ঠা আলাদা ছবি হিসেবে তৈরি হয়। একটি মাত্র পৃষ্ঠা হলে সরাসরি সেই ছবি ডাউনলোড হবে; একাধিক পৃষ্ঠা হলে সবগুলো ছবি একটি ZIP ফাইলে বান্ডল করে ডাউনলোড হবে।',
    aEn: 'Every page becomes its own image. If there\'s only one page, it downloads directly; if there are multiple, all the images bundle into a single ZIP file.',
  },
  {
    qBn: 'JPG নাকি PNG — কোনটা বেছে নেব?',
    qEn: 'Should I choose JPG or PNG?',
    aBn: 'সাধারণ ব্যবহারের জন্য JPG ভালো — ফাইল সাইজ ছোট হয়। ছবিতে স্বচ্ছতা বা লেখা/গ্রাফের ধারালো মান দরকার হলে PNG বেছে নিন।',
    aEn: 'JPG is a good default — smaller file size. Choose PNG if you need transparency or the sharpest possible text/graphics quality.',
  },
  {
    qBn: 'ছবির মান বা রেজোলিউশন কেমন হবে?',
    qEn: 'What quality or resolution will the images be?',
    aBn: 'প্রতিটি পৃষ্ঠা উচ্চ রেজোলিউশনে (মূল আকারের প্রায় দ্বিগুণ স্কেলে) রেন্ডার হয়, তাই প্রিন্ট করা বা জুম করে দেখার জন্যও যথেষ্ট স্পষ্ট থাকে।',
    aEn: 'Every page renders at roughly 2x scale, so the output stays sharp enough for printing or zooming in.',
  },
  {
    qBn: 'আমার PDF কি কোথাও আপলোড হয়?',
    qEn: 'Is my PDF uploaded anywhere?',
    aBn: 'না — রূপান্তর সম্পূর্ণভাবে আপনার ব্রাউজারে হয়, PDF ফাইলটি কখনো কোনো সার্ভারে যায় না।',
    aEn: 'No — the conversion happens entirely in your browser; the PDF file never reaches any server.',
  },
];

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
        <ToolFaq items={faqItems} />
      </main>
      <Footer />
    </>
  );
}
