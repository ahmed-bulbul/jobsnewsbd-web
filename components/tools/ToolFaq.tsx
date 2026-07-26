import T from '@/components/ui/T';

export interface FaqItem {
  qBn: string;
  qEn: string;
  aBn: string;
  aEn: string;
}

export default function ToolFaq({ items }: { items: FaqItem[] }) {
  return (
    <div className="card p-6 mt-8">
      <h2 className="font-bold text-gray-900 mb-4 text-lg">
        <T bn="সাধারণ জিজ্ঞাসা" en="Frequently asked questions" />
      </h2>
      <div className="space-y-4 divide-y divide-warm-border">
        {items.map((item, i) => (
          <div key={i} className={i > 0 ? 'pt-4' : ''}>
            <h3 className="font-semibold text-gray-800 text-sm mb-1.5">
              <T bn={item.qBn} en={item.qEn} />
            </h3>
            <p className="text-sm text-warm-muted leading-relaxed">
              <T bn={item.aBn} en={item.aEn} />
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
