import type { Post } from './types';

function formatBn(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Builds a real, data-driven Bangla paragraph describing this specific post —
 * organization, category, qualification, location, vacancy count and dates —
 * so every job page carries genuine substantive text even when the admin
 * leaves the optional `description` field blank. Wording adapts per post type
 * (a result announcement reads differently from a circular or an admit card).
 */
export function buildPostSummary(post: Post): string {
  const org = post.organizationName?.trim();
  const categoryName = post.category?.nameBn;
  const slug = post.postType?.slug ?? 'job-circular';
  const start = formatBn(post.applicationStart);
  const end = formatBn(post.applicationEnd);
  const sentences: string[] = [];

  const subject = org
    ? `${org}${categoryName ? ` ${categoryName} বিভাগে` : ''}`
    : categoryName
      ? `${categoryName} বিভাগে`
      : 'এই প্রতিষ্ঠান';

  const vacancyPhrase = post.vacancyCount ? `মোট ${post.vacancyCount}টি পদে ` : '';

  switch (slug) {
    case 'admit-card':
      sentences.push(`${subject} নিয়োগ পরীক্ষার প্রবেশপত্র প্রকাশ করা হয়েছে।`);
      if (start && end) sentences.push(`প্রবেশপত্র ডাউনলোড করা যাবে ${start} থেকে ${end} পর্যন্ত।`);
      else if (end) sentences.push(`প্রবেশপত্র ডাউনলোড করার শেষ সময়সীমা ${end}।`);
      sentences.push('প্রবেশপত্র ডাউনলোড ও পরীক্ষা সংক্রান্ত বিস্তারিত তথ্যের জন্য নিচের মূল বিজ্ঞপ্তি (PDF) দেখুন।');
      break;

    case 'exam-date':
      sentences.push(`${subject} নিয়োগ পরীক্ষার সময়সূচী প্রকাশ করা হয়েছে।`);
      if (end || start) sentences.push(`পরীক্ষার তারিখ: ${end ?? start}।`);
      if (post.district) sentences.push(`পরীক্ষা কেন্দ্র সংক্রান্ত তথ্য ${post.district} অঞ্চলসহ মূল বিজ্ঞপ্তিতে উল্লেখ করা হয়েছে।`);
      sentences.push('বিস্তারিত সময়সূচী ও নির্দেশনার জন্য নিচের PDF দেখুন।');
      break;

    case 'job-result':
      sentences.push(`${subject} নিয়োগ পরীক্ষার ফলাফল প্রকাশিত হয়েছে।`);
      if (end || start) sentences.push(`ফলাফল প্রকাশের তারিখ: ${end ?? start}।`);
      sentences.push('উত্তীর্ণ প্রার্থীদের রোল নম্বর ও পরবর্তী ধাপের নির্দেশনার জন্য নিচের সম্পূর্ণ ফলাফল (PDF) দেখুন।');
      break;

    case 'exam-question':
      sentences.push(`${subject} অনুষ্ঠিত নিয়োগ পরীক্ষার প্রশ্নপত্র সংরক্ষণ করা হয়েছে।`);
      if (start || end) sentences.push(`পরীক্ষার তারিখ: ${start ?? end}।`);
      if (post.qualification) sentences.push(`এই পরীক্ষা ${post.qualification} যোগ্যতাসম্পন্ন প্রার্থীদের জন্য অনুষ্ঠিত হয়েছিল।`);
      sentences.push('সম্পূর্ণ প্রশ্নপত্র দেখতে নিচের PDF দেখুন — ভবিষ্যতের পরীক্ষার প্রস্তুতির জন্য এটি সংরক্ষণ করে রাখতে পারেন।');
      break;

    case 'job-circular':
    default:
      sentences.push(`${subject} ${vacancyPhrase}জনবল নিয়োগের জন্য বিজ্ঞপ্তি প্রকাশ করেছে।`);
      if (post.qualification) sentences.push(`আগ্রহী ও যোগ্য প্রার্থীদের জন্য প্রয়োজনীয় শিক্ষাগত যোগ্যতা: ${post.qualification}।`);
      if (post.district) sentences.push(`কর্মস্থল: ${post.district}।`);
      if (start && end) sentences.push(`আবেদন প্রক্রিয়া শুরু হয়েছে ${start} তারিখে এবং আবেদনের শেষ সময়সীমা ${end}।`);
      else if (end) sentences.push(`আবেদনের শেষ তারিখ ${end}।`);
      sentences.push('আবেদনের নিয়ম, প্রয়োজনীয় কাগজপত্র ও অন্যান্য শর্তাবলী সম্পর্কে বিস্তারিত জানতে নিচের মূল বিজ্ঞপ্তি (PDF) মনোযোগ সহকারে পড়ুন।');
      break;
  }

  return sentences.join(' ');
}
