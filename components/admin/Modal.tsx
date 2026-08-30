import type { ReactNode } from 'react';
import { XMarkIcon } from './icons';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
};

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 animate-overlay-fade" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} max-h-[85vh] overflow-y-auto animate-modal-pop`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-warm-border sticky top-0 bg-white">
            <h3 className="font-bold text-ink">{title}</h3>
            <button onClick={onClose} className="text-warm-muted hover:text-ink p-1 rounded-lg hover:bg-cream transition-colors" aria-label="বন্ধ করুন">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
