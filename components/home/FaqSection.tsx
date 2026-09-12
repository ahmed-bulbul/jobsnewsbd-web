import Link from 'next/link';
import T from '@/components/ui/T';

const FAQS = [
  {
    qBn: 'জব রাডার ব্যবহার করতে কি টাকা লাগে?',
    qEn: 'Is Job Radar free to use?',
    aBn: 'না, চাকরির বিজ্ঞপ্তি দেখা, সার্কুলার PDF পড়া, এবং বেশিরভাগ টুলস ও কনটেন্ট সম্পূর্ণ বিনামূল্যে। অ্যাকাউন্ট তৈরি করলে অতিরিক্ত সুবিধা যেমন নোটিফিকেশন ও প্রিয় তালিকা পাওয়া যায়।',
    aEn: 'Yes — browsing job circulars, reading circular PDFs, and most tools and content are completely free. Creating an account unlocks extras like notifications and saved-job lists.',
  },
  {
    qBn: 'নতুন বিজ্ঞপ্তি কত সময়ের মধ্যে যোগ হয়?',
    qEn: 'How quickly are new circulars added?',
    aBn: 'প্রতিদিন সরকারি, বেসরকারি, ব্যাংক ও এনজিও প্রতিষ্ঠানের নতুন বিজ্ঞপ্তি যোগ করা হয়। নোটিফিকেশন চালু রাখলে নতুন পোস্ট হওয়ার সাথে সাথে জানতে পারবেন।',
    aEn: 'Government, private, bank and NGO circulars are added every day. Turn on notifications to get alerted the moment a new one is posted.',
  },
  {
    qBn: 'আবেদনের শেষ তারিখের রিমাইন্ডার কীভাবে পাব?',
    qEn: 'How do I get a reminder before the application deadline?',
    aBn: 'মোবাইল অ্যাপে নোটিফিকেশন চালু রাখলে ডেডলাইন ঘনিয়ে আসলে পুশ নোটিফিকেশন পাবেন, আর প্রতিটি বিজ্ঞপ্তির পাতায় থাকা কাউন্টডাউন/ডেডলাইন টিকার দেখেও বাকি সময় বুঝতে পারবেন।',
    aEn: "Turn on notifications in the mobile app to get a push alert as the deadline approaches, and check the countdown/deadline ticker on each listing's page to see the time remaining at a glance.",
  },
  {
    qBn: 'লাইভ পরীক্ষায় অংশ নিতে কি নিবন্ধন লাগবে?',
    qEn: 'Do I need to register to take a live exam?',
    aBn: 'হ্যাঁ, পরীক্ষা শুরু করতে এবং ফলাফল দেখতে লগইন করতে হবে। এটি নিশ্চিত করে যে প্রতিটি পরীক্ষার ফলাফল সঠিকভাবে আপনার প্রোফাইলে সংরক্ষিত থাকে।',
    aEn: 'Yes, logging in is required to start an exam and see your result — this keeps every attempt correctly saved to your own profile.',
  },
  {
    qBn: 'কোনো তথ্য ভুল দেখলে কী করব?',
    qEn: 'What should I do if I see incorrect information?',
    aBn: 'যেকোনো পাতায় থাকা ফিডব্যাক বাটন থেকে সরাসরি জানাতে পারেন, অথবা আমাদের যোগাযোগ পাতা ব্যবহার করে বিস্তারিত লিখে পাঠাতে পারেন। আমরা যত দ্রুত সম্ভব সংশোধন করি।',
    aEn: 'You can report it directly using the feedback button available on any page, or send details through our Contact page. We correct verified errors as quickly as possible.',
  },
];

// Native <details>/<summary> accordion — zero client JS, works with
// JavaScript disabled, and the FAQPage JSON-LD below targets AI answer
// engines and voice search alongside classic SEO.
export default function FaqSection() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.qEn,
      acceptedAnswer: { '@type': 'Answer', text: f.aEn },
    })),
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">
        {/* Left: plain text intro + help-center CTA */}
        <div>
          <h2 className="section-title mb-4">
            <T bn="সচরাচর জিজ্ঞাসিত প্রশ্ন" en="Frequently Asked Questions" />
          </h2>
          <p className="text-sm text-warm-muted leading-relaxed mb-6">
            <T
              bn="উত্তর খুঁজে না পেলে আমাদের সহায়তা কেন্দ্রে যোগাযোগ করুন — সাধারণত এক কার্যদিবসের মধ্যে উত্তর দেওয়া হয়।"
              en="Can't find your answer? Reach our help center — we usually respond within one business day."
            />
          </p>
          <Link href="/contact" className="btn-outline inline-flex items-center">
            <T bn="সহায়তা কেন্দ্র" en="Help Center" />
          </Link>
        </div>

        {/* Right: accordion card */}
        <div className="card p-6 sm:p-8">
          <div className="divide-y divide-warm-border/70">
            {FAQS.map((f, i) => (
              <details key={i} className="group py-4 first:pt-0 last:pb-0">
                <summary className="flex items-center justify-between gap-3 cursor-pointer text-sm sm:text-base font-medium text-ink list-none">
                  <span><T bn={f.qBn} en={f.qEn} /></span>
                  <svg
                    className="shrink-0 w-4 h-4 text-primary-600 transition-transform group-open:rotate-180"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-sm text-ink-soft leading-relaxed mt-3 pr-6">
                  <T bn={f.aBn} en={f.aEn} />
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
