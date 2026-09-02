'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getPrepCategories, getPrepCategoryGroups } from '@/lib/api';
import type { PrepCategory, PrepCategoryGroup } from '@/lib/types';

const FALLBACK_COLORS: Record<string, string> = {
  bcs:         '#1D4ED8',
  govt:        '#0F766E',
  bank:        '#7C3AED',
  it:          '#B45309',
  'teacher-reg': '#BE185D',
};

function CategoryCard({ cat }: { cat: PrepCategory }) {
  const { t } = useLanguage();
  const color = cat.colorHex ?? FALLBACK_COLORS[cat.slug] ?? '#374151';
  const isLocked = cat.enrollmentType === 'PAID' && !cat.isEnrolled;

  return (
    <Link
      href={`/prep/${cat.slug}`}
      className={`group bg-white rounded-2xl border transition-all overflow-hidden flex flex-col relative
        ${isLocked
          ? 'border-warm-border hover:border-amber-300 hover:shadow-md'
          : 'border-warm-border hover:border-primary hover:shadow-lg'
        }`}
    >
      {/* Enrollment badge */}
      {cat.enrollmentType === 'PAID' && (
        <div className="absolute top-2 right-2 z-10">
          {isLocked ? (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              🔒 {cat.price != null ? `${cat.price} ${cat.currency}` : 'PAID'}
            </span>
          ) : (
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">✓ ভর্তি</span>
          )}
        </div>
      )}

      <div
        className="h-24 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${isLocked ? '#9CA3AF22' : `${color}22`} 0%, ${isLocked ? '#9CA3AF44' : `${color}44`} 100%)` }}
      >
        {isLocked ? (
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        ) : (
          <span className="text-4xl font-black select-none" style={{ color }}>
            {cat.nameBn.charAt(0)}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className={`font-bold text-base leading-snug ${isLocked ? 'text-gray-500' : 'text-gray-900 group-hover:text-primary transition-colors'}`}>
          {cat.nameBn}
        </h3>
        {cat.nameEn && (
          <p className="text-xs text-warm-muted">{cat.nameEn}</p>
        )}
        <div className="mt-auto pt-3 flex items-center gap-1 text-xs font-medium" style={{ color: isLocked ? '#D97706' : color }}>
          {isLocked ? (
            t('ভর্তি প্রয়োজন', 'Enrollment required')
          ) : (
            <>
              {t('বিষয় দেখুন', 'View topics')}
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

// Parent-category card — same visual language as CategoryCard, but represents
// a whole group (e.g. IT / BCS / General) and drills into that group's
// categories on click instead of navigating straight to a category.
function GroupCard({
  label, nameEn, color, icon, count, onClick,
}: {
  label: string; nameEn?: string | null; color: string; icon?: string | null; count: number; onClick: () => void;
}) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl border border-warm-border hover:border-primary hover:shadow-lg transition-all overflow-hidden flex flex-col text-left"
    >
      <div
        className="h-24 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)` }}
      >
        <span className="text-4xl font-black select-none" style={{ color }}>
          {icon || label.charAt(0)}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <h3 className="font-bold text-base leading-snug text-gray-900 group-hover:text-primary transition-colors">
          {label}
        </h3>
        {nameEn && <p className="text-xs text-warm-muted">{nameEn}</p>}
        <div className="mt-auto pt-3 flex items-center gap-1 text-xs font-medium" style={{ color }}>
          {count} {t('টি ক্যাটাগরি', 'categories')}
          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-warm-border overflow-hidden animate-pulse">
      <div className="h-24 bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function PrepPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [categories, setCategories] = useState<PrepCategory[]>([]);
  const [groups, setGroups] = useState<PrepCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Which parent group's categories are currently drilled into — null shows
  // the top-level list of parent groups instead. 'ungrouped' is the
  // synthetic "অন্যান্য" bucket rather than a real PrepCategoryGroup id.
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getPrepCategories(user?.token ?? undefined),
      getPrepCategoryGroups().catch(() => []), // grouping is a display nicety — a failed fetch shouldn't block the category grid itself
    ])
      .then(([cats, gs]) => { setCategories(cats); setGroups(gs); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [user]);

  // Parent-group sections (in group displayOrder), plus an "other" bucket
  // for categories with no group — same shape as the admin page's grouping.
  const sections = [
    ...groups.map((g) => ({
      key: `g-${g.id}`, label: g.nameBn, nameEn: g.nameEn, color: g.colorHex ?? '#374151', icon: g.icon,
      items: categories.filter((c) => c.groupId === g.id),
    })),
    {
      key: 'ungrouped', label: t('অন্যান্য', 'Other'), nameEn: null as string | null, color: '#374151', icon: null as string | null,
      items: categories.filter((c) => c.groupId == null),
    },
  ].filter((s) => s.items.length > 0);
  // Show the parent-group drill-down as soon as at least one real parent
  // group has a category assigned — even if every category ends up under
  // a single group (e.g. everything is under "IT" so far, nothing
  // ungrouped yet). Requiring 2+ non-empty sections would hide the parent
  // category entirely in that case, which defeats the point of grouping.
  const isGrouped = sections.some((s) => s.key !== 'ungrouped');
  const selectedSection = sections.find((s) => s.key === selectedGroupKey) ?? null;

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {isGrouped && selectedSection ? (
          <div className="mb-8">
            <button
              onClick={() => setSelectedGroupKey(null)}
              className="flex items-center gap-1 text-sm font-medium text-warm-muted hover:text-primary transition-colors mb-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t('সব প্যারেন্ট ক্যাটাগরি', 'All parent categories')}
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{selectedSection.label}</h1>
            {selectedSection.nameEn && (
              <p className="text-warm-muted mt-1 text-sm">{selectedSection.nameEn}</p>
            )}
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('চাকরির প্রস্তুতি', 'Job Preparation')}
            </h1>
            <p className="text-warm-muted mt-1 text-sm">
              {isGrouped
                ? t('একটি প্যারেন্ট ক্যাটাগরি বেছে নিন', 'Choose a parent category')
                : t('ক্যাটাগরি বেছে নিন এবং প্রস্তুতি শুরু করুন', 'Choose a category and start preparing')}
            </p>
          </div>
        )}

        {error ? (
          <div className="text-center py-20 text-warm-muted">
            {t('লোড করতে ব্যর্থ হয়েছে', 'Failed to load')}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : isGrouped && selectedSection ? (
          // Step 2: categories within the chosen parent group.
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {selectedSection.items.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
          </div>
        ) : isGrouped ? (
          // Step 1: parent groups only — drill into one to see its categories.
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sections.map((section) => (
              <GroupCard
                key={section.key}
                label={section.label}
                nameEn={section.nameEn}
                color={section.color}
                icon={section.icon}
                count={section.items.length}
                onClick={() => setSelectedGroupKey(section.key)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
