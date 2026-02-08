export type AdminUser = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AssessmentBatch = {
  id: string;
  association_name: string;
  region_code: string | null;
  region_name: string | null;
  contact_person: string;
  position: string;
  phone_number: string;
  email: string | null;
  submitted_at: string;
  created_at: string;
};

export type AssessmentChurch = {
  id: string;
  batch_id: string;
  church_name: string;
  pastor_name: string | null;
  contact_number: string | null;
  region_code: string | null;
  region_name: string | null;
  province_code: string | null;
  province_name: string | null;
  municipality_code: string | null;
  municipality_name: string | null;
  barangay_code: string | null;
  barangay_name: string | null;
  ga_2023: boolean;
  ga_2024: boolean;
  ga_2025: boolean;
  remarks: string | null;
  created_at: string;
};

export type ConsolidatedReportRow = {
  batch_id: string;
  association_name: string;
  region_code: string | null;
  region_name: string | null;
  contact_person: string;
  position: string;
  phone_number: string;
  contact_email: string | null;
  submitted_at: string;
  batch_created_at: string;
  church_id: string;
  church_name: string;
  pastor_name: string | null;
  church_contact_number: string | null;
  church_region_code: string | null;
  church_region_name: string | null;
  province_code: string | null;
  province_name: string | null;
  municipality_code: string | null;
  municipality_name: string | null;
  barangay_code: string | null;
  barangay_name: string | null;
  church_address: string | null;
  ga_2023: boolean;
  ga_2024: boolean;
  ga_2025: boolean;
  church_remarks: string | null;
};
