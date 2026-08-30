export type TabItem = { id: string; label: string };

type Props = {
  tabs: readonly TabItem[];
  active: string;
  onChange: (id: string) => void;
};

export default function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-white rounded-xl border border-warm-border p-1 w-fit flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            active === tab.id ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
