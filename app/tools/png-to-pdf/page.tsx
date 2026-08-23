import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import T from '@/components/ui/T';
import ImageToPdfConverter from '@/components/tools/ImageToPdfConverter';
import ToolFaq from '@/components/tools/ToolFaq';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PNG থেকে PDF কনভার্টার | PNG to PDF Converter — Job Radar',
  description: 'PNG ছবি সহজে PDF ফাইলে রূপান্তর করুন — একাধিক ছবি এক PDF-এ, স্বচ্ছ ব্যাকগ্রাউন্ড সাপোর্টেড, সম্পূর্ণ বিনামূল্যে | Convert PNG images to a PDF file — transparent backgrounds supported, completely free.',
  alternates: { canonical: '/tools/png-to-pdf' },
};

const faqItems = [
  {
    qBn: 'PNG ছবির স্বচ্ছ (transparent) ব্যাকগ্রাউন্ড PDF-এ কেমন দেখাবে?',
    qEn: 'How will a PNG\'s transparent background look in the PDF?',
    aBn: 'PDF পৃষ্ঠা সবসময় সাদা ব্যাকগ্রাউন্ডের হয়, তাই ছবির স্বচ্ছ অংশগুলো PDF-এ সাদা রঙ হিসেবে দেখাবে — এটি স্বাভাবিক আচরণ, কোনো ত্রুটি নয়।',
    aEn: 'PDF pages always have a white background, so the transparent parts of your PNG will appear as white in the PDF — this is expected behavior, not a bug.',
  },
  {
    qBn: 'আমার ছবি কি কোথাও আপলোড বা সংরক্ষিত হয়?',
    qEn: 'Are my images uploaded or stored anywhere?',
    aBn: 'না — পুরো রূপান্তর প্রক্রিয়া আপনার ব্রাউজারের ভেতরেই সম্পন্ন হয়, ছবি কখনো কোনো সার্ভারে পাঠানো হয় না।',
    aEn: 'No — the whole conversion happens right inside your browser; your images are never sent to any server.',
  },
  {
    qBn: 'স্ক্রিনশট বা স্ক্যান করা PNG ফাইলও কি PDF-এ রূপান্তর করা যাবে?',
    qEn: 'Can I convert screenshots or scanned PNG files too?',
    aBn: 'হ্যাঁ — যেকোনো PNG ফাইল কাজ করবে, সেটা স্ক্রিনশট, স্ক্যান করা কাগজ বা ডিজাইন ফাইল যাই হোক না কেন।',
    aEn: 'Yes — any PNG works, whether it\'s a screenshot, a scanned document, or a design export.',
  },
];

export default function PngToPdfPage() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/tools" className="hover:text-primary transition-colors"><T bn="টুলস" en="Tools" /></Link>
          <span>›</span>
          <span className="text-gray-700 font-medium"><T bn="PNG থেকে PDF" en="PNG to PDF" /></span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            <T bn="PNG থেকে PDF কনভার্টার" en="PNG to PDF Converter" />
          </h1>
          <p className="mt-1 text-sm text-warm-muted">
            <T
              bn="আপনার PNG ছবি সহজে PDF ফাইলে রূপান্তর করুন — একাধিক ছবি বেছে নিলে একটি PDF-এ যোগ হবে, সম্পূর্ণ বিনামূল্যে"
              en="Turn your PNG images into a PDF file in seconds — pick multiple images and they combine into one PDF, completely free"
            />
          </p>
        </div>

        <ImageToPdfConverter />

        <p className="mt-8 text-xs text-warm-muted text-center">
          <T
            bn="JPG ছবি রূপান্তর করতে চান? দেখুন"
            en="Need to convert JPG images instead? See our"
          />{' '}
          <Link href="/tools/jpg-to-pdf" className="text-primary hover:underline"><T bn="JPG থেকে PDF টুল" en="JPG to PDF tool" /></Link>।
        </p>

        <ToolFaq items={faqItems} />
      </main>
      <Footer />
    </>
  );
}
