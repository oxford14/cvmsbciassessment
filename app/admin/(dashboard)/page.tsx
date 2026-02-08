import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminDashboard } from '../AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const supabase = createAdminClient();
  const { data: batches } = await supabase
    .from('assessment_batches')
    .select(`
      id,
      association_name,
      region_code,
      region_name,
      contact_person,
      position,
      phone_number,
      email,
      submitted_at,
      assessment_churches (
        id,
        church_name,
        pastor_name,
        contact_number,
        province_name,
        municipality_name,
        ga_2023,
        ga_2024,
        ga_2025,
        remarks
      )
    `)
    .order('submitted_at', { ascending: false });

  const { count: totalChurches } = await supabase
    .from('assessment_churches')
    .select('*', { count: 'exact', head: true });

  const associations = new Set((batches || []).map((b: { association_name: string }) => b.association_name));

  return (
    <>
      <AdminDashboard
        batches={batches || []}
        totalSubmissions={(batches || []).length}
        totalChurches={totalChurches ?? 0}
        totalAssociations={associations.size}
      />
    </>
  );
}
