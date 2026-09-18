'use client';

// User behavior tracking (job views, searches, filters, saves, apply-clicks,
// session starts) — fire-and-forget POSTs to /api/activity/track. Never
// awaited by callers and never throws: tracking must not block or break the
// UI it's instrumenting. Works for both logged-in and anonymous visitors —
// every event carries a client-generated sessionId (persisted in
// localStorage so it survives reloads within the same browser), and the
// Authorization header is attached whenever a user happens to be logged in
// so the backend can additionally tie the event to their account.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.jobradarbd.com';
const SESSION_KEY = 'jr_session_id';
const AUTH_KEY = 'user_auth';

export type ActivityEventType =
  | 'JOB_VIEW'
  | 'CATEGORY_VIEW'
  | 'SEARCH'
  | 'FILTER_APPLIED'
  | 'JOB_SAVED'
  | 'APPLY_CLICK'
  | 'NOTIFICATION_OPENED'
  | 'SESSION_START';

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getUserToken(): string | undefined {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return undefined;
    return (JSON.parse(raw) as { token?: string }).token;
  } catch {
    return undefined;
  }
}

export function trackEvent(
  eventType: ActivityEventType,
  opts?: { entityType?: string; entityId?: number; metadata?: string }
): void {
  if (typeof window === 'undefined') return;
  try {
    const token = getUserToken();
    // keepalive lets the request survive a navigation that happens right
    // after firing this (e.g. clicking Apply, which opens a new tab, or a
    // search that immediately routes to /jobs).
    fetch(`${BASE}/api/activity/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        sessionId: getSessionId(),
        eventType,
        entityType: opts?.entityType ?? null,
        entityId: opts?.entityId ?? null,
        metadata: opts?.metadata ?? null,
        platform: 'WEB',
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // localStorage/crypto can throw in exotic environments (privacy modes,
    // very old browsers) — never let tracking take the page down with it.
  }
}
