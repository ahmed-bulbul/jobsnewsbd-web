'use client';

import { useState } from 'react';

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="btn-outline w-full justify-center">
      {copied ? '✅ লিংক কপি হয়েছে' : '🔗 লিংক কপি করুন'}
    </button>
  );
}
