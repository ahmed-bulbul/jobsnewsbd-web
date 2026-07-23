'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { submitJobExperience } from '@/lib/api';

export default function SubmitJobExperiencePage() {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const router = useRouter();

  const [organizationName, setOrganizationName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [outcome, setOutcome] = useState<'SELECTED' | 'REJECTED' | 'WAITING'>('SELECTED');
  const [stageReached, setStageReached] = useState<'WRITTEN' | 'VIVA' | 'FINAL'>('VIVA');
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
      await submitJobExperience(user.token, {
        organizationName: organizationName.trim(),
        positionTitle: positionTitle.trim() || undefined,
        outcome,
        stageReached,
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
        <Link href="/study-corner/job-experience" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('চাকরির অভিজ্ঞতা', 'Job Experiences')}
        </Link>

        {!user ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('লগইন প্রয়োজন', 'Login Required')}</h1>
            <p className="text-sm text-warm-muted mb-6 max-w-xs mx-auto">
              {t('অভিজ্ঞতা শেয়ার করতে আগে লগইন করুন।', 'Please login to share your experience.')}
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
                'ধন্যবাদ! আপনার পোস্টটি এডমিন অনুমোদনের পর সবার জন্য প্রদর্শিত হবে।',
                "Thanks! Your post will be visible to everyone once an admin approves it."
              )}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/study-corner/job-experience/mine" className="btn-primary px-6 py-2.5 text-sm">
                {t('আমার পোস্ট দেখুন', 'View my posts')}
              </Link>
              <Link href="/study-corner/job-experience" className="btn-outline px-6 py-2.5 text-sm">
                {t('তালিকায় ফিরুন', 'Back to list')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{t('চাকরির অভিজ্ঞতা শেয়ার করুন', 'Share Job Experience')}</h1>
            <p className="text-sm text-warm-muted mb-6">
              {t('আপনার পোস্ট প্রকাশের আগে এডমিন কর্তৃক পর্যালোচনা করা হবে।', 'Your post will be reviewed by an admin before it goes public.')}
            </p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('প্রতিষ্ঠানের নাম', 'Organization Name')} *</label>
                  <input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required className="input" placeholder={t('যেমনঃ বাংলাদেশ ব্যাংক', 'e.g. Bangladesh Bank')} />
                </div>
                <div>
                  <label className="label">{t('পদের নাম', 'Position')}</label>
                  <input value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} className="input" placeholder={t('যেমনঃ সহকারী পরিচালক', 'e.g. Assistant Director')} />
                </div>
                <div>
                  <label className="label">{t('ফলাফল', 'Outcome')} *</label>
                  <select value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)} className="input">
                    <option value="SELECTED">{t('নির্বাচিত', 'Selected')}</option>
                    <option value="REJECTED">{t('প্রত্যাখ্যাত', 'Rejected')}</option>
                    <option value="WAITING">{t('অপেক্ষমান', 'Waiting')}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{t('পৌঁছেছেন কোন ধাপ পর্যন্ত', 'Stage Reached')} *</label>
                  <select value={stageReached} onChange={(e) => setStageReached(e.target.value as typeof stageReached)} className="input">
                    <option value="WRITTEN">{t('লিখিত পরীক্ষা', 'Written Exam')}</option>
                    <option value="VIVA">{t('ভাইভা', 'Viva')}</option>
                    <option value="FINAL">{t('চূড়ান্ত ফলাফল', 'Final Result')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">{t('শিরোনাম', 'Title')} *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} className="input" placeholder={t('সংক্ষেপে আপনার অভিজ্ঞতা কী নিয়ে', 'A short headline for your experience')} />
              </div>

              <div>
                <label className="label">{t('আপনার অভিজ্ঞতা', 'Your Experience')} *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={8}
                  className="input"
                  placeholder={t('আবেদন থেকে শুরু করে ভাইভা/ফলাফল পর্যন্ত যা যা হয়েছিল বিস্তারিত লিখুন...', 'Describe your journey from application to viva/result in detail...')}
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
