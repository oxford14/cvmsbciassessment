import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from('consolidated_report')
    .select('*')
    .order('submitted_at', { ascending: false });

  const headers = [
    'Association',
    'Region',
    'Province',
    'City/Municipality',
    'Barangay',
    'Address',
    'Contact Person',
    'Position',
    'Phone Number',
    'Email',
    'Church Name',
    '2023 GA',
    '2024 GA',
    '2025 GA',
    'Remarks',
    'Submitted At',
  ].join(',');

  const escape = (v: string | null | undefined) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = (rows || []).map(
    (r: {
      association_name: string;
      region_name: string | null;
      province_name: string | null;
      municipality_name: string | null;
      barangay_name: string | null;
      address: string;
      contact_person: string;
      position: string;
      phone_number: string;
      contact_email: string | null;
      church_name: string;
      ga_2023: boolean;
      ga_2024: boolean;
      ga_2025: boolean;
      church_remarks: string | null;
      submitted_at: string;
    }) =>
      [
        escape(r.association_name),
        escape(r.region_name),
        escape(r.province_name),
        escape(r.municipality_name),
        escape(r.barangay_name),
        escape(r.address),
        escape(r.contact_person),
        escape(r.position),
        escape(r.phone_number),
        escape(r.contact_email),
        escape(r.church_name),
        r.ga_2023 ? 'Yes' : 'No',
        r.ga_2024 ? 'Yes' : 'No',
        r.ga_2025 ? 'Yes' : 'No',
        escape(r.church_remarks),
        escape(new Date(r.submitted_at).toLocaleString()),
      ].join(',')
  );

  const csv = [headers, ...lines].join('\n');
  const filename = `church-assessment-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
