'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/ui/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getMyJobExperiences } from '@/lib/api';
import type { MyJobExperience, JobExperienceStatus } from '@/lib/types';

const STATUS_META: Record<JobExperienceStatus, { bn: string; en: string; bg: string; color: string }> = {
  PENDING:  { bn: 'অপেক্ষমাণ',  en: 'Pending',  bg: '#FFFBEB', color: '#B45309' },
  APPROVED: { bn: 'অনুমোদিত',  en: 'Approved', bg: '#ECFDF5', color: '#059669' },
  REJECTED: { bn: 'বাতিল',     en: 'Rejected', bg: '#FEF2F2', color: '#DC2626' },
};

function MyExperienceCard({ exp }: { exp: MyJobExperience }) {
  const { t, lang } = useLanguage();
  const meta = STATUS_META[exp.status];
  return (
    <div className="bg-white rounded-2xl border border-warm-border p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-gray-900 leading-snug">{exp.title}</h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: meta.bg, color: meta.color }}>
          {t(meta.bn, meta.en)}
        </span>
      </div>
      <p className="text-sm text-warm-muted mb-2">
        {exp.organizationName}{exp.positionTitle ? ` • ${exp.positionTitle}` : ''}
      </p>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">{exp.body}</p>
      {exp.status === 'REJECTED' && exp.adminNote && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2">{t('কারণ', 'Reason')}: {exp.adminNote}</p>
      )}
      <p className="text-xs text-warm-muted">
        {new Date(exp.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        {exp.status === 'APPROVED' && <> • 👁 {exp.viewCount}</>}
      </p>
    </div>
  );
}

export default function MyJobExperiencesPage() {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const [experiences, setExperiences] = useState<MyJobExperience[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.token) { setLoading(false); return; }
    setLoading(true);
    getMyJobExperiences(user.token, page, 20)
      .then((res) => { setExperiences(res.content); setTotalPages(res.totalPages); })
      .catch(() => { setExperiences([]); setTotalPages(0); })
      .finally(() => setLoading(false));
  }, [user, page]);

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link href="/study-corner/job-experience" className="inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-primary mb-6 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('চাকরির অভিজ্ঞতা', 'Job Experiences')}
        </Link>

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{t('আমার পোস্টসমূহ', 'My Posts')}</h1>
          {user && (
            <Link href="/study-corner/job-experience/submit" className="btn-primary text-sm px-3 py-2">
              + {t('নতুন পোস্ট', 'New Post')}
            </Link>
          )}
        </div>

        {!user ? (
          <div className="card p-10 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t('লগইন প্রয়োজন', 'Login Required')}</h2>
            <button onClick={() => openModal('login')} className="btn-primary px-8 py-2.5 mt-2">
              {t('লগইন করুন', 'Login')}
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-warm-border animate-pulse" />)}
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('আপনি এখনো কোনো অভিজ্ঞতা শেয়ার করেননি', "You haven't shared any experiences yet")}
          </div>
        ) : (
          <div className="space-y-3">
            {experiences.map((exp) => <MyExperienceCard key={exp.id} exp={exp} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Footer />
    </div>
  );
}
