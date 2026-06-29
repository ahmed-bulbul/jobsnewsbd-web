'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password);
      if (res.role !== 'ADMIN') {
        setError('আপনার অ্যাডমিন এক্সেস নেই।');
        return;
      }
      localStorage.setItem('admin_token', res.token);
      localStorage.setItem('admin_name', res.name);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'লগইন ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">চ</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">অ্যাডমিন লগইন</h1>
          <p className="text-warm-muted text-sm mt-1">চাকরির খবর — Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="label">ইমেইল</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              className="input"
            />
          </div>

          <div>
            <label className="label">পাসওয়ার্ড</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}
