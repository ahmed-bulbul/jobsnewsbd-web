'use client';

import T from '@/components/ui/T';
import GooglePlayCta from '@/components/ui/GooglePlayCta';
import PhoneMockup from '@/components/ui/PhoneMockup';

// Mobile app is live on the Play Store — the badge links straight to the
// real store listing. One continuous soft-green panel (not separate white
// card + boxed sections) so the whole banner reads as a single surface.
export default function AppDownloadBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-[#f4faf7] to-emerald-50">
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-6 p-6 sm:p-8">
          {/* Left: phone mockups — light UI resembling the app's actual home screen */}
          <div className="flex items-center justify-center gap-3 order-2 sm:order-1">
            <PhoneMockup />
            <PhoneMockup stacked dim className="hidden sm:block" />
          </div>

          {/* Middle: copy */}
          <div className="order-1 sm:order-2 text-center sm:text-left">
            <p className="text-ink font-bold text-lg mb-2">
              <T bn="Job Radar অ্যাপ" en="Job Radar App" />
            </p>
            <p className="text-ink-soft text-sm max-w-sm mx-auto sm:mx-0 mb-4 leading-relaxed">
              <T
                bn="সব চাকরির আপডেট, পরীক্ষা ও প্রস্তুতি এক অ্যাপের মধ্যে। এখনই ডাউনলোড করুন Job Radar অ্যাপ!"
                en="All job updates, exams and prep in one app. Download the Job Radar app now!"
              />
            </p>
            <GooglePlayCta />
          </div>

          {/* Right: feature highlights list — same background as the rest of
              the panel, just separated by thin dividers between rows. */}
          <div className="order-3 sm:pl-6 sm:border-l border-emerald-100/80 flex flex-col divide-y divide-emerald-100/80 w-full sm:w-64">
            {FEATURES.map((f) => (
              <div key={f.titleBn} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    <T bn={f.titleBn} en={f.titleEn} />
                  </p>
                  <p className="text-xs text-ink-soft truncate">
                    <T bn={f.subtitleBn} en={f.subtitleEn} />
                  </p>
                </div>
                <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-base ${f.color}`}>
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
    color: 'bg-amber-100',
    titleBn: 'দ্রুত নোটিফিকেশন',
    titleEn: 'Instant notifications',
    subtitleBn: 'কোনো চাকরির খবর মিস হবে না',
    subtitleEn: "Never miss a job update",
  },
  {
    icon: '📖',
    color: 'bg-primary-100',
    titleBn: 'অফলাইন নোটস',
    titleEn: 'Offline notes',
    subtitleBn: 'PDF নোট ডাউনলোড করে পড়ুন',
    subtitleEn: 'Download PDF notes to read anytime',
  },
  {
    icon: '🙂',
    color: 'bg-rose-100',
    titleBn: 'সহজ ও ব্যবহারবান্ধব',
    titleEn: 'Simple & user-friendly',
    subtitleBn: 'স্মার্ট ডিজাইন, দ্রুত অভিজ্ঞতা',
    subtitleEn: 'Smart design, fast experience',
  },
];
