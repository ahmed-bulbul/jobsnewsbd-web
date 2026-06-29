'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { login as apiLogin, userRegister, verifyOtp, resendOtp } from '@/lib/api';

type View = 'login' | 'register' | 'otp';

/* ─── Login sub-form ─────────────────────────────────── */
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await apiLogin(email, password);
      if (result.role === 'ADMIN') {
        localStorage.setItem('admin_token', result.token);
        onSuccess();
        router.push('/admin/dashboard');
        return;
      }
      login({ token: result.token, userId: result.userId, name: result.name ?? '', email: result.email, role: result.role });
      onSuccess();
    } catch (err: unknown) {
      setError((err as Error).message ?? t('লগইন ব্যর্থ হয়েছে', 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}
      <div>
        <label className="label">{t('ইমেইল ঠিকানা', 'Email address')}</label>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          required className="input" placeholder="example@gmail.com" autoComplete="email"
        />
      </div>
      <div>
        <label className="label">{t('পাসওয়ার্ড', 'Password')}</label>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          required className="input" placeholder="••••••••" autoComplete="current-password"
        />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3 mt-1">
        {submitting ? t('লগইন হচ্ছে...', 'Signing in...') : t('লগইন করুন', 'Login')}
      </button>
    </form>
  );
}

/* ─── Register sub-form ──────────────────────────────── */
function RegisterForm({ onSuccess }: { onSuccess: (email: string) => void }) {
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
      onSuccess(form.email);
    } catch (err: unknown) {
      setError((err as Error).message ?? t('নিবন্ধন ব্যর্থ হয়েছে', 'Registration failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}
      <div>
        <label className="label">{t('পূর্ণ নাম', 'Full name')} *</label>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} required className="input" placeholder={t('আপনার নাম', 'Your name')} />
      </div>
      <div>
        <label className="label">{t('ইমেইল ঠিকানা', 'Email address')} *</label>
        <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className="input" placeholder="example@gmail.com" />
      </div>
      <div>
        <label className="label">{t('মোবাইল নম্বর', 'Mobile number')}</label>
        <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className="input" placeholder="01XXXXXXXXX" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">{t('পাসওয়ার্ড', 'Password')} *</label>
          <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} className="input" placeholder={t('কমপক্ষে ৬', 'Min 6 chars')} />
        </div>
        <div>
          <label className="label">{t('নিশ্চিত করুন', 'Confirm')} *</label>
          <input type="password" value={form.confirm} onChange={(e) => set('confirm', e.target.value)} required className="input" placeholder="••••••" />
        </div>
      </div>
      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3 mt-1">
        {submitting ? t('অপেক্ষা করুন...', 'Please wait...') : t('নিবন্ধন করুন', 'Register')}
      </button>
    </form>
  );
}

/* ─── OTP sub-form ───────────────────────────────────── */
function OtpForm({ email, onSuccess, onBack }: { email: string; onSuccess: () => void; onBack: () => void }) {
  const { t, lang } = useLanguage();
  const { login } = useAuth();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resendMsg, setResendMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

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
    if (text.length === 6) { setDigits(text.split('')); inputs.current[5]?.focus(); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) { setError(t('৬ সংখ্যার কোড দিন', 'Enter the 6-digit code')); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await verifyOtp(email, otp);
      login({ token: result.token, userId: result.userId, name: result.name ?? '', email: result.email, role: result.role });
      onSuccess();
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
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">✉️</span>
        </div>
        <h3 className="font-bold text-gray-900 text-lg">{t('ইমেইল যাচাই করুন', 'Verify your email')}</h3>
        <p className="text-sm text-warm-muted mt-1">
          {lang === 'bn' ? (
            <><span className="font-medium text-gray-700">{email}</span>-এ কোড পাঠানো হয়েছে</>
          ) : (
            <>Code sent to <span className="font-medium text-gray-700">{email}</span></>
          )}
        </p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
      {resendMsg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{resendMsg}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-13 text-center text-xl font-bold border-2 border-warm-border rounded-xl focus:outline-none focus:border-primary transition-colors bg-white"
            />
          ))}
        </div>
        <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-3">
          {submitting ? t('যাচাই হচ্ছে...', 'Verifying...') : t('যাচাই করুন', 'Verify')}
        </button>
      </form>

      <div className="text-center space-y-2">
        {countdown > 0 ? (
          <p className="text-sm text-warm-muted">{t(`পুনরায় পাঠান (${countdown}s)`, `Resend (${countdown}s)`)}</p>
        ) : (
          <button onClick={handleResend} disabled={resending} className="text-sm text-primary font-medium hover:underline disabled:opacity-50">
            {resending ? t('পাঠানো হচ্ছে...', 'Sending...') : t('কোড পাননি? পুনরায় পাঠান', "Didn't receive it? Resend")}
          </button>
        )}
        <button onClick={onBack} className="block w-full text-xs text-warm-muted hover:text-gray-700">
          {t('← নিবন্ধনে ফিরুন', '← Back to register')}
        </button>
      </div>
    </div>
  );
}

/* ─── Main modal ─────────────────────────────────────── */
export default function AuthModal() {
  const { modalOpen, modalInitialView, closeModal } = useAuth();
  const { t } = useLanguage();
  const [view, setView] = useState<View>('login');
  const [pendingEmail, setPendingEmail] = useState('');

  useEffect(() => {
    if (modalOpen) {
      setView(modalInitialView as View);
      setPendingEmail('');
    }
  }, [modalOpen, modalInitialView]);

  // Lock body scroll
  useEffect(() => {
    if (modalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Close button */}
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 pt-8 pb-2">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-base shadow">চ</div>
          <div className="leading-tight">
            <span className="block font-bold text-primary text-lg">চাকরির খবর</span>
            <span className="block text-[10px] text-warm-muted font-sans">Jobs News BD</span>
          </div>
        </div>

        {/* Tabs — hidden on OTP view */}
        {view !== 'otp' && (
          <div className="flex mx-6 mt-4 border-b border-warm-border">
            <button
              onClick={() => setView('login')}
              className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                view === 'login'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-warm-muted hover:text-gray-700'
              }`}
            >
              {t('লগইন', 'Login')}
            </button>
            <button
              onClick={() => setView('register')}
              className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                view === 'register'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-warm-muted hover:text-gray-700'
              }`}
            >
              {t('নিবন্ধন', 'Register')}
            </button>
          </div>
        )}

        {/* Form area */}
        <div className="p-6">
          {view === 'login' && <LoginForm onSuccess={closeModal} />}
          {view === 'register' && (
            <RegisterForm onSuccess={(email) => { setPendingEmail(email); setView('otp'); }} />
          )}
          {view === 'otp' && (
            <OtpForm email={pendingEmail} onSuccess={closeModal} onBack={() => setView('register')} />
          )}
        </div>
      </div>
    </div>
  );
}
