'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Pagination from '@/components/ui/Pagination';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getJobExperiences } from '@/lib/api';
import type { JobExperience, JobExperienceOutcome } from '@/lib/types';

const OUTCOME_META: Record<JobExperienceOutcome, { bn: string; en: string; bg: string; color: string }> = {
  SELECTED: { bn: 'নির্বাচিত', en: 'Selected', bg: '#ECFDF5', color: '#059669' },
  REJECTED: { bn: 'প্রত্যাখ্যাত', en: 'Rejected', bg: '#FEF2F2', color: '#DC2626' },
  WAITING:  { bn: 'অপেক্ষমান',   en: 'Waiting',  bg: '#FFFBEB', color: '#B45309' },
};

const STAGE_META: Record<string, { bn: string; en: string }> = {
  WRITTEN: { bn: 'লিখিত পরীক্ষা', en: 'Written Exam' },
  VIVA:    { bn: 'ভাইভা',         en: 'Viva' },
  FINAL:   { bn: 'চূড়ান্ত ফলাফল', en: 'Final Result' },
};

function OutcomeBadge({ outcome }: { outcome: JobExperienceOutcome }) {
  const { t } = useLanguage();
  const m = OUTCOME_META[outcome];
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: m.bg, color: m.color }}>
      {t(m.bn, m.en)}
    </span>
  );
}

function ExperienceCard({ exp }: { exp: JobExperience }) {
  const { t, lang } = useLanguage();
  const stage = STAGE_META[exp.stageReached];
  return (
    <Link
      href={`/study-corner/job-experience/${exp.id}`}
      className="block bg-white rounded-2xl border border-warm-border hover:border-primary hover:shadow-md transition-all p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-gray-900 leading-snug">{exp.title}</h3>
        <OutcomeBadge outcome={exp.outcome} />
      </div>
      <p className="text-sm text-warm-muted mb-2">
        {exp.organizationName}{exp.positionTitle ? ` • ${exp.positionTitle}` : ''}
      </p>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">{exp.body}</p>
      <div className="flex items-center justify-between text-xs text-warm-muted flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <span>{exp.isAnonymous ? t('বেনামী', 'Anonymous') : exp.authorName}</span>
          <span>•</span>
          <span>{stage ? t(stage.bn, stage.en) : exp.stageReached}</span>
        </span>
        <span className="flex items-center gap-3">
          <span>👁 {exp.viewCount}</span>
          <span>{new Date(exp.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </span>
      </div>
    </Link>
  );
}

export default function JobExperienceListPage() {
  const { t } = useLanguage();
  const { user, openModal } = useAuth();
  const [experiences, setExperiences] = useState<JobExperience[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [outcome, setOutcome] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getJobExperiences({ outcome: outcome || undefined, q: q || undefined, page, size: 10 })
      .then((res) => { setExperiences(res.content); setTotalPages(res.totalPages); })
      .catch(() => { setExperiences([]); setTotalPages(0); })
      .finally(() => setLoading(false));
  }, [outcome, q, page]);

  const handleShareClick = () => {
    if (!user) { openModal('login'); return; }
  };

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-warm-muted mb-6">
          <Link href="/study-corner" className="hover:text-primary transition-colors">{t('স্টাডি কর্নার', 'Study Corner')}</Link>
          <span>›</span>
          <span className="text-gray-700 font-medium">{t('চাকরির অভিজ্ঞতা', 'Job Experiences')}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('চাকরির অভিজ্ঞতা শেয়ার করুন', 'Share Job Experience')}</h1>
            <p className="mt-1 text-sm text-warm-muted">
              {t('অন্যদের আবেদন ও ইন্টারভিউ অভিজ্ঞতা পড়ুন, নিজেরটাও শেয়ার করুন', "Read others' application and interview journeys, and share your own")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {user && (
              <Link href="/study-corner/job-experience/mine" className="btn-outline text-xs sm:text-sm px-3 py-2">
                {t('আমার পোস্ট', 'My Posts')}
              </Link>
            )}
            {user ? (
              <Link href="/study-corner/job-experience/submit" className="btn-primary text-xs sm:text-sm px-3 py-2">
                + {t('শেয়ার করুন', 'Share')}
              </Link>
            ) : (
              <button onClick={handleShareClick} className="btn-primary text-xs sm:text-sm px-3 py-2">
                + {t('শেয়ার করুন', 'Share')}
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={outcome}
            onChange={(e) => { setOutcome(e.target.value); setPage(0); }}
            className="input text-sm w-auto"
          >
            <option value="">{t('সব ফলাফল', 'All outcomes')}</option>
            <option value="SELECTED">{t('নির্বাচিত', 'Selected')}</option>
            <option value="REJECTED">{t('প্রত্যাখ্যাত', 'Rejected')}</option>
            <option value="WAITING">{t('অপেক্ষমান', 'Waiting')}</option>
          </select>
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder={t('প্রতিষ্ঠান বা শিরোনাম দিয়ে খুঁজুন', 'Search by organization or title')}
            className="input text-sm flex-1 min-w-[200px]"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl border border-warm-border animate-pulse" />)}
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-20 text-warm-muted text-sm">
            {t('কোনো অভিজ্ঞতা পাওয়া যায়নি', 'No experiences found')}
          </div>
        ) : (
          <div className="space-y-3">
            {experiences.map((exp) => <ExperienceCard key={exp.id} exp={exp} />)}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Footer />
    </div>
  );
}
