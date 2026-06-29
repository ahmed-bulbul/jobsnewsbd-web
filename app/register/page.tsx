'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userRegister } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('পাসওয়ার্ড মিলছে না'); return; }
    setSubmitting(true);
    setError('');
    try {
      await userRegister(form.name, form.email, form.phone, form.password);
      router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'নিবন্ধন ব্যর্থ হয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow">চ</div>
            <div className="text-left leading-tight">
              <span className="block font-bold text-primary text-xl">চাকরির খবর</span>
              <span className="block text-xs text-warm-muted font-sans">Jobs News BD</span>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">নতুন অ্যাকাউন্ট তৈরি করুন</h1>
          <p className="mt-1 text-sm text-warm-muted">সাইন আপ করুন এবং সেরা চাকরির খবর পান</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">পূর্ণ নাম *</label>
              <input
                value={form.name} onChange={(e) => set('name', e.target.value)}
                required className="input" placeholder="আপনার নাম"
              />
            </div>
            <div>
              <label className="label">ইমেইল ঠিকানা *</label>
              <input
                type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                required className="input" placeholder="example@gmail.com"
              />
            </div>
            <div>
              <label className="label">মোবাইল নম্বর</label>
              <input
                type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className="input" placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="label">পাসওয়ার্ড *</label>
              <input
                type="password" value={form.password} onChange={(e) => set('password', e.target.value)}
                required minLength={6} className="input" placeholder="কমপক্ষে ৬ অক্ষর"
              />
            </div>
            <div>
              <label className="label">পাসওয়ার্ড নিশ্চিত করুন *</label>
              <input
                type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)}
                required className="input" placeholder="পাসওয়ার্ড পুনরায় লিখুন"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3 mt-2">
              {submitting ? 'অপেক্ষা করুন...' : 'নিবন্ধন করুন'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-warm-muted">
            ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">লগইন করুন</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
