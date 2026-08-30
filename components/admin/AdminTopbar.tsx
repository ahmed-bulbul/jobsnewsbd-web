'use client';

import AdminNotificationBell from './AdminNotificationBell';
import { Bars3Icon, ArrowRightOnRectangleIcon } from './icons';

type Props = {
  title: string;
  subtitle?: string;
  adminName: string;
  token: string;
  onLogout: () => void;
  onMenuClick: () => void;
};

export default function AdminTopbar({ title, subtitle, adminName, token, onLogout, onMenuClick }: Props) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-warm-border">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-16">
        <button
          onClick={onMenuClick}
          className="lg:hidden -ml-1 p-1.5 text-warm-muted hover:text-ink rounded-lg hover:bg-cream transition-colors"
          aria-label="মেনু খুলুন"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="font-bold text-ink text-base sm:text-lg truncate">{title}</h1>
          {subtitle && <p className="text-xs text-warm-muted truncate">{subtitle}</p>}
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
          <AdminNotificationBell token={token} iconClassName="text-warm-muted hover:text-ink" />

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-warm-border">
            <div className="w-7 h-7 rounded-full bg-primary-50 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {adminName?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <span className="text-sm font-medium text-ink max-w-[120px] truncate">{adminName}</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-warm-muted hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </div>
    </header>
  );
}
