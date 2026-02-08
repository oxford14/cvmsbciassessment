-- Revert assessment_batches to original region/address text columns
-- Keeps church location fields (municipality, province from combined search)

-- Drop view first (may reference current columns)
DROP VIEW IF EXISTS public.consolidated_report;

-- Add original region and address columns back
ALTER TABLE public.assessment_batches
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Drop structured columns from batches (if they exist)
ALTER TABLE public.assessment_batches
  DROP COLUMN IF EXISTS region_code,
  DROP COLUMN IF EXISTS region_name,
  DROP COLUMN IF EXISTS province_code,
  DROP COLUMN IF EXISTS province_name,
  DROP COLUMN IF EXISTS municipality_code,
  DROP COLUMN IF EXISTS municipality_name,
  DROP COLUMN IF EXISTS barangay_code,
  DROP COLUMN IF EXISTS barangay_name;

-- Recreate consolidated_report with original batch layout + church location
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
  c.region_code AS church_region_code,
  c.region_name AS church_region_name,
  c.province_code,
  c.province_name,
  c.municipality_code,
  c.municipality_name,
  -- Church location display: "City/Municipality • Province" or "City • Independent City"
  TRIM(
    CONCAT_WS(' • ',
      NULLIF(c.municipality_name, ''),
      COALESCE(NULLIF(c.province_name, ''), 'Independent City')
    )
  ) AS church_address,
  c.ga_2023,
  c.ga_2024,
  c.ga_2025,
  c.remarks AS church_remarks
FROM public.assessment_batches b
JOIN public.assessment_churches c ON c.batch_id = b.id
ORDER BY b.submitted_at DESC, c.church_name;
