'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { submitInstituteReview } from '@/lib/api';

function RatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl leading-none transition-colors ${n <= value ? 'text-amber-500' : 'text-gray-300 hover:text-amber-300'}`}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function SubmitInstituteReviewPage() {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();

  const [instituteName, setInstituteName] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) { openModal('login'); return; }
    setSubmitting(true);
    setError('');
    try {
      await submitInstituteReview(user.token, {
        instituteName: instituteName.trim(),
        rating,
        title: title.trim(),
        body: body.trim(),
        isAnonymous,
      });
      setDone(true);
    } catch (err: unknown) {
      setError((err as Error).message || t('জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'Failed to submit. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/study-corner/institute-reviews" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('ইনস্টিটিউট রিভিউ', 'Institute Reviews')}
        </Link>

        {!user ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('লগইন প্রয়োজন', 'Login Required')}</h1>
            <p className="text-sm text-warm-muted mb-6 max-w-xs mx-auto">
              {t('রিভিউ লিখতে আগে লগইন করুন।', 'Please login to write a review.')}
            </p>
            <button onClick={() => openModal('login')} className="btn-primary px-8 py-3">
              {t('লগইন করুন', 'Login')}
            </button>
          </div>
        ) : done ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('জমা দেওয়া হয়েছে', 'Submitted')}</h1>
            <p className="text-sm text-warm-muted mb-6 max-w-sm mx-auto">
              {t(
                'ধন্যবাদ! আপনার রিভিউ এডমিন অনুমোদনের পর সবার জন্য প্রদর্শিত হবে।',
                "Thanks! Your review will be visible to everyone once an admin approves it."
              )}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/study-corner/institute-reviews/mine" className="btn-primary px-6 py-2.5 text-sm">
                {t('আমার রিভিউ দেখুন', 'View my reviews')}
              </Link>
              <Link href="/study-corner/institute-reviews" className="btn-outline px-6 py-2.5 text-sm">
                {t('তালিকায় ফিরুন', 'Back to list')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{t('ইনস্টিটিউট রিভিউ লিখুন', 'Write an Institute Review')}</h1>
            <p className="text-sm text-warm-muted mb-6">
              {t('আপনার রিভিউ প্রকাশের আগে এডমিন কর্তৃক পর্যালোচনা করা হবে।', 'Your review will be reviewed by an admin before it goes public.')}
            </p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t('ইনস্টিটিউট / কোচিং সেন্টারের নাম', 'Institute / Coaching Center Name')} *</label>
                <input value={instituteName} onChange={(e) => setInstituteName(e.target.value)} required maxLength={200} className="input" placeholder={t('যেমনঃ ইউসিসি, উদ্ভাস', 'e.g. UCC, Udvash')} />
              </div>

              <div>
                <label className="label">{t('রেটিং', 'Rating')} *</label>
                <RatingPicker value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="label">{t('শিরোনাম', 'Title')} *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} className="input" placeholder={t('সংক্ষেপে আপনার অভিজ্ঞতা কী নিয়ে', 'A short headline for your review')} />
              </div>

              <div>
                <label className="label">{t('আপনার রিভিউ', 'Your Review')} *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={8}
                  className="input"
                  placeholder={t('পড়াশোনার মান, শিক্ষক, পরিবেশ ইত্যাদি নিয়ে বিস্তারিত লিখুন...', 'Describe the teaching quality, faculty, environment, etc. in detail...')}
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 accent-primary" />
                {t('বেনামে পোস্ট করুন (আপনার নাম প্রদর্শিত হবে না)', "Post anonymously (your name won't be shown)")}
              </label>

              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3">
                {submitting ? t('জমা দেওয়া হচ্ছে...', 'Submitting...') : t('জমা দিন', 'Submit')}
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
