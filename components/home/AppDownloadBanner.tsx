'use client';

import T from '@/components/ui/T';
import GooglePlayCta from '@/components/ui/GooglePlayCta';
import PhoneMockup from '@/components/ui/PhoneMockup';

// Mobile app is live on the Play Store — the badge links straight to the
// real store listing. Solid navy panel (matches the dark CTA-banner
// treatment used elsewhere in the redesign) rather than the earlier soft
// green gradient.
export default function AppDownloadBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative overflow-hidden rounded-3xl bg-navy-900">
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-6 p-6 sm:p-8">
          {/* Left: phone mockups — light UI resembling the app's actual home screen */}
          <div className="flex items-center justify-center gap-3 order-2 sm:order-1">
            <PhoneMockup />
            <PhoneMockup stacked dim className="hidden sm:block" />
          </div>

          {/* Middle: copy */}
          <div className="order-1 sm:order-2 text-center sm:text-left">
            <p className="font-bold text-xl sm:text-2xl text-white mb-2">
              <T bn="নতুন বিজ্ঞপ্তির খবর সবার আগে পান" en="Get new job alerts before anyone else" />
            </p>
            <p className="text-sm text-white/70 max-w-sm mx-auto sm:mx-0 mb-4 leading-relaxed">
              <T
                bn="আপনার পছন্দের ক্যাটাগরির নতুন বিজ্ঞপ্তি এলেই নোটিফিকেশন পাবেন — কোনো সুযোগ মিস হবে না।"
                en="Get notified the instant a new listing appears in your chosen categories — never miss an opportunity."
              />
            </p>
            <GooglePlayCta />
            <p className="text-xs text-white/50 mt-2">Android 7.0+ · ~15 MB</p>
          </div>

          {/* Right: feature highlights list — same background as the rest of
              the panel, just separated by thin dividers between rows. */}
          <div className="order-3 sm:pl-6 sm:border-l border-white/10 flex flex-col divide-y divide-white/10 w-full sm:w-64">
            {FEATURES.map((f) => (
              <div key={f.titleBn} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    <T bn={f.titleBn} en={f.titleEn} />
                  </p>
                  <p className="text-xs text-navy-100 truncate">
                    <T bn={f.subtitleBn} en={f.subtitleEn} />
                  </p>
                </div>
                <span className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-base bg-white/10">
                  {f.icon}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: '🔔',
    titleBn: 'অটোমেটিক নোটিফিকেশন',
    titleEn: 'Automatic notifications',
    subtitleBn: 'পছন্দের ক্যাটাগরিতে নতুন পোস্ট এলেই জানানো হবে',
    subtitleEn: 'Alerted the moment your categories get new posts',
  },
  {
    icon: '💾',
    titleBn: 'অফলাইন সংরক্ষণ',
    titleEn: 'Offline saving',
    subtitleBn: 'PDF ও নোট ডাউনলোড করে অফলাইনে পড়ুন',
    subtitleEn: 'Download PDFs and notes to read offline',
  },
  {
    icon: '⏱️',
    titleBn: 'নিজের প্রস্তুতির রিদম',
    titleEn: 'Your own prep rhythm',
    subtitleBn: 'নিজের সময়সূচি অনুযায়ী পড়াশোনা পরিচালনা করুন',
    subtitleEn: 'Study on your own schedule, at your own pace',
  },
];
