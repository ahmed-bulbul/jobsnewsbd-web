import type { ReactNode } from 'react';

export type TableColumn<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
};

function alignClass(a?: 'left' | 'right' | 'center') {
  return a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';
}

/**
 * Thin, shared shell around the hand-rolled <table> pattern already used
 * across the admin pages (card + overflow-x-auto + cream header row +
 * divide-y body) — deliberately doesn't try to own every column's markup,
 * since each page's rows differ too much; `render` keeps full control.
 */
export default function Table<T>({ columns, data, rowKey, emptyMessage = 'কোনো তথ্য নেই' }: Props<T>) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream border-b border-warm-border">
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 font-semibold text-gray-700 whitespace-nowrap ${alignClass(col.align)}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-border">
            {data.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-cream/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${alignClass(col.align)} ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-warm-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
