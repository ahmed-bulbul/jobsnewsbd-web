'use client';

import { useLanguage } from '@/context/LanguageContext';
import { statusColors, statusLabel } from '@/lib/utils';
import type { PostStatus } from '@/lib/types';

export default function StatusBadge({ status }: { status: PostStatus }) {
  const { lang } = useLanguage();
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColors(status)}`}>
      {statusLabel(status, lang)}
    </span>
  );
}
