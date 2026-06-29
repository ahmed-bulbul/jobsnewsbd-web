'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result.role === 'ADMIN') {
        // Admin users should use the admin login panel
        localStorage.setItem('admin_token', result.token);
        router.push('/admin/dashboard');
        return;
      }
      authLogin({ token: result.token, userId: result.userId, name: result.name ?? '', email: result.email, role: result.role });
      router.push('/');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'লগইন ব্যর্থ হয়েছে');
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
          <h1 className="mt-6 text-2xl font-bold text-gray-900">আপনার অ্যাকাউন্টে প্রবেশ করুন</h1>
          <p className="mt-1 text-sm text-warm-muted">সেরা চাকরির বিজ্ঞপ্তি পেতে লগইন করুন</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">ইমেইল ঠিকানা</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required className="input" placeholder="example@gmail.com" autoComplete="email"
              />
            </div>
            <div>
              <label className="label">পাসওয়ার্ড</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required className="input" placeholder="••••••••" autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3 mt-2">
              {submitting ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-warm-muted">
            অ্যাকাউন্ট নেই?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">নিবন্ধন করুন</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
