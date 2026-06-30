'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { saveJob, checkJobSaved, removeSavedJob, getSavedJobs } from '@/lib/api';

interface Props {
  postId: number;
}

export default function SaveJobButton({ postId }: Props) {
  const { user, openModal } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user?.token) { setChecked(true); return; }
    checkJobSaved(user.token, postId)
      .then(async ({ saved: isSaved }) => {
        setSaved(isSaved);
        if (isSaved) {
          // get the saved job id so we can remove it
          const jobs = await getSavedJobs(user.token);
          const match = jobs.find(j => j.post.id === postId);
          if (match) setSavedId(match.id);
        }
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [user, postId]);

  const handleClick = async () => {
    if (!user) { openModal('login'); return; }
    setLoading(true);
    try {
      if (saved && savedId) {
        await removeSavedJob(user.token, savedId);
        setSaved(false);
        setSavedId(null);
      } else {
        const result = await saveJob(user.token, postId);
        setSaved(true);
        setSavedId(result.id);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!checked) return <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm border-2 transition-all ${
          saved
            ? 'bg-primary-50 border-primary text-primary hover:bg-red-50 hover:border-red-400 hover:text-red-600'
            : 'bg-white border-warm-border text-gray-700 hover:border-primary hover:text-primary'
        }`}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : saved ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )}
        {saved
          ? t('✓ সংরক্ষিত (সরাতে ক্লিক করুন)', '✓ Saved (click to remove)')
          : t('💾 চাকরিটি সংরক্ষণ করুন', '💾 Save this job')}
      </button>

      {saved && (
        <button
          onClick={() => router.push('/profile')}
          className="w-full text-xs text-center text-primary-600 hover:underline"
        >
          {t('প্রোফাইলে ট্র্যাক করুন →', 'Track in profile →')}
        </button>
      )}
    </div>
  );
}
