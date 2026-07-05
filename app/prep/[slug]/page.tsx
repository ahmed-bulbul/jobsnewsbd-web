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
  const inner = (
    <>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
        <span className="text-xs font-bold" style={{ color }}>{topic.displayOrder}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm leading-snug ${locked ? 'text-gray-500' : 'text-gray-900'}`}>{topic.nameBn}</p>
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
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
