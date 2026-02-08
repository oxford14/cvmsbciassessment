-- Add structured address columns (Region, Province, Municipality, Barangay)
-- Replaces free-text region and address with PSGC API-based selections.

-- Add new columns
ALTER TABLE public.assessment_batches
  ADD COLUMN IF NOT EXISTS region_code TEXT,
  ADD COLUMN IF NOT EXISTS region_name TEXT,
  ADD COLUMN IF NOT EXISTS province_code TEXT,
  ADD COLUMN IF NOT EXISTS province_name TEXT,
  ADD COLUMN IF NOT EXISTS municipality_code TEXT,
  ADD COLUMN IF NOT EXISTS municipality_name TEXT,
  ADD COLUMN IF NOT EXISTS barangay_code TEXT,
  ADD COLUMN IF NOT EXISTS barangay_name TEXT;

-- Drop view first (it depends on region and address columns)
DROP VIEW IF EXISTS public.consolidated_report;

-- Drop old columns
ALTER TABLE public.assessment_batches
  DROP COLUMN IF EXISTS region,
  DROP COLUMN IF EXISTS address;

CREATE OR REPLACE VIEW public.consolidated_report AS
SELECT
  b.id AS batch_id,
  b.association_name,
  b.region_code,
  b.region_name,
  b.province_code,
  b.province_name,
  b.municipality_code,
  b.municipality_name,
  b.barangay_code,
  b.barangay_name,
  -- Computed full address for display/export
  TRIM(
    CONCAT_WS(', ',
      NULLIF(b.region_name, ''),
      NULLIF(b.province_name, ''),
      NULLIF(b.municipality_name, ''),
      NULLIF(b.barangay_name, '')
    )
  ) AS address,
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

COMMENT ON COLUMN public.assessment_batches.region_code IS 'PSGC region code from psgc.cloud API';
COMMENT ON COLUMN public.assessment_batches.region_name IS 'PSGC region name';
COMMENT ON COLUMN public.assessment_batches.province_code IS 'PSGC province code';
COMMENT ON COLUMN public.assessment_batches.province_name IS 'PSGC province name';
COMMENT ON COLUMN public.assessment_batches.municipality_code IS 'PSGC city/municipality code';
COMMENT ON COLUMN public.assessment_batches.municipality_name IS 'PSGC city/municipality name';
COMMENT ON COLUMN public.assessment_batches.barangay_code IS 'PSGC barangay code';
COMMENT ON COLUMN public.assessment_batches.barangay_name IS 'PSGC barangay name';
