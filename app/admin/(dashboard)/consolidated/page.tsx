import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ConsolidatedReportTable } from './ConsolidatedReportTable';

export const dynamic = 'force-dynamic';

export default async function ConsolidatedReportPage() {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  const supabase = createAdminClient();
  const { data: rows } = await supabase
    .from('consolidated_report')
    .select('*')
    .order('submitted_at', { ascending: false });

  return (
    <div className="card">
      <div className="form-header">
        <h2>Consolidated Report</h2>
        <p>All assessment data in one view. Use pagination and Export CSV below.</p>
      </div>
      <ConsolidatedReportTable rows={rows || []} />
    </div>
  );
}
