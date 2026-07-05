'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminGetAnalytics } from '@/lib/api';

type Analytics = Awaited<ReturnType<typeof adminGetAnalytics>>;

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData]       = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('admin_token');
    if (!t) { router.push('/admin/login'); return; }
    adminGetAnalytics(t)
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [router]);

  const fmt = (n: number) => n.toLocaleString('bn-BD');

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center text-primary animate-pulse">
      লোড হচ্ছে...
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-primary-900 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin/dashboard" className="text-primary-300 hover:text-white text-sm">← ড্যাশবোর্ড</Link>
        <h1 className="font-bold">অ্যানালিটিক্স</h1>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'প্রকাশিত বিজ্ঞপ্তি', value: data?.totalPublished ?? 0, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'ড্রাফট', value: data?.totalDraft ?? 0, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
            { label: 'মোট ব্যবহারকারী', value: data?.totalUsers ?? 0, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
            { label: 'মোট ভিউ', value: data?.totalViews ?? 0, color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
          ].map((s) => (
            <div key={s.label} className={`card p-5 border ${s.bg}`}>
              <p className="text-xs text-warm-muted mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{fmt(s.value)}</p>
            </div>
          ))}
        </div>

        {/* Posts published last 30 days */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-5 text-base">গত ৩০ দিনের প্রকাশনা</h2>
          {data?.postsByDay && data.postsByDay.length > 0 ? (
            <div className="space-y-2">
              {(() => {
                const max = Math.max(...data.postsByDay.map((d) => d.count), 1);
                return data.postsByDay.map((d) => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs text-warm-muted w-24 shrink-0">
                      {new Date(d.date).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex-1 bg-warm-border rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full transition-all duration-500"
                        style={{ width: `${(d.count / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-6 text-right">
                      {d.count.toLocaleString('bn-BD')}
                    </span>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="text-sm text-warm-muted">গত ৩০ দিনে কোনো বিজ্ঞপ্তি প্রকাশিত হয়নি।</p>
          )}
        </div>

        {/* Top 10 posts by views */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4 text-base">সর্বোচ্চ দেখা বিজ্ঞপ্তি (শীর্ষ ১০)</h2>
          {data?.topPosts && data.topPosts.length > 0 ? (
            <div className="divide-y divide-warm-border">
              {data.topPosts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-3">
                  <span className="text-lg font-bold text-warm-muted w-7 shrink-0">{(i + 1).toLocaleString('bn-BD')}</span>
                  <Link
                    href={`/admin/posts/${p.id}/edit`}
                    className="flex-1 text-sm font-medium text-gray-900 hover:text-primary truncate"
                  >
                    {p.title}
                  </Link>
                  <span className="flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full shrink-0">
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    {p.views.toLocaleString('bn-BD')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-warm-muted">এখনো কোনো ভিউ নেই।</p>
          )}
        </div>

      </div>
    </div>
  );
}
