'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon, ChartBarIcon, UsersIcon, QuestionMarkIcon, BookOpenIcon,
  BuildingIcon, ChatBubbleIcon, StarIcon, ArchiveBoxIcon, ReceiptIcon,
  EnvelopeIcon, ShieldCheckIcon, MegaphoneIcon, XMarkIcon, ExternalLinkIcon,
} from './icons';

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'ওভারভিউ',
    items: [
      { label: 'ড্যাশবোর্ড', href: '/admin/dashboard', icon: HomeIcon },
      { label: 'অ্যানালিটিক্স', href: '/admin/analytics', icon: ChartBarIcon },
    ],
  },
  {
    label: 'কন্টেন্ট',
    items: [
      { label: 'প্রশ্ন ব্যাংক', href: '/admin/question-bank', icon: QuestionMarkIcon },
      { label: 'প্রস্তুতি', href: '/admin/prep', icon: BookOpenIcon },
      { label: 'পরীক্ষা কেন্দ্র', href: '/admin/exam-centers', icon: BuildingIcon },
      { label: 'নোটিশ', href: '/admin/notices', icon: MegaphoneIcon },
    ],
  },
  {
    label: 'কমিউনিটি',
    items: [
      { label: 'চাকরির অভিজ্ঞতা', href: '/admin/job-experiences', icon: ChatBubbleIcon },
      { label: 'ইনস্টিটিউট রিভিউ', href: '/admin/institute-reviews', icon: StarIcon },
      { label: 'প্রস্তাবিত বই', href: '/admin/recommended-books', icon: BookOpenIcon },
      { label: 'বই কেনাবেচা', href: '/admin/book-listings', icon: ArchiveBoxIcon },
      { label: 'বই অর্ডার', href: '/admin/book-orders', icon: ReceiptIcon },
    ],
  },
  {
    label: 'ব্যবহারকারী ও সিস্টেম',
    items: [
      { label: 'ব্যবহারকারী', href: '/admin/users', icon: UsersIcon },
      { label: 'মতামত', href: '/admin/feedback', icon: EnvelopeIcon },
      { label: 'Google সাইন-ইন লগ', href: '/admin/google-signin-logs', icon: ShieldCheckIcon },
    ],
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function AdminSidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin/dashboard' && pathname?.startsWith(href + '/'));

  const content = (
    <div className="flex flex-col h-full bg-primary-900 text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-white/10">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary font-bold shrink-0">চ</div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate">Job Radar</p>
          <p className="text-primary-300 text-[11px] leading-tight truncate">Admin Panel</p>
        </div>
        <button onClick={onClose} className="ml-auto lg:hidden text-primary-300 hover:text-white p-1" aria-label="বন্ধ করুন">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-primary-300/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-primary-100/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-accent' : ''}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-primary-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ExternalLinkIcon className="w-4 h-4" />
          সাইটে যান
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — fixed sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        {content}
      </aside>

      {/* Mobile — slide-over drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40 animate-overlay-fade" onClick={onClose} />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[80vw] animate-modal-pop">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
