-- Create admin account (run in Supabase SQL Editor)
-- Email: oxfordgalawan@gmail.com | Password: hackmenot | Name: Neil Fuerzas

-- Enable bcrypt hashing in PostgreSQL (Supabase has pgcrypto by default)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.admin_users (email, password_hash, full_name, is_active)
VALUES (
  'oxfordgalawan@gmail.com',
  crypt('hackmenot', gen_salt('bf')),
  'Neil Fuerzas',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  is_active = EXCLUDED.is_active,
  updated_at = now();
