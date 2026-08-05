'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { submitFeedback } from '@/lib/api';

/**
 * Site-wide floating feedback widget — same "always-mounted sibling of
 * children" pattern as AuthModal (see app/layout.tsx). Anonymous-friendly:
 * works whether or not the visitor is logged in (submitFeedback attaches the
 * Authorization header only when a token is available), and pageUrl is
 * captured automatically so admins know where feedback came from.
 */
export default function FeedbackWidget() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setRating(null);
    setMessage('');
    setDone(false);
    setError('');
  };

  const close = () => {
    setOpen(false);
    // Give the close animation a beat before wiping state, so it doesn't
    // visibly flash back to the empty form while the panel is fading out.
    setTimeout(reset, 200);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('মতামত লিখুন');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await submitFeedback(message.trim(), rating ?? undefined, pathname, user?.token);
      setDone(true);
    } catch {
      setError('পাঠাতে সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute bottom-14 right-0 w-72 bg-white rounded-2xl shadow-xl border border-warm-border z-50 text-gray-900 overflow-hidden">
            {done ? (
              <div className="p-5 text-center space-y-2">
                <div className="text-3xl">🙏</div>
                <p className="text-sm font-semibold">ধন্যবাদ আপনার মতামতের জন্য!</p>
                <button
                  onClick={close}
                  className="text-xs text-primary-600 font-semibold mt-1"
                >
                  বন্ধ করুন
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">আপনার মতামত জানান</h3>
                  <button onClick={close} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                </div>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n === rating ? null : n)}
                      className={`text-xl leading-none transition-colors ${rating && n <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                      aria-label={`${n} স্টার`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="আপনার পরামর্শ বা মতামত লিখুন..."
                  rows={4}
                  className="w-full text-sm border border-warm-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-300"
                />

                {error && <p className="text-xs text-red-600">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full text-sm font-semibold bg-primary-600 text-white rounded-xl py-2 hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'পাঠানো হচ্ছে...' : 'পাঠান'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center transition-colors"
        aria-label="মতামত দিন"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  );
}
