'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function CopyLinkButton() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="btn-outline w-full justify-center">
      {copied ? t('✅ লিংক কপি হয়েছে', '✅ Link copied') : t('🔗 লিংক কপি করুন', '🔗 Copy link')}
    </button>
  );
}
