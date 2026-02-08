-- Add pastor_name, contact_number, and barangay to consolidated_report view
-- (assessment_churches already has these columns from 003)

DROP VIEW IF EXISTS public.consolidated_report;

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
  -- Church location display: "City/Municipality, Province" or "City (Independent City)", optional Barangay
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
