import Link from 'next/link';
import { LogoutButton } from '../LogoutButton';

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-logo">CVMSBCI</span>
          <span className="admin-sidebar-title">Admin</span>
        </div>
        <nav className="admin-sidebar-nav">
          <Link href="/admin" className="admin-nav-link">Dashboard</Link>
          <Link href="/admin/consolidated" className="admin-nav-link">Consolidated Report</Link>
          <Link href="/" className="admin-nav-link">Assessment Form</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <LogoutButton />
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-main-inner">
          {children}
        </div>
      </main>
    </div>
  );
}
