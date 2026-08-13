import T from '@/components/ui/T';

const FAQS = [
  {
    qBn: 'জব রাডার বাংলাদেশ ব্যবহার করতে কি টাকা লাগে?',
    qEn: 'Is Job Radar BD free to use?',
    aBn: 'হ্যাঁ, চাকরির বিজ্ঞপ্তি দেখা, সার্কুলার PDF পড়া, এবং বেশিরভাগ টুলস ও কনটেন্ট সম্পূর্ণ বিনামূল্যে। অ্যাকাউন্ট তৈরি করলে অতিরিক্ত সুবিধা যেমন নোটিফিকেশন ও প্রিয় তালিকা পাওয়া যায়।',
    aEn: 'Yes — browsing job circulars, reading circular PDFs, and most tools and content are completely free. Creating an account unlocks extras like notifications and saved-job lists.',
  },
  {
    qBn: 'নতুন চাকরির বিজ্ঞপ্তি কতবার আপডেট হয়?',
    qEn: 'How often are new job circulars added?',
    aBn: 'প্রতিদিন সরকারি, বেসরকারি, ব্যাংক ও এনজিও প্রতিষ্ঠানের নতুন বিজ্ঞপ্তি যোগ করা হয়। নোটিফিকেশন চালু রাখলে নতুন পোস্ট হওয়ার সাথে সাথে জানতে পারবেন।',
    aEn: 'Government, private, bank and NGO circulars are added every day. Turn on notifications to get alerted the moment a new one is posted.',
  },
  {
    qBn: 'লাইভ পরীক্ষায় অংশ নিতে কি লগইন লাগবে?',
    qEn: 'Do I need to log in to take a live exam?',
    aBn: 'হ্যাঁ, পরীক্ষা শুরু করতে এবং ফলাফল দেখতে লগইন করতে হবে। এটি নিশ্চিত করে যে প্রতিটি পরীক্ষার ফলাফল সঠিকভাবে আপনার প্রোফাইলে সংরক্ষিত থাকে।',
    aEn: 'Yes, logging in is required to start an exam and see your result — this keeps every attempt correctly saved to your own profile.',
  },
  {
    qBn: 'প্রশ্ন ব্যাংক ও পরীক্ষার প্রস্তুতি বিভাগ কীভাবে ব্যবহার করব?',
    qEn: 'How do I use the Question Bank and Exam Prep sections?',
    aBn: 'স্টাডি কর্নার থেকে প্রশ্ন ব্যাংকে গিয়ে বিষয় বেছে অনুশীলন শুরু করতে পারবেন, আর পরীক্ষার প্রস্তুতি বিভাগে ভিডিও, নোট ও নির্ধারিত সময়ের লাইভ পরীক্ষা পাবেন।',
    aEn: 'Open Question Bank from Study Corner, pick a subject, and start practicing. Exam Prep has videos, notes, and scheduled live exams for each category.',
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
      <div className="card p-6 sm:p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          <T bn="সচরাচর জিজ্ঞাসিত প্রশ্ন" en="Frequently asked questions" />
        </h2>
        <div className="divide-y divide-gray-100">
          {FAQS.map((f, i) => (
            <details key={i} className="group py-3 first:pt-0 last:pb-0">
              <summary className="flex items-center justify-between gap-3 cursor-pointer text-sm font-medium text-gray-900 list-none">
                <span><T bn={f.qBn} en={f.qEn} /></span>
                <span className="shrink-0 text-primary-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="text-sm text-gray-600 leading-relaxed mt-2 pr-6">
                <T bn={f.aBn} en={f.aEn} />
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
