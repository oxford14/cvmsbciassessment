'use server';

import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSession, setSessionCookie, clearSession } from '@/lib/auth';

export async function loginAdmin(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient();
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('id, email, password_hash, is_active')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (error || !admin) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  if (!admin.is_active) {
    return { ok: false, error: 'This account is disabled.' };
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const token = await createSession(admin.id, admin.email);
  await setSessionCookie(token);
  return { ok: true };
}

export async function logoutAdmin() {
  await clearSession();
}
