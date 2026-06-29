const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

export function toBanglaDigits(n: number | string): string {
  return String(n)
    .split('')
    .map((d) => BANGLA_DIGITS[parseInt(d)] ?? d)
    .join('');
}

export function formatBanglaDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${toBanglaDigits(d.getDate())} ${BANGLA_MONTHS[d.getMonth()]} ${toBanglaDigits(d.getFullYear())}`;
}

export function formatEnDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function getDaysRemaining(endStr: string | null | undefined): number {
  if (!endStr) return Infinity;
  const end = new Date(endStr).getTime();
  const now = Date.now();
  return Math.ceil((end - now) / 86_400_000);
}

export function getDeadlineProgress(
  startStr: string | null | undefined,
  endStr: string | null | undefined,
): number {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr).getTime();
  const end = new Date(endStr).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function categoryTypeColor(categoryTypeSlug: string | undefined): string {
  switch (categoryTypeSlug) {
    case 'government': return 'border-primary-500';
    case 'bank':       return 'border-blue-600';
    case 'ngo':        return 'border-amber-500';
    case 'private':    return 'border-violet-500';
    default:           return 'border-warm-muted';
  }
}

export function categoryTypeAccent(categoryTypeSlug: string | undefined): string {
  switch (categoryTypeSlug) {
    case 'government': return 'bg-primary-50 text-primary-700';
    case 'bank':       return 'bg-blue-50 text-blue-700';
    case 'ngo':        return 'bg-amber-50 text-amber-700';
    case 'private':    return 'bg-violet-50 text-violet-700';
    default:           return 'bg-gray-100 text-gray-600';
  }
}

export function statusLabel(status: string, lang: 'bn' | 'en'): string {
  const map: Record<string, { bn: string; en: string }> = {
    ONGOING:  { bn: 'চলমান',          en: 'Ongoing' },
    UPCOMING: { bn: 'শীঘ্রই আসছে',   en: 'Upcoming' },
    CLOSED:   { bn: 'আবেদন বন্ধ',    en: 'Closed' },
    EXPIRED:  { bn: 'মেয়াদ শেষ',     en: 'Expired' },
  };
  return map[status]?.[lang] ?? status;
}

export function statusColors(status: string): string {
  switch (status) {
    case 'ONGOING':  return 'bg-emerald-100 text-emerald-800';
    case 'UPCOMING': return 'bg-sky-100 text-sky-800';
    case 'CLOSED':   return 'bg-orange-100 text-orange-800';
    case 'EXPIRED':  return 'bg-gray-100 text-gray-500';
    default:         return 'bg-gray-100 text-gray-600';
  }
}

export function categoryTypeEmoji(slug: string): string {
  switch (slug) {
    case 'government': return '🏛️';
    case 'bank':       return '🏦';
    case 'ngo':        return '🌿';
    case 'private':    return '🏢';
    default:           return '📋';
  }
}
