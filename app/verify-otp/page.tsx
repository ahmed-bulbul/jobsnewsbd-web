'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyOtp, resendOtp } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const { login } = useAuth();
  const { lang, t } = useLanguage();

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

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
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
    if (otp.length < 6) { setError(t('৬ সংখ্যার কোড দিন', 'Please enter the 6-digit code')); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await verifyOtp(email, otp);
      login({ token: result.token, userId: result.userId, name: result.name ?? '', email: result.email, role: result.role });
      router.push('/');
    } catch (err: unknown) {
      setError((err as Error).message ?? t('যাচাই ব্যর্থ হয়েছে', 'Verification failed'));
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
      setError((err as Error).message ?? t('পুনরায় পাঠানো ব্যর্থ হয়েছে', 'Resend failed'));
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
          <h1 className="text-2xl font-bold text-gray-900">{t('ইমেইল যাচাই করুন', 'Verify your email')}</h1>
          <p className="mt-2 text-sm text-warm-muted">
            {lang === 'bn' ? (
              <><span className="font-medium text-gray-700">{email}</span>-এ ৬ সংখ্যার কোড পাঠানো হয়েছে</>
            ) : (
              <>A 6-digit code was sent to <span className="font-medium text-gray-700">{email}</span></>
            )}
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
            <div className="flex gap-1.5 sm:gap-2 justify-center" onPaste={handlePaste}>
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
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-warm-border rounded-xl focus:outline-none focus:border-primary transition-colors bg-white"
                />
              ))}
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3">
              {submitting ? t('যাচাই হচ্ছে...', 'Verifying...') : t('যাচাই করুন', 'Verify')}
            </button>
          </form>

          <div className="mt-5 text-center">
            {countdown > 0 ? (
              <p className="text-sm text-warm-muted">
                {t(`পুনরায় পাঠান (${countdown}s)`, `Resend code (${countdown}s)`)}
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-primary font-medium hover:underline disabled:opacity-50"
              >
                {resending ? t('পাঠানো হচ্ছে...', 'Sending...') : t('কোড পাননি? পুনরায় পাঠান', "Didn't receive the code? Resend")}
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-warm-muted">
            <Link href="/register" className="text-primary hover:underline">{t('← নিবন্ধনে ফিরুন', '← Back to register')}</Link>
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
