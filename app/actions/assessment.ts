'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export type SubmitAssessmentInput = {
  associationName: string;
  regionCode: string;
  regionName: string;
  provinceCode: string;
  provinceName: string;
  municipalityCode: string;
  municipalityName: string;
  barangayCode: string;
  barangayName: string;
  contactPerson: string;
  position: string;
  phoneNumber: string;
  email: string;
  churches: Array<{
    name: string;
    ga2023: boolean;
    ga2024: boolean;
    ga2025: boolean;
    remarks: string;
  }>;
};

export async function submitAssessment(data: SubmitAssessmentInput): Promise<{ ok: boolean; error?: string }> {
  if (!data.associationName?.trim()) {
    return { ok: false, error: 'Association name is required.' };
  }
  if (!data.regionCode || !data.provinceCode || !data.municipalityCode || !data.barangayCode) {
    return { ok: false, error: 'Region, Province, City/Municipality, and Barangay are required.' };
  }
  if (!data.contactPerson?.trim() || !data.position?.trim() || !data.phoneNumber?.trim()) {
    return { ok: false, error: 'Contact person, position, and phone number are required.' };
  }
  const churches = data.churches.filter((c) => c.name?.trim());
  if (churches.length === 0) {
    return { ok: false, error: 'Please add at least one church.' };
  }

  const supabase = createAdminClient();

  const { data: batch, error: batchError } = await supabase
    .from('assessment_batches')
    .insert({
      association_name: data.associationName.trim(),
      region_code: data.regionCode,
      region_name: data.regionName,
      province_code: data.provinceCode,
      province_name: data.provinceName,
      municipality_code: data.municipalityCode,
      municipality_name: data.municipalityName,
      barangay_code: data.barangayCode,
      barangay_name: data.barangayName,
      contact_person: data.contactPerson.trim(),
      position: data.position.trim(),
      phone_number: data.phoneNumber.trim(),
      email: data.email?.trim() || null,
    })
    .select('id')
    .single();

  if (batchError || !batch) {
    console.error('Batch insert error:', batchError);
    return { ok: false, error: 'Failed to save assessment. Please try again.' };
  }

  const churchRows = churches.map((c) => ({
    batch_id: batch.id,
    church_name: c.name.trim(),
    ga_2023: !!c.ga2023,
    ga_2024: !!c.ga2024,
    ga_2025: !!c.ga2025,
    remarks: c.remarks?.trim() || null,
  }));

  const { error: churchesError } = await supabase.from('assessment_churches').insert(churchRows);

  if (churchesError) {
    console.error('Churches insert error:', churchesError);
    await supabase.from('assessment_batches').delete().eq('id', batch.id);
    return { ok: false, error: 'Failed to save churches. Please try again.' };
  }

  return { ok: true };
}
