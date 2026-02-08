'use client';

import type { ConsolidatedReportRow } from '@/lib/db-types';

export function ConsolidatedReportTable({ rows }: { rows: ConsolidatedReportRow[] }) {
  if (rows.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
        No data in consolidated report yet.
      </p>
    );
  }

  return (
    <div className="table-container">
      <table className="report-table">
        <thead>
          <tr>
            <th>Association</th>
            <th>Region</th>
            <th>Address</th>
            <th>Contact Person</th>
            <th>Position</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Church Name</th>
            <th>2023 GA</th>
            <th>2024 GA</th>
            <th>2025 GA</th>
            <th>Remarks</th>
            <th>Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.batch_id}-${row.church_id}`}>
              <td>{row.association_name}</td>
              <td>{row.region}</td>
              <td>{row.address}</td>
              <td>{row.contact_person}</td>
              <td>{row.position}</td>
              <td>{row.phone_number}</td>
              <td>{row.contact_email || '—'}</td>
              <td>{row.church_name}</td>
              <td className="checkbox-cell">{row.ga_2023 ? '✓' : '✗'}</td>
              <td className="checkbox-cell">{row.ga_2024 ? '✓' : '✗'}</td>
              <td className="checkbox-cell">{row.ga_2025 ? '✓' : '✗'}</td>
              <td>{row.church_remarks || '—'}</td>
              <td>{new Date(row.submitted_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
