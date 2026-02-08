'use client';

import { useRouter } from 'next/navigation';
import { logoutAdmin } from '@/app/actions/admin-auth';

export function LogoutButton() {
  const router = useRouter();
  async function handleLogout() {
    await logoutAdmin();
    router.push('/admin/login');
    router.refresh();
  }
  return (
    <button type="button" className="btn btn-secondary admin-logout-btn" onClick={handleLogout} title="Log out">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="admin-nav-text">Log out</span>
    </button>
  );
}
