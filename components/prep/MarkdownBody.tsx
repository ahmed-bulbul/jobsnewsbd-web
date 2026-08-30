'use client';

import DOMPurify from 'isomorphic-dompurify';

// Body is admin-authored rich HTML (from the RichTextEditor). Sanitize again
// here as defense in depth before rendering — the typography plugin's
// `prose` classes give it nice default article styling (headings, lists,
// blockquotes, images) without any extra markup needed.
//
// This lives in its own file, rendered only via MarkdownBodyDynamic
// (next/dynamic + ssr:false), on purpose: isomorphic-dompurify pulls in
// jsdom (~12 MiB) so it can sanitize during SSR too. When this was a plain
// inline component inside app/prep/content/[id]/page.tsx, that page's
// module-level `import DOMPurify from 'isomorphic-dompurify'` forced jsdom
// into the server-side Cloudflare Worker bundle even though this component
// only ever rendered client-side in practice — a real contributor to the
// Worker exceeding Cloudflare's 3 MiB size limit. Excluding it from SSR
// keeps jsdom out of the server bundle entirely.
export default function MarkdownBody({ body }: { body: string }) {
  const clean = DOMPurify.sanitize(body);
  return (
    <div
      className="prose prose-sm sm:prose-base max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-primary prose-img:rounded-xl"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
