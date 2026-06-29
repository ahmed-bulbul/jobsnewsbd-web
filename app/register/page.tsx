'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userRegister } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError(t('পাসওয়ার্ড মিলছে না', 'Passwords do not match')); return; }
    setSubmitting(true);
    setError('');
    try {
      await userRegister(form.name, form.email, form.phone, form.password);
      router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err: unknown) {
      setError((err as Error).message ?? t('নিবন্ধন ব্যর্থ হয়েছে', 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow">চ</div>
            <div className="text-left leading-tight">
              <span className="block font-bold text-primary text-xl">চাকরির খবর</span>
              <span className="block text-xs text-warm-muted font-sans">Jobs News BD</span>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">{t('নতুন অ্যাকাউন্ট তৈরি করুন', 'Create a new account')}</h1>
          <p className="mt-1 text-sm text-warm-muted">{t('সাইন আপ করুন এবং সেরা চাকরির খবর পান', 'Sign up and get the best job news')}</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('পূর্ণ নাম', 'Full name')} *</label>
              <input
                value={form.name} onChange={(e) => set('name', e.target.value)}
                required className="input" placeholder={t('আপনার নাম', 'Your name')}
              />
            </div>
            <div>
              <label className="label">{t('ইমেইল ঠিকানা', 'Email address')} *</label>
              <input
                type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                required className="input" placeholder="example@gmail.com"
              />
            </div>
            <div>
              <label className="label">{t('মোবাইল নম্বর', 'Mobile number')}</label>
              <input
                type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className="input" placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="label">{t('পাসওয়ার্ড', 'Password')} *</label>
              <input
                type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
                required minLength={6} className="input" placeholder={t('কমপক্ষে ৬ অক্ষর', 'At least 6 characters')}
              />
            </div>
            <div>
              <label className="label">{t('পাসওয়ার্ড নিশ্চিত করুন', 'Confirm password')} *</label>
              <input
                type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)}
                required className="input" placeholder={t('পাসওয়ার্ড পুনরায় লিখুন', 'Re-enter password')}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3 mt-2">
              {submitting ? t('অপেক্ষা করুন...', 'Please wait...') : t('নিবন্ধন করুন', 'Register')}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-warm-muted">
            {t('ইতিমধ্যে অ্যাকাউন্ট আছে?', 'Already have an account?')}{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">{t('লগইন করুন', 'Login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
