'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  getPrepCategory,
  getPaymentConfig,
  getMyEnrollmentRequest,
  submitEnrollmentRequest,
} from '@/lib/api';
import type { PrepCategoryDetail, PrepTopic, PaymentConfig, EnrollmentRequest, PaymentMethod } from '@/lib/types';

// ── Curriculum card ───────────────────────────────────────────────────────────

function CurriculumCard({ topic, color, locked }: { topic: PrepTopic; color: string; locked: boolean }) {
  const { t } = useLanguage();
  const isLive = !!topic.hasLiveExam;
  const inner = (
    <>
      <div className="relative w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
        <span className="text-xs font-bold" style={{ color }}>{topic.displayOrder}</span>
        {isLive && (
          <span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse"
            title={t('লাইভ পরীক্ষা চলছে', 'Live exam running')}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-semibold text-sm leading-snug ${locked ? 'text-gray-500' : 'text-gray-900'}`}>{topic.nameBn}</p>
          {isLive && (
            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {t('লাইভ পরীক্ষা', 'LIVE')}
            </span>
          )}
        </div>
        {topic.contentCount > 0 && (
          <p className="text-xs text-warm-muted mt-0.5">{topic.contentCount} {t('টি কন্টেন্ট', 'contents')}</p>
        )}
      </div>
      {locked ? (
        <svg className="w-4 h-4 text-warm-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-warm-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </>
  );

  if (locked) return <div className="bg-white rounded-xl border border-warm-border p-4 flex items-center gap-3 opacity-70">{inner}</div>;
  return (
    <Link href={`/prep/topics/${topic.slug}`} className="group bg-white rounded-xl border border-warm-border hover:border-primary hover:shadow-md transition-all p-4 flex items-center gap-3">
      {inner}
    </Link>
  );
}

// ── Payment modal ─────────────────────────────────────────────────────────────

function PaymentModal({
  data, config, token,
  onClose, onSubmitted,
}: {
  data: PrepCategoryDetail;
  config: PaymentConfig;
  token: string;
  onClose: () => void;
  onSubmitted: (req: EnrollmentRequest) => void;
}) {
  const { t } = useLanguage();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [txnId, setTxnId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const methods = ([
    { key: 'BKASH' as PaymentMethod, label: 'bKash', number: config.bkashNumber, color: '#D72660', bg: '#FFF0F5' },
    { key: 'ROCKET' as PaymentMethod, label: 'Rocket', number: config.rocketNumber, color: '#8B5CF6', bg: '#F5F3FF' },
  ] as const).filter(m => m.number);

  const selectedMethod = methods.find(m => m.key === method);

  const handleSubmit = async () => {
    if (!method || !txnId.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const req = await submitEnrollmentRequest(token, data.id, method, txnId.trim());
      onSubmitted(req);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      setError(msg || t('ত্রুটি হয়েছে', 'Something went wrong'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-border">
          <h3 className="font-bold text-gray-900">{t('পেমেন্ট করুন', 'Make Payment')}</h3>
          <button onClick={onClose} className="text-warm-muted hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Price */}
          {data.price != null && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-600">{data.nameBn}</span>
              <span className="font-bold text-lg text-gray-900">{data.price} {data.currency}</span>
            </div>
          )}

          {/* Method selector */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">{t('পেমেন্ট মাধ্যম বেছে নিন', 'Select payment method')}</p>
            <div className="grid grid-cols-2 gap-3">
              {methods.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${method === m.key ? 'border-current shadow-sm' : 'border-warm-border hover:border-gray-300'}`}
                  style={method === m.key ? { color: m.color, background: m.bg, borderColor: m.color } : {}}
                >
                  {m.label}
                </button>
              ))}
              {methods.length === 0 && (
                <p className="col-span-2 text-sm text-center text-warm-muted py-2">
                  {t('কোনো পেমেন্ট নম্বর সেট করা হয়নি', 'No payment numbers configured')}
                </p>
              )}
            </div>
          </div>

          {/* Payment instructions */}
          {selectedMethod && (
            <div className="rounded-xl px-4 py-3 space-y-1" style={{ background: selectedMethod.bg }}>
              <p className="text-xs font-semibold" style={{ color: selectedMethod.color }}>
                {t('পাঠানোর নম্বর', 'Send money to')}
              </p>
              <p className="text-lg font-bold tracking-wide" style={{ color: selectedMethod.color }}>
                {selectedMethod.number}
              </p>
              <p className="text-xs text-gray-600">
                {t(`উপরের নম্বরে ${data.price ?? ''} ${data.currency} ${selectedMethod.label}-এ পাঠান, তারপর নিচে ট্রানজেকশন আইডি দিন।`,
                  `Send ${data.price ?? ''} ${data.currency} to the number above via ${selectedMethod.label}, then enter the transaction ID below.`)}
              </p>
            </div>
          )}

          {/* Transaction ID input */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {t('ট্রানজেকশন আইডি (TXN ID) *', 'Transaction ID *')}
            </label>
            <input
              type="text"
              value={txnId}
              onChange={e => setTxnId(e.target.value)}
              placeholder={t('যেমন: 8AB23CD456', 'e.g. 8AB23CD456')}
              className="w-full border border-warm-border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!method || !txnId.trim() || submitting || methods.length === 0}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
          >
            {submitting ? t('জমা হচ্ছে...', 'Submitting...') : t('জমা দিন', 'Submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pending status card ───────────────────────────────────────────────────────

function PendingCard({ req }: { req: EnrollmentRequest }) {
  const { t } = useLanguage();
  const elapsed = Math.round((Date.now() - new Date(req.createdAt).getTime()) / 60000);

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{t('পেমেন্ট যাচাই হচ্ছে', 'Payment under review')}</p>
          <p className="text-xs text-amber-700">{elapsed} {t('মিনিট আগে জমা দেওয়া হয়েছে', 'min ago · within 1 hour')}</p>
        </div>
      </div>
      <div className="bg-white rounded-xl px-4 py-2.5 text-xs font-mono text-gray-600 border border-amber-100">
        {req.paymentMethod} · TXN: {req.transactionId}
      </div>
    </div>
  );
}

function RejectedCard({ req, onRetry }: { req: EnrollmentRequest; onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="font-bold text-red-700 text-sm">{t('পেমেন্ট বাতিল হয়েছে', 'Payment rejected')}</p>
      </div>
      {req.adminNote && <p className="text-xs text-red-600 bg-white rounded-xl px-3 py-2 border border-red-100">{req.adminNote}</p>}
      <button onClick={onRetry} className="w-full text-sm font-semibold text-primary hover:underline">
        {t('আবার চেষ্টা করুন', 'Try again')}
      </button>
    </div>
  );
}

// ── Exam routine panel ────────────────────────────────────────────────────────

function RoutinePanel({ data, color, locked }: { data: PrepCategoryDetail; color: string; locked: boolean }) {
  const { t } = useLanguage();

  const now = Date.now();
  // Only show what's still ahead — once an entry's date/time has passed,
  // it drops off the routine rather than lingering greyed-out.
  const upcoming = (data.routine ?? []).filter((entry) => new Date(entry.scheduledAt).getTime() >= now);

  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-2xl border border-warm-border bg-white p-5">
      <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        {t('পরীক্ষার রুটিন', 'Exam Routine')}
      </h2>
      <div className="space-y-2">
        {upcoming.map((entry) => {
          const scheduled = new Date(entry.scheduledAt);
          const clickable = !locked && !!(entry.examSetId && entry.examSetPublished && entry.topicSlug);

          const dateBn = scheduled.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
          const timeBn = scheduled.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' });

          const inner = (
            <div className={`flex items-center gap-3 rounded-xl border border-warm-border p-3.5 transition-all ${clickable ? 'hover:border-primary hover:shadow-sm' : ''}`}>
              <div className="w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0 leading-none"
                style={{ background: `${color}22`, color }}>
                <span className="text-[10px] font-semibold">{scheduled.toLocaleDateString('bn-BD', { month: 'short' })}</span>
                <span className="text-base font-black">{scheduled.getDate()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-snug text-gray-900">{entry.titleBn}</p>
                <p className="text-xs text-warm-muted mt-0.5">
                  {dateBn} • {timeBn}
                  {entry.topicNameBn && ` • ${entry.topicNameBn}`}
                </p>
                {entry.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{entry.description}</p>}
              </div>
              {clickable && (
                <svg className="w-4 h-4 text-warm-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          );

          return clickable ? (
            <Link key={entry.id} href={`/prep/topics/${entry.topicSlug}/exam`}>{inner}</Link>
          ) : (
            <div key={entry.id}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

// ── Community panel ───────────────────────────────────────────────────────────

function CommunityPanel({ data, color }: { data: PrepCategoryDetail; color: string }) {
  const { t } = useLanguage();

  const waNumberDigits = data.contactPhone
    ? data.contactPhone.replace(/[^\d+]/g, '').replace(/^\+/, '')
    : null;

  const links = [
    data.facebookGroupUrl && {
      key: 'fb-group',
      href: data.facebookGroupUrl,
      label: t('ফেসবুক গ্রুপে যোগ দিন', 'Join Facebook Group'),
      color: '#1877F2',
      bg: '#EFF6FF',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 5 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 17 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
      ),
    },
    data.facebookPageUrl && {
      key: 'fb-page',
      href: data.facebookPageUrl,
      label: t('ফেসবুক পেজ ফলো করুন', 'Follow Facebook Page'),
      color: '#1877F2',
      bg: '#EFF6FF',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 5 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 17 22 12c0-5.523-4.477-10-10-10z" />
        </svg>
      ),
    },
    data.whatsappGroupUrl && {
      key: 'wa-group',
      href: data.whatsappGroupUrl,
      label: t('হোয়াটসঅ্যাপ গ্রুপে যোগ দিন', 'Join WhatsApp Group'),
      color: '#25D366',
      bg: '#F0FDF4',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12.004 2c-5.523 0-10 4.477-10 10 0 1.767.464 3.5 1.345 5.023L2 22l5.128-1.345A9.955 9.955 0 0012.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.246a8.2 8.2 0 01-4.184-1.142l-.3-.178-3.043.798.812-2.966-.195-.305a8.222 8.222 0 01-1.263-4.397c0-4.542 3.696-8.238 8.177-8.238 4.482 0 8.178 3.696 8.178 8.238 0 4.542-3.696 8.19-8.178 8.19z" />
        </svg>
      ),
    },
    waNumberDigits && {
      key: 'wa-dm',
      href: `https://wa.me/${waNumberDigits}`,
      label: t('সরাসরি হোয়াটসঅ্যাপে মেসেজ করুন', 'Message us on WhatsApp'),
      color: '#25D366',
      bg: '#F0FDF4',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12.004 2c-5.523 0-10 4.477-10 10 0 1.767.464 3.5 1.345 5.023L2 22l5.128-1.345A9.955 9.955 0 0012.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.246a8.2 8.2 0 01-4.184-1.142l-.3-.178-3.043.798.812-2.966-.195-.305a8.222 8.222 0 01-1.263-4.397c0-4.542 3.696-8.238 8.177-8.238 4.482 0 8.178 3.696 8.178 8.238 0 4.542-3.696 8.19-8.178 8.19z" />
        </svg>
      ),
    },
  ].filter(Boolean) as { key: string; href: string; label: string; color: string; bg: string; icon: React.ReactNode }[];

  if (links.length === 0) return null;

  return (
    <div className="rounded-2xl border border-warm-border bg-white p-5">
      <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        {t('কমিউনিটিতে যোগ দিন', 'Join the Community')}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map(l => (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-warm-border px-4 py-3 hover:shadow-sm transition-all"
            style={{ background: l.bg }}
          >
            <span className="shrink-0" style={{ color: l.color }}>{l.icon}</span>
            <span className="text-sm font-semibold text-gray-800">{l.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PrepCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { t } = useLanguage();
  const { user, openModal } = useAuth();

  const [data, setData] = useState<PrepCategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [myRequest, setMyRequest] = useState<EnrollmentRequest | null | undefined>(undefined); // undefined = not loaded
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getPrepCategory(slug, user?.token ?? undefined)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    getPaymentConfig().then(setPaymentConfig).catch(() => {});
  }, [slug, user]);

  // load existing request once we know user + data
  useEffect(() => {
    if (!user?.token || !data) { setMyRequest(null); return; }
    if (data.enrollmentType !== 'PAID' || data.isEnrolled) { setMyRequest(null); return; }
    getMyEnrollmentRequest(user.token, data.id)
      .then(setMyRequest)
      .catch(() => setMyRequest(null));
  }, [user, data]);

  const color = data?.colorHex ?? '#1D4ED8';
  const isLocked = data != null && data.enrollmentType === 'PAID' && !data.isEnrolled;

  const renderCTA = () => {
    if (!isLocked) {
      if (!data || data.topics.length === 0) return null;
      return (
        <Link
          href={`/prep/topics/${data.topics[0].slug}`}
          className="flex items-center justify-center gap-2 w-full rounded-2xl py-4 font-bold text-white text-sm transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)` }}
        >
          {t('শেখা শুরু করুন', 'Start Learning')}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      );
    }

    if (!user) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm text-amber-800 mb-4">
            {t('পেমেন্ট করতে প্রথমে লগইন করুন', 'Please log in to make a payment')}
          </p>
          <button
            onClick={() => openModal('login')}
            className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-primary-dark transition-colors"
          >
            {t('লগইন করুন', 'Log In')}
          </button>
        </div>
      );
    }

    if (myRequest === undefined) return null; // still loading

    if (myRequest?.status === 'PENDING') return <PendingCard req={myRequest} />;

    if (myRequest?.status === 'REJECTED') {
      return <RejectedCard req={myRequest} onRetry={() => setMyRequest(null)} />;
    }

    // no request yet OR rejected (after reset) — show payment CTA
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{t('ভর্তি প্রয়োজন', 'Enrollment Required')}</p>
            {data?.price != null && (
              <p className="text-amber-600 font-bold text-lg leading-tight">{data.price} {data.currency}</p>
            )}
          </div>
        </div>
        <p className="text-sm text-amber-800 leading-relaxed mb-4">
          {t(
            'bKash বা Rocket-এ পেমেন্ট করুন এবং ট্রানজেকশন আইডি জমা দিন। ১ ঘণ্টার মধ্যে যাচাই করে অ্যাক্সেস দেওয়া হবে।',
            'Pay via bKash or Rocket and submit your transaction ID. Access will be granted within 1 hour after verification.'
          )}
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          {t('পেমেন্ট করুন', 'Pay Now')}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link href="/prep" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('প্রস্তুতি', 'Preparation')}
        </Link>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-white rounded-2xl border border-warm-border" />
            <div className="h-6 bg-gray-200 rounded w-40" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-white rounded-xl border border-warm-border" />
              ))}
            </div>
          </div>
        ) : error || !data ? (
          <div className="text-center py-20 text-warm-muted">{t('ক্যাটাগরি পাওয়া যায়নি', 'Category not found')}</div>
        ) : (
          <div className="space-y-6">

            {/* ── Hero card ── */}
            <div className="rounded-2xl border border-warm-border overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${isLocked ? '#9CA3AF18' : `${color}18`} 0%, ${isLocked ? '#9CA3AF30' : `${color}30`} 100%)` }}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                    style={{ background: isLocked ? '#E5E7EB' : `${color}22`, borderColor: isLocked ? '#D1D5DB' : `${color}44` }}>
                    {isLocked ? (
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    ) : (
                      <span className="text-3xl font-black select-none" style={{ color }}>{data.nameBn.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${color}22`, color }}>
                      {t('চাকরির প্রস্তুতি', 'Job Preparation')}
                    </div>
                    {data.enrollmentType === 'PAID' ? (
                      isLocked ? (
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          🔒 {data.price != null ? `${data.price} ${data.currency}` : t('পেইড', 'PAID')}
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">✓ {t('ভর্তি হয়েছেন', 'Enrolled')}</span>
                      )
                    ) : (
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{t('বিনামূল্যে', 'FREE')}</span>
                    )}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{data.nameBn}</h1>
                {data.nameEn && <p className="text-warm-muted text-sm mt-0.5">{data.nameEn}</p>}
                {data.description && <p className="text-sm text-gray-600 mt-3 leading-relaxed">{data.description}</p>}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-black/5">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: isLocked ? '#9CA3AF' : color }}>{data.topics.length}</div>
                    <div className="text-xs text-warm-muted">{t('বিষয়', 'Topics')}</div>
                  </div>
                  <div className="w-px h-8 bg-black/10" />
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: isLocked ? '#9CA3AF' : color }}>{data.totalContents}</div>
                    <div className="text-xs text-warm-muted">{t('কন্টেন্ট', 'Contents')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Curriculum ── */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                {t('পাঠ্যক্রম', 'Curriculum')}
              </h2>
              <div className="space-y-2">
                {data.topics.map(topic => (
                  <CurriculumCard key={topic.id} topic={topic} color={color} locked={isLocked} />
                ))}
                {data.topics.length === 0 && (
                  <div className="text-center py-12 text-warm-muted text-sm">{t('এখনো কোনো বিষয় যোগ করা হয়নি', 'No topics added yet')}</div>
                )}
              </div>
            </div>

            {/* ── Exam routine ── */}
            <RoutinePanel data={data} color={color} locked={isLocked} />

            {/* ── Community panel ── */}
            <CommunityPanel data={data} color={color} />

            {/* ── CTA ── */}
            {renderCTA()}

          </div>
        )}
      </main>

      <Footer />

      {/* Payment modal */}
      {showModal && data && paymentConfig && user?.token && (
        <PaymentModal
          data={data}
          config={paymentConfig}
          token={user.token}
          onClose={() => setShowModal(false)}
          onSubmitted={(req) => { setMyRequest(req); setShowModal(false); }}
        />
      )}
    </div>
  );
}
