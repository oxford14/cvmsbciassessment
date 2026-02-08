-- CVMSBCI Church Assessment System - Initial Schema
-- Run this in Supabase SQL Editor to create tables and RLS policies.

-- ============================================
-- 1. Admin users (stored in table, not Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for login lookup
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users (email);

-- ============================================
-- 2. Assessment batches (one per form submission)
-- Each batch belongs to an association (we store association info on the batch)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Association identification
  association_name TEXT NOT NULL,
  region TEXT NOT NULL,
  address TEXT NOT NULL,
  -- Contact person
  contact_person TEXT NOT NULL,
  position TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for listing by association and date
CREATE INDEX IF NOT EXISTS idx_assessment_batches_association ON public.assessment_batches (association_name);
CREATE INDEX IF NOT EXISTS idx_assessment_batches_submitted_at ON public.assessment_batches (submitted_at DESC);

-- ============================================
-- 3. Churches (rows within a batch)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.assessment_batches (id) ON DELETE CASCADE,
  church_name TEXT NOT NULL,
  ga_2023 BOOLEAN DEFAULT false,
  ga_2024 BOOLEAN DEFAULT false,
  ga_2025 BOOLEAN DEFAULT false,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_churches_batch_id ON public.assessment_churches (batch_id);

-- ============================================
-- 4. RLS (Row Level Security)
-- ============================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_churches ENABLE ROW LEVEL SECURITY;

-- Admin users: only accessible via service role (server-side)
CREATE POLICY "Admin users are server-only"
  ON public.admin_users FOR ALL
  USING (false);

-- Assessment batches: allow anonymous INSERT (form submission), SELECT via service role only for admin
CREATE POLICY "Anyone can submit assessment (insert)"
  ON public.assessment_batches FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "No public read on batches"
  ON public.assessment_batches FOR SELECT
  USING (false);

-- Churches: same as batches
CREATE POLICY "Anyone can insert churches for a batch"
  ON public.assessment_churches FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "No public read on churches"
  ON public.assessment_churches FOR SELECT
  USING (false);

-- ============================================
-- 5. View: Consolidated report (all data in one place)
-- ============================================
CREATE OR REPLACE VIEW public.consolidated_report AS
SELECT
  b.id AS batch_id,
  b.association_name,
  b.region,
  b.address,
  b.contact_person,
  b.position,
  b.phone_number,
  b.email AS contact_email,
  b.submitted_at,
  b.created_at AS batch_created_at,
  c.id AS church_id,
  c.church_name,
  c.ga_2023,
  c.ga_2024,
  c.ga_2025,
  c.remarks AS church_remarks
FROM public.assessment_batches b
JOIN public.assessment_churches c ON c.batch_id = b.id
ORDER BY b.submitted_at DESC, c.church_name;

-- View is read via service role only (no RLS on views by default; access controlled by underlying tables)
-- Grant usage to service role only (default: no public access)

-- ============================================
-- 6. Optional: function to get batch with churches (for API)
-- ============================================
-- Done in app via two queries or join. No extra function needed.

COMMENT ON TABLE public.admin_users IS 'Admin users for dashboard login (table-based, not Supabase Auth)';
COMMENT ON TABLE public.assessment_batches IS 'One row per submitted assessment form; identifies the association and contact';
COMMENT ON TABLE public.assessment_churches IS 'Church rows belonging to an assessment batch';
COMMENT ON VIEW public.consolidated_report IS 'Flat list of all batches and churches for reporting/export';
