import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import T from '@/components/ui/T';
import ImageToPdfConverter from '@/components/tools/ImageToPdfConverter';
import ToolFaq from '@/components/tools/ToolFaq';
import type { Metadata } from 'next';

const faqItems = [
  {
    qBn: 'এই টুলটি কি নিরাপদ? আমার ছবি কি কোথাও আপলোড হয়?',
    qEn: 'Is this tool safe? Are my images uploaded anywhere?',
    aBn: 'সম্পূর্ণ নিরাপদ — সব প্রসেসিং আপনার ব্রাউজারেই হয়, কোনো ছবি সার্ভারে পাঠানো হয় না।',
    aEn: 'Completely safe — all processing happens right in your browser; no image is ever sent to a server.',
  },
  {
    qBn: 'একসাথে কতগুলো ছবি PDF-এ রূপান্তর করা যাবে?',
    qEn: 'How many images can I convert at once?',
    aBn: 'যত খুশি তত ছবি যোগ করতে পারবেন — শুধু আপনার ব্রাউজারের মেমরির উপর সীমাবদ্ধতা নির্ভর করে; সাধারণত ২০-৩০টি ছবি নিয়ে কোনো সমস্যা হয় না।',
    aEn: 'Add as many as you like — the only limit is your browser\'s memory; 20-30 images at once is typically no problem at all.',
  },
  {
    qBn: 'ছবির ক্রম পরিবর্তন করা যাবে কি?',
    qEn: 'Can I change the order of the pages?',
    aBn: 'হ্যাঁ — প্রতিটি ছবির পাশে উপরে/নিচে বাটন দিয়ে ক্রম সাজাতে পারবেন, এবং PDF ঠিক সেই ক্রম অনুযায়ী তৈরি হবে।',
    aEn: 'Yes — use the up/down arrows next to each image to reorder them, and the PDF pages will follow that exact order.',
  },
  {
    qBn: 'কোন কোন ছবির ফরম্যাট সাপোর্ট করে?',
    qEn: 'Which image formats are supported?',
    aBn: 'JPG, PNG এবং WEBP সাপোর্ট করে — একই ব্যাচে বিভিন্ন ফরম্যাট মিশিয়েও আপলোড করা যায়।',
    aEn: 'JPG, PNG and WEBP are all supported — you can even mix different formats in the same batch.',
  },
];

export const metadata: Metadata = {
  title: 'ছবি থেকে PDF | Image to PDF Converter — Job Radar',
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
        <ToolFaq items={faqItems} />
      </main>
      <Footer />
    </>
  );
}
