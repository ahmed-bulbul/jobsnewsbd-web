import T from './T';

// Structured "Source of Information" card for job/circular detail pages.
// Distinct from the free-text auto-linked URLs inside a post's description —
// this renders from the post's own structured fields so every post that has
// a source always shows the same clear, accessible official-source block,
// regardless of what the admin happened to type into the description. Built
// in response to Google Play's Misleading Claims "Missing Source Link for
// Government Information" policy item — see play-store-listing-fix.md for
// the store-listing side of that fix.
//
// officialWebsite vs sourceUrl: sourceUrl is frequently a shared third-party
// application portal (teletalk.com.bd and similar), not the issuing
// organization's own website — showing its domain as "official website"
// misrepresented the source (a real example: sourceUrl was
// tax16.teletalk.com.bd while the org's actual site is
// taxeszone16dhaka.gov.bd). officialWebsite is a distinct, optional field the
// admin fills in only when they know the organization's real homepage, so
// this row is simply omitted rather than guessing from sourceUrl's domain.
//
// Layout note: labels and link buttons are stacked (not side-by-side) —
// a long hostname/label pair squeezed into one row wrapped awkwardly at
// sidebar width, so each field gets its own line and the link renders as a
// proper pill button instead of inline wrapped text.
interface Props {
  organizationName: string | null;
  sourceUrl: string | null;
  officialWebsite: string | null;
  circularPdfUrl: string | null;
}

function FieldLabel({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium text-warm-muted dark:text-night-muted flex items-center gap-1.5 mb-1.5">
      <span aria-hidden>{icon}</span>
      {children}
    </p>
  );
}

export default function SourceInfoCard({ organizationName, sourceUrl, officialWebsite, circularPdfUrl }: Props) {
  // Nothing to declare as a source — don't show an empty/misleading card.
  if (!sourceUrl) return null;

  let host = '';
  let rootUrl = officialWebsite ?? '';
  try {
    if (officialWebsite) host = new URL(officialWebsite).hostname.replace(/^www\./, '');
  } catch {
    /* malformed officialWebsite — treat as not set */
    host = '';
    rootUrl = '';
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-sm">
          <span aria-hidden>📌</span>
          <T bn="তথ্যের উৎস" en="Source of Information" />
        </h3>
        <p className="text-xs text-warm-muted dark:text-night-muted mt-1 leading-relaxed">
          <T
            bn="এই বিজ্ঞপ্তিটি সংশ্লিষ্ট প্রতিষ্ঠানের অফিসিয়াল উৎস থেকে সংগ্রহ করা হয়েছে।"
            en="This notice was collected from the concerned organization's official source."
          />
        </p>
      </div>

      <div className="space-y-3.5 pt-3.5 border-t border-warm-border dark:border-night-border">
        {organizationName && (
          <div>
            <FieldLabel icon="🏛️">
              <T bn="প্রতিষ্ঠান" en="Organization" />
            </FieldLabel>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {organizationName}
            </p>
          </div>
        )}

        {host && (
          <div>
            <FieldLabel icon="🌐">
              <T bn="অফিসিয়াল ওয়েবসাইট" en="Official Website" />
            </FieldLabel>
            <a
              href={rootUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-3 py-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <span className="text-xs font-medium text-emerald-900 dark:text-emerald-300 truncate">
                {host}
              </span>
              <span className="shrink-0 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                <T bn="ভিজিট ↗" en="Visit ↗" />
              </span>
            </a>
          </div>
        )}

        {circularPdfUrl && (
          <div>
            <FieldLabel icon="📄">
              <T bn="মূল বিজ্ঞপ্তি" en="Original Notice" />
            </FieldLabel>
            <a
              href={circularPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
            >
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                <T bn="মূল কপি দেখুন" en="View original copy" />
              </span>
              <span className="shrink-0 text-[11px] font-bold text-gray-600 dark:text-gray-300">
                <T bn="দেখুন ↗" en="View ↗" />
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
