'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { submitBookListing, uploadBookListingPhoto } from '@/lib/api';
import type { BookCondition } from '@/lib/types';

export default function SubmitBookListingPage() {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [condition, setCondition] = useState<BookCondition>('GOOD');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token) { openModal('login'); return; }
    const priceNum = Number(price);
    if (!priceNum || priceNum <= 0) { setError(t('সঠিক দাম লিখুন', 'Please enter a valid price')); return; }
    setSubmitting(true);
    setError('');
    try {
      const created = await submitBookListing(user.token, {
        title: title.trim(),
        author: author.trim() || undefined,
        condition,
        price: priceNum,
        description: description.trim() || undefined,
      });
      if (photoFile) {
        try { await uploadBookListingPhoto(user.token, created.id, photoFile); } catch { /* non-fatal */ }
      }
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
        <Link href="/study-corner/book-marketplace" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('পুরাতন বই কেনাবেচা', 'Book Marketplace')}
        </Link>

        {!user ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t('লগইন প্রয়োজন', 'Login Required')}</h1>
            <p className="text-sm text-warm-muted mb-6 max-w-xs mx-auto">
              {t('বই বিক্রি করতে আগে লগইন করুন।', 'Please login to sell a book.')}
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
                'ধন্যবাদ! আপনার বিজ্ঞাপনটি এডমিন অনুমোদনের পর সবার জন্য প্রদর্শিত হবে।',
                "Thanks! Your listing will be visible to everyone once an admin approves it."
              )}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/study-corner/book-marketplace/mine" className="btn-primary px-6 py-2.5 text-sm">
                {t('আমার বিজ্ঞাপন দেখুন', 'View my listings')}
              </Link>
              <Link href="/study-corner/book-marketplace" className="btn-outline px-6 py-2.5 text-sm">
                {t('তালিকায় ফিরুন', 'Back to list')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{t('বই বিক্রি করুন', 'Sell a Book')}</h1>
            <p className="text-sm text-warm-muted mb-6">
              {t('আপনার বিজ্ঞাপন প্রকাশের আগে এডমিন কর্তৃক পর্যালোচনা করা হবে।', 'Your listing will be reviewed by an admin before it goes public.')}
            </p>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo */}
              <div>
                <label className="label">{t('বইয়ের ছবি (ঐচ্ছিক)', 'Book Photo (optional)')}</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer aspect-[4/3] w-40 bg-warm-bg border border-dashed border-warm-border rounded-xl flex items-center justify-center overflow-hidden relative"
                >
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📷</span>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('বইয়ের নাম', 'Book Title')} *</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={300} className="input" placeholder={t('যেমনঃ MP3 Bank Job', 'e.g. MP3 Bank Job')} />
                </div>
                <div>
                  <label className="label">{t('লেখক', 'Author')}</label>
                  <input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={200} className="input" />
                </div>
                <div>
                  <label className="label">{t('অবস্থা', 'Condition')} *</label>
                  <select value={condition} onChange={(e) => setCondition(e.target.value as BookCondition)} className="input">
                    <option value="NEW">{t('নতুন', 'New')}</option>
                    <option value="LIKE_NEW">{t('প্রায় নতুন', 'Like New')}</option>
                    <option value="GOOD">{t('ভালো', 'Good')}</option>
                    <option value="FAIR">{t('মোটামুটি', 'Fair')}</option>
                  </select>
                </div>
                <div>
                  <label className="label">{t('দাম (টাকা)', 'Price (BDT)')} *</label>
                  <input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} required className="input" placeholder="৳" />
                </div>
              </div>

              <div>
                <label className="label">{t('বিস্তারিত (ঐচ্ছিক)', 'Description (optional)')}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="input"
                  placeholder={t('বইয়ের অবস্থা, সংস্করণ, অতিরিক্ত তথ্য ইত্যাদি লিখুন...', 'Describe the condition, edition, or any extra details...')}
                />
              </div>

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
