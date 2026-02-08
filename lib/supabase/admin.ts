import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client with service role key.
 * Bypasses RLS - use for admin dashboard and reading assessment data.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase admin env vars');
  return createClient(url, key);
}
