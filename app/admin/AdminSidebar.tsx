'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogoutButton } from './LogoutButton';

export function AdminSidebar() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleCollapsed = () => setSidebarCollapsed((c) => !c);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    }
  }, [sidebarOpen]);

  return (
    <>
      {/* Burger button - mobile only; toggles drawer */}
      <button
        type="button"
        className="admin-burger-btn"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setSidebarOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* Overlay - mobile only, closes sidebar when clicked */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        aria-hidden="true"
        onClick={closeSidebar}
      />

      {/* Sidebar - drawer on mobile, collapsible on desktop */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Collapse/Expand toggle - PC only */}
        <button
          type="button"
          className="admin-sidebar-collapse-btn"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={toggleCollapsed}
        >
          {sidebarCollapsed ? '▶' : '◀'}
        </button>
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-logo" title="CVMSBCI">
            <img src="/CVMSBCI_Logo.png" alt="" width={72} height={72} className="admin-sidebar-logo-img" />
            <span className="admin-nav-text">CVMSBCI</span>
          </span>
          <span className="admin-sidebar-title admin-nav-text">Admin</span>
        </div>
        <nav className="admin-sidebar-nav">
          <Link
            href="/admin"
            className={`admin-nav-link ${pathname === '/admin' ? 'active' : ''}`}
            onClick={closeSidebar}
            title="Dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            <span className="admin-nav-text">Dashboard</span>
          </Link>
          <Link
            href="/admin/consolidated"
            className={`admin-nav-link ${pathname === '/admin/consolidated' ? 'active' : ''}`}
            onClick={closeSidebar}
            title="Consolidated Report"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span className="admin-nav-text">Consolidated Report</span>
          </Link>
          <Link
            href="/admin/users"
            className={`admin-nav-link ${pathname === '/admin/users' ? 'active' : ''}`}
            onClick={closeSidebar}
            title="Users"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="admin-nav-text">Users</span>
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
