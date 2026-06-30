import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'টুলস — চাকরির খবর',
  description: 'সরকারি চাকরির আবেদনে কাজে লাগে এমন বিনামূল্যের অনলাইন টুলস',
};

const TOOLS = [
  {
    href: '/tools/image-resizer',
    icon: '🖼️',
    titleBn: 'ছবি রিসাইজার',
    titleEn: 'Image Resizer',
    descBn: 'সরকারি চাকরির ফর্মের জন্য ছবি ও স্বাক্ষর নির্দিষ্ট সাইজে কমান — পাসপোর্ট সাইজ ৩০০×৩০০, স্বাক্ষর ৩০০×৮০',
    descEn: 'Resize your photo & signature to exact govt job specs — 300×300 passport, 300×80 signature',
    available: true,
    badge: 'নতুন',
  },
  {
    href: '/tools/age-calculator',
    icon: '🎂',
    titleBn: 'বয়স ক্যালকুলেটর',
    titleEn: 'Age Calculator',
    descBn: 'জন্মতারিখ দিন, জানুন আপনি কোন সরকারি চাকরিতে আবেদনের যোগ্য — BCS, ব্যাংক, সেনাবাহিনী সহ ৮টি ক্যাটাগরি',
    descEn: 'Enter your date of birth and see which govt jobs you are eligible for — BCS, bank, army and more',
    available: true,
    badge: 'নতুন',
  },
  {
    href: '/tools/info-store',
    icon: '📋',
    titleBn: 'তথ্য সংরক্ষণ',
    titleEn: 'Info Store',
    descBn: 'আপনার NID, জন্মতারিখ, ঠিকানা একবার সেভ করুন — যেকোনো আবেদনে দ্রুত কপি করুন',
    descEn: 'Save your NID, DOB, address once — quickly copy into any application form',
    available: false,
  },
];

export default function ToolsPage() {
  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">টুলস <span className="font-sans text-gray-500 font-normal text-lg">/ Tools</span></h1>
          <p className="mt-2 text-warm-muted text-sm">
            সরকারি চাকরির আবেদনে যা যা লাগে — সব এক জায়গায়, বিনামূল্যে
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((tool) => (
            <div key={tool.href} className="relative">
              {tool.available ? (
                <Link
                  href={tool.href}
                  className="card p-6 flex flex-col gap-3 hover:border-primary hover:shadow-md transition-all group h-full block"
                >
                  <ToolCard tool={tool} />
                </Link>
              ) : (
                <div className="card p-6 flex flex-col gap-3 opacity-60 cursor-not-allowed h-full">
                  <ToolCard tool={tool} />
                  <span className="mt-auto text-xs font-medium text-warm-muted bg-cream px-2.5 py-1 rounded-full w-fit">
                    শীঘ্রই আসছে
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

function ToolCard({ tool }: { tool: typeof TOOLS[number] }) {
  return (
    <>
      <div className="flex items-start justify-between">
        <span className="text-4xl">{tool.icon}</span>
        {tool.badge && (
          <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
            {tool.badge}
          </span>
        )}
      </div>
      <div>
        <h2 className="font-bold text-gray-900 text-base group-hover:text-primary transition-colors">
          {tool.titleBn}
          <span className="font-sans font-normal text-warm-muted text-xs ml-1.5">{tool.titleEn}</span>
        </h2>
        <p className="text-sm text-warm-muted mt-1.5 leading-relaxed">{tool.descBn}</p>
      </div>
    </>
  );
}
