'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function T({ bn, en }: { bn: string; en: string }) {
  const { t } = useLanguage();
  return <>{t(bn, en)}</>;
}
