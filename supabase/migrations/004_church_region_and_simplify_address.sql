-- Add region to churches and update consolidated report for simplified address display
-- Church location is now: City/Municipality only (province auto-filled when applicable, barangay removed)

ALTER TABLE public.assessment_churches
  ADD COLUMN IF NOT EXISTS region_code TEXT,
  ADD COLUMN IF NOT EXISTS region_name TEXT;

-- Update consolidated_report view with address display (city + province or "Independent City")
DROP VIEW IF EXISTS public.consolidated_report;

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
  -- Display: "City/Municipality, Province" or "City (Independent City)"
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

COMMENT ON COLUMN public.assessment_churches.region_code IS 'PSGC region code for church location';
COMMENT ON COLUMN public.assessment_churches.region_name IS 'PSGC region name for church location';
