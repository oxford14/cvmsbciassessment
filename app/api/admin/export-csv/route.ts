import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const CHUNK_SIZE = 1000;

type ReportRow = {
  association_name: string;
  region_name: string | null;
  contact_person: string;
  position: string;
  phone_number: string;
  contact_email: string | null;
  church_name: string;
  pastor_name: string | null;
  church_contact_number: string | null;
  church_address: string | null;
  ga_2023: boolean;
  ga_2024: boolean;
  ga_2025: boolean;
  church_remarks: string | null;
  submitted_at: string;
};

function escape(v: string | null | undefined): string {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowToCsvLine(r: ReportRow): string {
  return [
    escape(r.association_name),
    escape(r.church_name),
    escape(r.region_name),
    escape(r.contact_person),
    escape(r.position),
    escape(r.phone_number),
    escape(r.contact_email),
    escape(r.pastor_name),
    escape(r.church_contact_number),
    escape(r.church_address),
    r.ga_2023 ? 'Yes' : 'No',
    r.ga_2024 ? 'Yes' : 'No',
    r.ga_2025 ? 'Yes' : 'No',
    escape(r.church_remarks),
    escape(new Date(r.submitted_at).toLocaleString()),
  ].join(',');
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const headers = [
    'Association',
    'Church Name',
    'Region',
    'Contact Person',
    'Position',
    'Phone Number',
    'Email',
    "Pastor's Name",
    'Church Contact #',
    'Church Location',
    '2023 GA',
    '2024 GA',
    '2025 GA',
    'Remarks',
    'Submitted At',
  ].join(',');

  const supabase = createAdminClient();
  const lines: string[] = [];
  let offset = 0;

  while (true) {
    const { data: rows, error } = await supabase
      .from('consolidated_report')
      .select('*')
      .order('submitted_at', { ascending: false })
      .range(offset, offset + CHUNK_SIZE - 1);

    if (error) {
      return new NextResponse('Error fetching data', { status: 500 });
    }
    if (!rows || rows.length === 0) break;

    for (const r of rows as ReportRow[]) {
      lines.push(rowToCsvLine(r));
    }

    if (rows.length < CHUNK_SIZE) break;
    offset += CHUNK_SIZE;
  }

  const csv = [headers, ...lines].join('\n');
  const filename = `church-assessment-${new Date().toISOString().split('T')[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
