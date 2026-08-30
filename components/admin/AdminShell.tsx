'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  adminName: string;
  token: string;
};

/**
 * Shared chrome for the admin panel: persistent sidebar + topbar, replacing
 * the old copy-pasted per-page <header>. Each page still owns its own
 * token/auth-check (unchanged, since every admin page independently guards
 * itself against a missing localStorage token) — this component is purely
 * presentational plus the one shared action (logout) every page repeated.
 */
export default function AdminShell({ children, title, subtitle, adminName, token }: Props) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-cream">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <AdminTopbar
          title={title}
          subtitle={subtitle}
          adminName={adminName}
          token={token}
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main>{children}</main>
      </div>
    </div>
  );
}
