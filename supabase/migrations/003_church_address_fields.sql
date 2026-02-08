-- Add pastor, contact, and address fields to assessment_churches
-- Association now captures only Region; each church captures full address (Province, Municipality, Barangay)

ALTER TABLE public.assessment_churches
  ADD COLUMN IF NOT EXISTS pastor_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_number TEXT,
  ADD COLUMN IF NOT EXISTS province_code TEXT,
  ADD COLUMN IF NOT EXISTS province_name TEXT,
  ADD COLUMN IF NOT EXISTS municipality_code TEXT,
  ADD COLUMN IF NOT EXISTS municipality_name TEXT,
  ADD COLUMN IF NOT EXISTS barangay_code TEXT,
  ADD COLUMN IF NOT EXISTS barangay_name TEXT;

-- Drop and recreate consolidated_report view to include church address fields
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
  c.province_code,
  c.province_name,
  c.municipality_code,
  c.municipality_name,
  c.barangay_code,
  c.barangay_name,
  c.ga_2023,
  c.ga_2024,
  c.ga_2025,
  c.remarks AS church_remarks
FROM public.assessment_batches b
JOIN public.assessment_churches c ON c.batch_id = b.id
ORDER BY b.submitted_at DESC, c.church_name;

COMMENT ON COLUMN public.assessment_churches.pastor_name IS 'Name of church pastor';
COMMENT ON COLUMN public.assessment_churches.contact_number IS 'Church contact phone number';
COMMENT ON COLUMN public.assessment_churches.province_code IS 'PSGC province code for church location';
COMMENT ON COLUMN public.assessment_churches.province_name IS 'PSGC province name';
COMMENT ON COLUMN public.assessment_churches.municipality_code IS 'PSGC city/municipality code';
COMMENT ON COLUMN public.assessment_churches.municipality_name IS 'PSGC city/municipality name';
COMMENT ON COLUMN public.assessment_churches.barangay_code IS 'PSGC barangay code';
COMMENT ON COLUMN public.assessment_churches.barangay_name IS 'PSGC barangay name';
