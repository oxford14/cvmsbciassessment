'use server';

import bcrypt from 'bcryptjs';
import { createAdminClient } from '@/lib/supabase/admin';

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function listAdminUsers(): Promise<{ ok: true; users: AdminUserRow[] } | { ok: false; error: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) return { ok: false, error: error.message };
    return { ok: true, users: (data ?? []) as AdminUserRow[] };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to list users' };
  }
}

export async function createAdminUser(payload: {
  email: string;
  password: string;
  full_name?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const email = payload.email.trim().toLowerCase();
  if (!email) return { ok: false, error: 'Email is required.' };
  if (!payload.password || payload.password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };

  try {
    const password_hash = await bcrypt.hash(payload.password, 10);
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        email,
        password_hash,
        full_name: payload.full_name?.trim() || null,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') return { ok: false, error: 'An admin with this email already exists.' };
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data!.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to create user' };
  }
}

export async function updateAdminUser(
  id: string,
  payload: { email?: string; full_name?: string | null; is_active?: boolean; password?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (payload.email !== undefined) updates.email = payload.email.trim().toLowerCase();
    if (payload.full_name !== undefined) updates.full_name = payload.full_name?.trim() || null;
    if (payload.is_active !== undefined) updates.is_active = payload.is_active;
    if (payload.password !== undefined && payload.password.length > 0) {
      if (payload.password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
      updates.password_hash = await bcrypt.hash(payload.password, 10);
    }

    const { error } = await supabase.from('admin_users').update(updates).eq('id', id);

    if (error) {
      if (error.code === '23505') return { ok: false, error: 'An admin with this email already exists.' };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to update user' };
  }
}

export async function deleteAdminUser(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to delete user' };
  }
}
