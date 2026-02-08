import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { listAdminUsers } from '@/app/actions/admin-users';
import { UsersManager } from './UsersManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const result = await listAdminUsers();
  const users = result.ok ? result.users : [];

  return (
    <UsersManager
      initialUsers={users}
      currentAdminId={session.adminId}
    />
  );
}
