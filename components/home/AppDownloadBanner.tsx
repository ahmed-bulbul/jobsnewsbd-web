'use client';

import Image from 'next/image';
import { useState } from 'react';
import T from '@/components/ui/T';
import GooglePlayCta, { ComingSoonModal } from '@/components/ui/GooglePlayCta';

// Mobile app is submitted to Google Play but not live yet — clicking the
// store badge shouldn't land on a broken/empty listing, so it opens the
// shared Coming Soon modal instead. Swap to a real Play Store link once the
// app goes live.
export default function AppDownloadBanner() {
  const [open, setOpen] = useState(false);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-6 p-6 sm:p-8">
          {/* Left: phone mockups — light UI resembling the app's actual home screen */}
          <div className="flex items-center justify-center gap-3 order-2 sm:order-1">
            <PhoneMockup />
            <PhoneMockup faded />
          </div>

          {/* Middle: copy + brand */}
          <div className="order-1 sm:order-2 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-3">
              <Image src="/logo-mark.svg" alt="Job Radar" width={36} height={36} className="rounded-xl" />
              <span className="text-ink font-bold text-lg">
                <T bn="Job Radar অ্যাপ" en="Job Radar App" />
              </span>
            </div>
            <p className="text-ink-soft text-sm max-w-sm mx-auto sm:mx-0 mb-4">
              <T
                bn="সব চাকরির আপডেট, পরীক্ষার প্রস্তুতি ও রিসোর্স এখন আপনার মোবাইলে।"
                en="All job updates, exam prep and resources, now on your mobile."
              />
            </p>
            <GooglePlayCta />
          </div>

          {/* Right: "not live yet" note + CTA + megaphone accent */}
          <div className="order-3 flex items-center gap-4 justify-center sm:justify-end bg-cream rounded-2xl px-5 py-4 sm:ml-4">
            <div className="text-center sm:text-left">
              <p className="text-xs text-ink-soft mb-1">
                <T bn="অ্যাপটি এখনো লাইভ নয়" en="The app isn't live yet" />
              </p>
              <p className="text-sm font-semibold text-ink mb-2 max-w-[180px]">
                <T bn="খুব শীঘ্রই Google Play Store এ আসছে!" en="Coming very soon to Google Play Store!" />
              </p>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-block text-xs font-bold text-white bg-primary hover:bg-primary-700 transition-colors px-3 py-1.5 rounded-full"
              >
                <T bn="খুব শীঘ্রই" en="Coming Soon" />
              </button>
            </div>
            <MegaphoneIcon className="hidden sm:block w-12 h-12 text-accent shrink-0" />
          </div>
        </div>
      </div>

      <ComingSoonModal open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

// Real dashboard screenshot from the mobile app, framed inside a phone
// bezel — the second, faded copy behind it is the same screenshot (there's
// only one to show yet) at reduced opacity and a slight rotation, which is
// the standard "stack of screens" treatment app-store pages use.
function PhoneMockup({ faded = false }: { faded?: boolean }) {
  return (
    <div
      className={`relative w-28 sm:w-32 aspect-[1/2] rounded-[1.6rem] border-4 border-gray-900 bg-gray-900 shadow-xl overflow-hidden ${
        faded ? 'hidden sm:block opacity-45 -ml-10 rotate-6' : ''
      }`}
    >
      <Image
        src="/app-screenshot-dashboard.png"
        alt="Job Radar app dashboard"
        fill
        className="object-cover object-top rounded-[1.2rem]"
        sizes="128px"
      />
    </div>
  );
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M6 20v8a3 3 0 003 3h3l14 9V8L12 17H9a3 3 0 00-3 3z" fill="currentColor" opacity=".9" />
      <path d="M26 8v32c6 0 10-7 10-16S32 8 26 8z" fill="currentColor" opacity=".6" />
      <rect x="9" y="31" width="6" height="10" rx="2" fill="currentColor" opacity=".9" />
      <circle cx="40" cy="12" r="2" fill="currentColor" opacity=".5" />
      <circle cx="43" cy="20" r="1.5" fill="currentColor" opacity=".4" />
    </svg>
  );
}
