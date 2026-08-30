'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  adminGetNotificationSummary,
  adminApproveBookListing, adminRejectBookListing,
  adminApproveJobExperience, adminRejectJobExperience,
  adminApproveInstituteReview, adminRejectInstituteReview,
  adminApproveEnrollmentRequest, adminRejectEnrollmentRequest,
  adminMarkFeedbackRead,
} from '@/lib/api';
import type { AdminNotificationItem, AdminNotificationSummary, AdminNotificationType } from '@/lib/types';

const POLL_MS = 30_000;

async function approveItem(token: string, type: AdminNotificationType, id: number) {
  switch (type) {
    case 'BOOK_LISTING': return adminApproveBookListing(token, id);
    case 'JOB_EXPERIENCE': return adminApproveJobExperience(token, id);
    case 'INSTITUTE_REVIEW': return adminApproveInstituteReview(token, id);
    case 'ENROLLMENT_REQUEST': return adminApproveEnrollmentRequest(token, id);
  }
}

async function rejectItem(token: string, type: AdminNotificationType, id: number, note?: string) {
  switch (type) {
    case 'BOOK_LISTING': return adminRejectBookListing(token, id, note);
    case 'JOB_EXPERIENCE': return adminRejectJobExperience(token, id, note);
    case 'INSTITUTE_REVIEW': return adminRejectInstituteReview(token, id, note);
    case 'ENROLLMENT_REQUEST': return adminRejectEnrollmentRequest(token, id, note);
  }
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'এখনই';
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ঘণ্টা আগে`;
  const days = Math.floor(hours / 24);
  return `${days} দিন আগে`;
}

export default function AdminNotificationBell({
  token,
  iconClassName = 'text-primary-300 hover:text-white',
}: {
  token: string;
  /** Icon color classes — default suits a dark header; pass light-surface
   *  classes (e.g. "text-warm-muted hover:text-ink") when placed on a
   *  white topbar. */
  iconClassName?: string;
}) {
  const [summary, setSummary] = useState<AdminNotificationSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [actingKey, setActingKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    adminGetNotificationSummary(token, 5).then(setSummary).catch(() => {});
  }, [token]);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const handleApprove = async (item: AdminNotificationItem) => {
    const key = `${item.type}-${item.id}`;
    setActingKey(key);
    setErrorMsg('');
    try {
      await approveItem(token, item.type, item.id);
      load();
    } catch {
      setErrorMsg('ব্যর্থ হয়েছে');
    } finally {
      setActingKey(null);
    }
  };

  const handleReject = async (item: AdminNotificationItem) => {
    const note = window.prompt('বাতিলের কারণ (ঐচ্ছিক)') ?? undefined;
    const key = `${item.type}-${item.id}`;
    setActingKey(key);
    setErrorMsg('');
    try {
      await rejectItem(token, item.type, item.id, note || undefined);
      load();
    } catch {
      setErrorMsg('ব্যর্থ হয়েছে');
    } finally {
      setActingKey(null);
    }
  };

  const handleMarkRead = async (item: AdminNotificationItem) => {
    const key = `${item.type}-${item.id}`;
    setActingKey(key);
    setErrorMsg('');
    try {
      await adminMarkFeedbackRead(token, item.id);
      load();
    } catch {
      setErrorMsg('ব্যর্থ হয়েছে');
    } finally {
      setActingKey(null);
    }
  };

  const total = summary?.totalPending ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative transition-colors ${iconClassName}`}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {total > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-warm-border z-50 text-gray-900">
            <div className="p-4 border-b border-warm-border flex items-center justify-between">
              <h3 className="font-bold text-sm">নোটিফিকেশন</h3>
              <span className="text-xs text-warm-muted">{total} পেন্ডিং</span>
            </div>

            {summary && (
              <div className="flex flex-wrap gap-1.5 p-3 border-b border-warm-border">
                {summary.categories.map((c) => (
                  <Link
                    key={c.type}
                    href={c.path}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors ${c.count > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {c.labelBn} {c.count > 0 && `(${c.count})`}
                  </Link>
                ))}
              </div>
            )}

            {errorMsg && <p className="text-xs text-red-600 px-4 pt-2">{errorMsg}</p>}

            {!summary ? (
              <p className="text-xs text-warm-muted p-4 text-center">লোড হচ্ছে...</p>
            ) : summary.items.length === 0 ? (
              <p className="text-xs text-warm-muted p-6 text-center">কোনো নতুন নোটিফিকেশন নেই</p>
            ) : (
              <div className="divide-y divide-warm-border">
                {summary.items.map((item) => {
                  const key = `${item.type}-${item.id}`;
                  const acting = actingKey === key;
                  return (
                    <div key={key} className="p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                        <span className="text-[10px] text-warm-muted shrink-0">{timeAgo(item.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-warm-muted">{item.subtitle}</p>
                      <div className="flex gap-2 pt-0.5">
                        {item.type === 'USER_FEEDBACK' ? (
                          <button
                            onClick={() => handleMarkRead(item)}
                            disabled={acting}
                            className="text-[11px] font-semibold bg-green-600 text-white rounded-lg px-2.5 py-1 hover:bg-green-700 disabled:opacity-50"
                          >
                            {acting ? '...' : 'দেখা হয়েছে'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(item)}
                              disabled={acting}
                              className="text-[11px] font-semibold bg-green-600 text-white rounded-lg px-2.5 py-1 hover:bg-green-700 disabled:opacity-50"
                            >
                              {acting ? '...' : 'অনুমোদন'}
                            </button>
                            <button
                              onClick={() => handleReject(item)}
                              disabled={acting}
                              className="text-[11px] font-semibold border border-red-300 text-red-600 rounded-lg px-2.5 py-1 hover:bg-red-50 disabled:opacity-50"
                            >
                              বাতিল
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
