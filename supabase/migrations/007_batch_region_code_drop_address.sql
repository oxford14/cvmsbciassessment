-- Align assessment_batches with form inputs:
--   Form collects regionCode + regionName (from PSGC RegionSelect), NOT free-text region/address.
--   Drop unused columns, add structured region columns to match church-level pattern.

-- 1. Drop the view first (depends on batch columns being changed)
DROP VIEW IF EXISTS public.consolidated_report;

-- 2. Drop unused columns
ALTER TABLE public.assessment_batches
  DROP COLUMN IF EXISTS region,
  DROP COLUMN IF EXISTS address;

-- 3. Add structured region columns (matching church-level pattern)
ALTER TABLE public.assessment_batches
  ADD COLUMN IF NOT EXISTS region_code TEXT,
  ADD COLUMN IF NOT EXISTS region_name TEXT;

-- 4. Recreate consolidated_report view
CREATE OR REPLACE VIEW public.consolidated_report AS
SELECT
  b.id AS batch_id,
  b.association_name,
  b.region_code,
  b.region_name,
  b.contact_person,
  b.position,
  b.phone_number,
  b.email AS contact_email,
  b.submitted_at,
  b.created_at AS batch_created_at,
  c.id AS church_id,
  c.church_name,
  c.pastor_name,
  c.contact_number AS church_contact_number,
  c.region_code AS church_region_code,
  c.region_name AS church_region_name,
  c.province_code,
  c.province_name,
  c.municipality_code,
  c.municipality_name,
  c.barangay_code,
  c.barangay_name,
  -- Church location display: "City/Municipality • Province • Barangay"
  TRIM(
    CONCAT_WS(' • ',
      NULLIF(c.municipality_name, ''),
      COALESCE(NULLIF(c.province_name, ''), 'Independent City'),
      NULLIF(c.barangay_name, '')
    )
  ) AS church_address,
  c.ga_2023,
  c.ga_2024,
  c.ga_2025,
  c.remarks AS church_remarks
FROM public.assessment_batches b
JOIN public.assessment_churches c ON c.batch_id = b.id
ORDER BY b.submitted_at DESC, c.church_name;
