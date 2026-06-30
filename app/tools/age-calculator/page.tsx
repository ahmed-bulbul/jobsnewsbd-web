'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// ── Age calculation ──────────────────────────────────────────────────────────

interface Age {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

function calcAge(dob: Date, ref: Date): Age {
  let years  = ref.getFullYear() - dob.getFullYear();
  let months = ref.getMonth()    - dob.getMonth();
  let days   = ref.getDate()     - dob.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(ref.getFullYear(), ref.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) { months += 12; years -= 1; }

  const totalDays = Math.floor((ref.getTime() - dob.getTime()) / 86400000);
  return { years, months, days, totalDays };
}

function daysUntilAge(dob: Date, targetYears: number, ref: Date): number {
  const deadline = new Date(dob.getFullYear() + targetYears, dob.getMonth(), dob.getDate());
  return Math.ceil((deadline.getTime() - ref.getTime()) / 86400000);
}

// ── Job category eligibility rules ──────────────────────────────────────────

interface Category {
  id: string;
  labelBn: string;
  labelEn: string;
  icon: string;
  minAge: number;
  maxAge: number;
  note: string;
  examples: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'general',
    labelBn: 'সাধারণ প্রার্থী',
    labelEn: 'General',
    icon: '🧑',
    minAge: 18,
    maxAge: 32,
    note: 'সকল প্রার্থী — হালনাগাদ ২০২৪',
    examples: 'বেশিরভাগ মন্ত্রণালয়, পরিদপ্তর, সরকারি অফিস',
  },
  {
    id: 'women',
    labelBn: 'নারী প্রার্থী',
    labelEn: 'Women',
    icon: '👩',
    minAge: 18,
    maxAge: 32,
    note: 'মহিলা কোটা — হালনাগাদ ২০২৪',
    examples: 'নারী প্রার্থী (সাধারণের সমান বয়সসীমা)',
  },
  {
    id: 'ff',
    labelBn: 'মুক্তিযোদ্ধার সন্তান',
    labelEn: 'FF Descendant',
    icon: '🏅',
    minAge: 18,
    maxAge: 32,
    note: 'মুক্তিযোদ্ধা কোটা',
    examples: 'বীর মুক্তিযোদ্ধার পুত্র/কন্যা ও নাতি/নাতনি',
  },
  {
    id: 'disabled',
    labelBn: 'প্রতিবন্ধী প্রার্থী',
    labelEn: 'Disabled',
    icon: '♿',
    minAge: 18,
    maxAge: 32,
    note: 'প্রতিবন্ধী কোটা',
    examples: 'শারীরিক প্রতিবন্ধী প্রার্থী',
  },
  {
    id: 'bcs',
    labelBn: 'BCS পরীক্ষা',
    labelEn: 'BCS Exam',
    icon: '📝',
    minAge: 21,
    maxAge: 32,
    note: 'BPSC পরিচালিত — হালনাগাদ ২০২৪',
    examples: 'বাংলাদেশ সিভিল সার্ভিস — সব ক্যাডার',
  },
  {
    id: 'bank',
    labelBn: 'ব্যাংক জব',
    labelEn: 'Bank Jobs',
    icon: '🏦',
    minAge: 18,
    maxAge: 32,
    note: 'রাষ্ট্রায়ত্ত ব্যাংক',
    examples: 'সোনালী, জনতা, অগ্রণী, বাংলাদেশ ব্যাংক',
  },
  {
    id: 'ngo',
    labelBn: 'এনজিও / বেসরকারি',
    labelEn: 'NGO / Private',
    icon: '🤝',
    minAge: 18,
    maxAge: 35,
    note: 'বেসরকারি সংস্থা',
    examples: 'BRAC, ব্র্যাক, আশা, প্রাইভেট প্রতিষ্ঠান',
  },
  {
    id: 'army',
    labelBn: 'সেনাবাহিনী (সৈনিক)',
    labelEn: 'Army Enlisted',
    icon: '🪖',
    minAge: 17,
    maxAge: 20,
    note: 'সাধারণ সৈনিক পদ',
    examples: 'বাংলাদেশ সেনাবাহিনী সৈনিক পদে নিয়োগ',
  },
];

// ── Status calculation ───────────────────────────────────────────────────────

type Status = 'eligible' | 'too-young' | 'expired' | 'expiring-soon';

interface EligibilityResult {
  status: Status;
  daysLeft?: number;
  daysUntilMin?: number;
}

function getEligibility(age: Age, cat: Category, dob: Date, today: Date): EligibilityResult {
  const { years, months, days } = age;
  const ageDecimal = years + months / 12 + days / 365;

  if (ageDecimal < cat.minAge) {
    const daysLeft = daysUntilAge(dob, cat.minAge, today);
    return { status: 'too-young', daysUntilMin: daysLeft };
  }
  if (years >= cat.maxAge) {
    return { status: 'expired' };
  }
  const daysLeft = daysUntilAge(dob, cat.maxAge, today);
  if (daysLeft <= 365) return { status: 'expiring-soon', daysLeft };
  return { status: 'eligible', daysLeft };
}

const STATUS_STYLE: Record<Status, { border: string; bg: string; badge: string; badgeText: string }> = {
  eligible:       { border: 'border-emerald-200', bg: 'bg-emerald-50',  badge: 'bg-emerald-100 text-emerald-700', badgeText: '✅ যোগ্য' },
  'expiring-soon':{ border: 'border-amber-200',   bg: 'bg-amber-50',    badge: 'bg-amber-100 text-amber-700',    badgeText: '⚠️ শেষ হচ্ছে' },
  'too-young':    { border: 'border-blue-200',     bg: 'bg-blue-50',     badge: 'bg-blue-100 text-blue-700',     badgeText: '🕐 বয়স হয়নি' },
  expired:        { border: 'border-red-200',      bg: 'bg-red-50',      badge: 'bg-red-100 text-red-700',       badgeText: '❌ বয়স শেষ' },
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AgeCalculatorPage() {
  const [dob, setDob] = useState('');
  const today = useMemo(() => new Date(), []);

  const age = useMemo<Age | null>(() => {
    if (!dob) return null;
    const d = new Date(dob);
    if (isNaN(d.getTime()) || d >= today) return null;
    return calcAge(d, today);
  }, [dob, today]);

  const eligibility = useMemo(() => {
    if (!age || !dob) return [];
    const dobDate = new Date(dob);
    return CATEGORIES.map((cat) => ({
      cat,
      result: getEligibility(age, cat, dobDate, today),
    }));
  }, [age, dob, today]);

  const maxDate = today.toISOString().split('T')[0];
  const minDate = new Date(today.getFullYear() - 60, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/tools" className="hover:text-primary transition-colors">টুলস</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">বয়স ক্যালকুলেটর</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">বয়স ক্যালকুলেটর</h1>
          <p className="mt-1 text-sm text-warm-muted">
            জন্মতারিখ দিন — জানুন আপনি কোন সরকারি চাকরিতে আবেদনের বয়সসীমায় আছেন
          </p>
        </div>

        {/* DOB input + age display */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="flex-1">
              <label className="label text-sm mb-1.5 block">জন্মতারিখ (Date of Birth)</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                min={minDate}
                max={maxDate}
                className="input text-base w-full sm:max-w-xs"
              />
            </div>

            {age && (
              <div className="flex-1 bg-primary-50 border border-primary-200 rounded-xl px-6 py-4 text-center">
                <p className="text-xs text-primary-600 font-medium mb-1 uppercase tracking-wide">আপনার বর্তমান বয়স</p>
                <p className="text-3xl font-bold text-primary-800">
                  {age.years}<span className="text-lg font-normal"> বছর</span>
                  {' '}{age.months}<span className="text-lg font-normal"> মাস</span>
                  {' '}{age.days}<span className="text-lg font-normal"> দিন</span>
                </p>
                <p className="text-xs text-primary-500 mt-1">মোট {age.totalDays.toLocaleString('bn-BD')} দিন</p>
              </div>
            )}
          </div>
        </div>

        {/* Eligibility grid */}
        {age && eligibility.length > 0 && (
          <>
            <h2 className="font-bold text-gray-800 mb-3 text-base">চাকরির ধরন অনুযায়ী যোগ্যতা</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {eligibility.map(({ cat, result }) => {
                const style = STATUS_STYLE[result.status];
                return (
                  <div
                    key={cat.id}
                    className={`rounded-xl border p-4 ${style.border} ${style.bg}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{cat.labelBn}</p>
                          <p className="text-xs text-warm-muted font-sans">{cat.labelEn}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${style.badge}`}>
                        {style.badgeText}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">{cat.examples}</p>

                    <div className="flex items-center justify-between text-xs text-warm-muted border-t border-black/5 pt-2 mt-2">
                      <span>বয়সসীমা: {cat.minAge}–{cat.maxAge} বছর</span>
                      {result.status === 'eligible' && result.daysLeft !== undefined && (
                        <span className="text-emerald-700 font-medium">
                          {Math.floor(result.daysLeft / 365)} বছর {Math.floor((result.daysLeft % 365) / 30)} মাস বাকি
                        </span>
                      )}
                      {result.status === 'expiring-soon' && result.daysLeft !== undefined && (
                        <span className="text-amber-700 font-bold">
                          মাত্র {result.daysLeft} দিন বাকি!
                        </span>
                      )}
                      {result.status === 'too-young' && result.daysUntilMin !== undefined && (
                        <span className="text-blue-700 font-medium">
                          {result.daysUntilMin} দিন পর যোগ্য হবেন
                        </span>
                      )}
                      {result.status === 'expired' && (
                        <span className="text-red-600 font-medium">আর আবেদন করা যাবে না</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary bar */}
            <div className="card p-4 bg-cream">
              <div className="flex flex-wrap gap-4 justify-center text-center text-sm">
                {(['eligible', 'expiring-soon', 'too-young', 'expired'] as Status[]).map((s) => {
                  const count = eligibility.filter((e) => e.result.status === s).length;
                  const labels: Record<Status, string> = {
                    'eligible': '✅ যোগ্য',
                    'expiring-soon': '⚠️ শেষ হচ্ছে',
                    'too-young': '🕐 বয়স হয়নি',
                    'expired': '❌ শেষ',
                  };
                  return (
                    <div key={s}>
                      <p className="text-2xl font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-warm-muted">{labels[s]}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!age && !dob && (
          <div className="text-center py-16 text-warm-muted">
            <div className="text-6xl mb-4">🎂</div>
            <p className="font-medium text-gray-700">উপরে আপনার জন্মতারিখ দিন</p>
            <p className="text-sm mt-1">সাথে সাথে দেখতে পাবেন কোন কোন চাকরিতে আবেদন করতে পারবেন</p>
          </div>
        )}

        {/* Disclaimer */}
        {age && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 leading-relaxed text-center">
            ⚠️ ২০২৪ সালের হালনাগাদ অনুযায়ী সরকারি চাকরিতে সাধারণ বয়সসীমা ৩২ বছর নির্ধারিত হয়েছে।
            তবে প্রতিটি বিজ্ঞপ্তিতে ভিন্ন নিয়ম থাকতে পারে — আবেদনের আগে অবশ্যই মূল বিজ্ঞপ্তি যাচাই করুন।
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
