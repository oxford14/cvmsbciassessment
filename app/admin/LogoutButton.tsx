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
    <button type="button" className="btn btn-secondary" onClick={handleLogout}>
      Log out
    </button>
  );
}
