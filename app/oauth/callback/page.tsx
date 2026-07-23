'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const token        = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const expiresIn    = searchParams.get('expiresIn');
    const userId = searchParams.get('userId');
    const name   = searchParams.get('name');
    const email  = searchParams.get('email');
    const role   = searchParams.get('role');
    const err    = searchParams.get('error');

    if (err) {
      setError(decodeURIComponent(err));
      return;
    }

    if (!token || !refreshToken || !userId || !email || !role) {
      setError('Invalid OAuth response. Please try again.');
      return;
    }

    login({
      token,
      refreshToken,
      expiresAt: Date.now() + Number(expiresIn ?? 3600) * 1000,
      userId: Number(userId),
      name: name ?? '',
      email,
      role,
    });
    router.replace('/');
  }, [searchParams, login, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-card p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="font-bold text-gray-900 text-lg">লগইন ব্যর্থ হয়েছে / Login Failed</h1>
          <p className="text-sm text-warm-muted">{error}</p>
          <button onClick={() => router.replace('/')} className="btn-primary w-full justify-center">
            হোম পেজে যান / Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-warm-muted text-sm">লগইন হচ্ছে... / Signing you in...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
