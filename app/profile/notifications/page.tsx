'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/api';
import type { NotificationPreference } from '@/lib/types';

// Static copy per topic — the backend's `description` field is English-only
// (meant for logs/admin), so the bilingual labels live here. `hasEmail`
// reflects reality: deadline reminders are push-only today (no email path
// in DeadlineReminderService), so there's no point showing a switch for a
// channel that never fires.
const TOPIC_COPY: Record<NotificationPreference['topic'], { titleBn: string; titleEn: string; descBn: string; descEn: string; hasEmail: boolean }> = {
  JOB_CIRCULAR: {
    titleBn: 'চাকরির বিজ্ঞপ্তি',
    titleEn: 'Job Circular Updates',
    descBn: 'নতুন চাকরির বিজ্ঞপ্তি, ভর্তি পরীক্ষার তারিখ, ফলাফল ও প্রবেশপত্র সংক্রান্ত আপডেট',
    descEn: 'New circulars, admit cards, exam dates, and results',
    hasEmail: true,
  },
  EXAM_SET: {
    titleBn: 'নতুন পরীক্ষা',
    titleEn: 'New Exam Notifications',
    descBn: 'আপনার এনরোল করা বিষয়ে নতুন পরীক্ষা প্রকাশিত হলে জানানো হবে',
    descEn: 'When a new exam is published in a topic you’re enrolled in',
    hasEmail: true,
  },
  DEADLINE_REMINDER: {
    titleBn: 'শেষ তারিখ মনে করিয়ে দেওয়া',
    titleEn: 'Deadline Reminders',
    descBn: 'আপনার সংরক্ষিত চাকরির আবেদনের শেষ তারিখ ঘনিয়ে এলে',
    descEn: 'When a job you saved is close to its application deadline',
    hasEmail: false,
  },
  EXAM_ROUTINE: {
    titleBn: 'পরীক্ষার রুটিন',
    titleEn: 'Exam Routine Updates',
    descBn: 'আপনার এনরোল করা কোর্সের পরীক্ষার রুটিন প্রকাশ বা পরিবর্তন হলে জানানো হবে',
    descEn: 'When the exam routine is published or changed for a category you’re enrolled in',
    hasEmail: true,
  },
};

const TOPIC_ORDER: NotificationPreference['topic'][] = ['JOB_CIRCULAR', 'EXAM_SET', 'EXAM_ROUTINE', 'DEADLINE_REMINDER'];

function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function TopicRow({
  pref,
  onToggle,
  savingKey,
}: {
  pref: NotificationPreference;
  onToggle: (channel: 'push' | 'email') => void;
  savingKey: string | null;
}) {
  const { t } = useLanguage();
  const copy = TOPIC_COPY[pref.topic];
  const savingPush  = savingKey === `${pref.topic}-push`;
  const savingEmail = savingKey === `${pref.topic}-email`;

  return (
    <div className="bg-white rounded-2xl border border-warm-border p-5">
      <p className="font-semibold text-gray-900 text-sm">{t(copy.titleBn, copy.titleEn)}</p>
      <p className="text-xs text-warm-muted mt-0.5 leading-relaxed">{t(copy.descBn, copy.descEn)}</p>

      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2.5">
          <Switch checked={pref.pushEnabled} onChange={() => onToggle('push')} disabled={savingPush} />
          <span className="text-xs font-medium text-gray-600">
            📱 {t('পুশ', 'Push')}{savingPush && <span className="text-warm-muted"> …</span>}
          </span>
        </div>

        {copy.hasEmail && (
          <div className="flex items-center gap-2.5">
            <Switch checked={pref.emailEnabled} onChange={() => onToggle('email')} disabled={savingEmail} />
            <span className="text-xs font-medium text-gray-600">
              ✉️ {t('ইমেইল', 'Email')}{savingEmail && <span className="text-warm-muted"> …</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const { user, openModal } = useAuth();
  const { t } = useLanguage();
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.token) { setLoading(false); return; }
    getNotificationPreferences(user.token)
      .then(setPrefs)
      .catch(() => setError(t('লোড করা যায়নি', 'Failed to load')))
      .finally(() => setLoading(false));
  }, [user, t]);

  const handleToggle = async (topic: NotificationPreference['topic'], channel: 'push' | 'email') => {
    if (!user?.token) return;
    const current = prefs.find((p) => p.topic === topic);
    if (!current) return;

    const updated: NotificationPreference = {
      ...current,
      pushEnabled: channel === 'push' ? !current.pushEnabled : current.pushEnabled,
      emailEnabled: channel === 'email' ? !current.emailEnabled : current.emailEnabled,
    };

    // Optimistic update — flip it immediately, roll back only if the save fails.
    setPrefs((prev) => prev.map((p) => (p.topic === topic ? updated : p)));
    setSavingKey(`${topic}-${channel}`);
    setError('');
    try {
      const result = await updateNotificationPreferences(user.token, [
        { topic: updated.topic, pushEnabled: updated.pushEnabled, emailEnabled: updated.emailEnabled },
      ]);
      setPrefs(result);
    } catch {
      setPrefs((prev) => prev.map((p) => (p.topic === topic ? current : p)));
      setError(t('পরিবর্তন সংরক্ষণ করা যায়নি, আবার চেষ্টা করুন', 'Could not save the change, please try again'));
    } finally {
      setSavingKey(null);
    }
  };

  if (!loading && !user) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cream flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔒</div>
            <h2 className="text-xl font-bold text-gray-900">{t('লগইন প্রয়োজন', 'Login required')}</h2>
            <button onClick={() => openModal('login')} className="btn-primary px-6 py-3">
              {t('লগইন করুন', 'Login')}
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div>
            <Link href="/profile" className="text-sm text-warm-muted hover:text-primary transition-colors">
              ← {t('প্রোফাইলে ফিরুন', 'Back to profile')}
            </Link>
            <h1 className="text-xl font-bold text-gray-900 mt-2">🔔 {t('নোটিফিকেশন সেটিংস', 'Notification Settings')}</h1>
            <p className="text-sm text-warm-muted mt-1">
              {t(
                'কোন ধরনের নোটিফিকেশন পেতে চান তা বেছে নিন। পরিবর্তন সাথে সাথে সংরক্ষিত হবে।',
                'Choose which notifications you want to receive. Changes save instantly.',
              )}
            </p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-2xl border border-warm-border animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {TOPIC_ORDER.map((topic) => {
                const pref = prefs.find((p) => p.topic === topic);
                if (!pref) return null;
                return (
                  <TopicRow
                    key={topic}
                    pref={pref}
                    onToggle={(channel) => handleToggle(topic, channel)}
                    savingKey={savingKey}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
