'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyOtp, resendOtp } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const { login } = useAuth();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) { router.push('/register'); return; }
    inputs.current[0]?.focus();
  }, [email, router]);

  // countdown for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) { setError('৬ সংখ্যার কোড দিন'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await verifyOtp(email, otp);
      login({ token: result.token, userId: result.userId, name: result.name ?? '', email: result.email, role: result.role });
      router.push('/');
    } catch (err: unknown) {
      setError((err as Error).message ?? 'যাচাই ব্যর্থ হয়েছে');
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    setError('');
    try {
      const res = await resendOtp(email);
      setResendMsg(res.message);
      setCountdown(60);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'পুনরায় পাঠানো ব্যর্থ হয়েছে');
    } finally {
      setResending(false);
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
          <div className="mt-6 w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ইমেইল যাচাই করুন</h1>
          <p className="mt-2 text-sm text-warm-muted">
            <span className="font-medium text-gray-700">{email}</span>-এ ৬ সংখ্যার কোড পাঠানো হয়েছে
          </p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}
          {resendMsg && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{resendMsg}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP boxes */}
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-warm-border rounded-xl focus:outline-none focus:border-primary transition-colors bg-white"
                />
              ))}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3">
              {submitting ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
            </button>
          </form>

          <div className="mt-5 text-center">
            {countdown > 0 ? (
              <p className="text-sm text-warm-muted">
                পুনরায় পাঠান ({countdown}s)
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
              >
                {resending ? 'পাঠানো হচ্ছে...' : 'কোড পাননি? পুনরায় পাঠান'}
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-warm-muted">
            <Link href="/register" className="text-primary hover:underline">← নিবন্ধনে ফিরুন</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
