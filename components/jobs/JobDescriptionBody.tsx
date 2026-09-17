'use client';

import DOMPurify from 'isomorphic-dompurify';
import { linkifyPlainText } from '@/lib/utils';

const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

/**
 * Job post descriptions come in two shapes depending on when the post was
 * written: legacy plain text (typed into the old bare <textarea>, may
 * contain a raw pasted URL that needs auto-linking) or rich HTML (from the
 * RichTextEditor now wired into the admin post form). Running plain text
 * through the HTML path is a non-issue, but running HTML through the old
 * escape-then-linkify path (built for plain text) double-escapes every tag —
 * the literal "<p>", "<ul><li>" text visibly showing on the job page is
 * exactly that bug. Detect which shape we have and route to the matching
 * renderer, mirroring the web app's MarkdownBody (DOMPurify + prose classes)
 * for the HTML case.
 */
export default function JobDescriptionBody({ description }: { description: string }) {
  if (HTML_TAG_PATTERN.test(description)) {
    const clean = DOMPurify.sanitize(description);
    return (
      <div
        className="prose prose-sm max-w-none text-gray-700 leading-relaxed prose-a:text-primary prose-img:rounded-xl"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  return (
    <div
      className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: linkifyPlainText(description) }}
    />
  );
}
