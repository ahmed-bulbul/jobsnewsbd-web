'use client';

import { useEffect } from 'react';
import { recordPostView } from '@/lib/api';
import { trackEvent } from '@/lib/activity';

/**
 * Invisible mount-and-fire tracker for the job detail page (a Server
 * Component, so it can't hold this state itself). Does two things on
 * mount: (1) increments the post's view counter via the pre-existing
 * POST /api/posts/{slug}/view endpoint — mobile already calls this, the
 * web app never did, so public view counts were silently missing web
 * traffic entirely; (2) fires a JOB_VIEW activity event for the new
 * behavior-tracking log.
 */
export default function JobViewTracker({
  slug,
  postId,
  categoryId,
}: {
  slug: string;
  postId: number;
  categoryId?: number;
}) {
  useEffect(() => {
    recordPostView(slug).catch(() => {});
    trackEvent('JOB_VIEW', {
      entityType: 'POST',
      entityId: postId,
      metadata: categoryId ? `categoryId=${categoryId}` : undefined,
    });
    // Intentionally fire only once per mount (slug/postId don't change
    // without a full navigation to a different job detail page).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
