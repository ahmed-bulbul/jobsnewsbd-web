'use client';

import { useEffect } from 'react';

/**
 * Copy-deterrent for Question Bank pages only.
 *
 * IMPORTANT LIMITATION: this blocks the common casual-copy paths (right-click
 * → copy, Ctrl/Cmd+C/X/A, drag-to-select, the browser's native copy event) —
 * it does NOT and cannot make the content truly uncopiable. Anyone using
 * browser dev tools, "view page source", reader mode, an extension that
 * reads the DOM directly, or a screenshot can still get the text, because
 * the browser has to render it for the page to be readable at all. No
 * client-side JS can prevent that — treat this as friction, not security.
 *
 * Scoped via mount/unmount (each page that renders this attaches its own
 * listeners on mount and removes them on unmount) so the rest of the site
 * — job circulars, etc. — keeps completely normal copy/select behavior.
 */
export default function CopyGuard() {
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();

    const blockKeys = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      // Copy, cut, select-all, view-source, save-page.
      if (mod && ['c', 'x', 'a', 'u', 's'].includes(key)) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('dragstart', block);
    document.addEventListener('selectstart', block);
    document.addEventListener('keydown', blockKeys);

    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('dragstart', block);
      document.removeEventListener('selectstart', block);
      document.removeEventListener('keydown', blockKeys);
    };
  }, []);

  return null;
}
