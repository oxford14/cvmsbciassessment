'use client';

import { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ConsolidatedReportRow } from '@/lib/db-types';

const PAGE_SIZES = [25, 50, 100] as const;
const EXPORT_FORMATS = ['csv', 'pdf'] as const;

export function ConsolidatedReportTable({ rows }: { rows: ConsolidatedReportRow[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const str = (s: string | null | undefined) => String(s ?? '').toLowerCase();
      return (
        str(r.association_name).includes(q) ||
        str(r.region_name).includes(q) ||
        str(r.contact_person).includes(q) ||
        str(r.position).includes(q) ||
        str(r.phone_number).includes(q) ||
        str(r.contact_email).includes(q) ||
        str(r.church_name).includes(q) ||
        str(r.pastor_name).includes(q) ||
        str(r.church_contact_number).includes(q) ||
        str(r.church_address).includes(q) ||
        str(r.church_remarks).includes(q)
      );
    });
  }, [rows, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startRow = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, filtered.length);

  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  function exportPdf() {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const headers = [
      'Association',
      'Church Name',
      'Region',
      'Contact Person',
      'Position',
      'Phone',
      'Email',
      "Pastor's Name",
      'Church Contact #',
      'Church Location',
      '2023 GA',
      '2024 GA',
      '2025 GA',
      'Remarks',
      'Submitted At',
    ];
    const body = rows.map((r) => [
      r.association_name,
      r.church_name,
      r.region_name ?? '—',
      r.contact_person,
      r.position,
      r.phone_number,
      r.contact_email ?? '—',
      r.pastor_name ?? '—',
      r.church_contact_number ?? '—',
      r.church_address ?? '—',
      r.ga_2023 ? 'Yes' : 'No',
      r.ga_2024 ? 'Yes' : 'No',
      r.ga_2025 ? 'Yes' : 'No',
      r.church_remarks ?? '—',
      new Date(r.submitted_at).toLocaleString(),
    ]);
    autoTable(doc, {
      head: [headers],
      body,
      styles: { fontSize: 7 },
      margin: { top: 10 },
    });
    doc.save(`church-assessment-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  async function handleExport() {
    setExporting(true);
    try {
      if (exportFormat === 'pdf') {
        exportPdf();
        return;
      }
      const res = await fetch('/api/admin/export-csv', { credentials: 'include' });
      if (res.status === 401) {
        window.location.href = '/admin/login?from=/admin/consolidated';
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `church-assessment-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (rows.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
        No data in consolidated report yet.
      </p>
    );
  }

  return (
    <div className="consolidated-report-wrapper">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by association, region, church name, pastor, contact, location, remarks..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          aria-label="Search consolidated report"
        />
      </div>
      <div className="table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>Association</th>
              <th>Church Name</th>
              <th>Region</th>
              <th>Contact Person</th>
              <th>Position</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Pastor&apos;s Name</th>
              <th>Church Contact #</th>
              <th>Church Location</th>
              <th>2023 GA</th>
              <th>2024 GA</th>
              <th>2025 GA</th>
              <th>Remarks</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr key={`${row.batch_id}-${row.church_id}`}>
                <td>{row.association_name}</td>
                <td>{row.church_name}</td>
                <td>{row.region_name ?? '—'}</td>
                <td>{row.contact_person}</td>
                <td>{row.position}</td>
                <td>{row.phone_number}</td>
                <td>{row.contact_email || '—'}</td>
                <td>{row.pastor_name ?? '—'}</td>
                <td>{row.church_contact_number ?? '—'}</td>
                <td>{row.church_address ?? '—'}</td>
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

      <div className="report-toolbar report-toolbar-bottom">
        <div className="report-pagination-info">
          Showing {startRow}–{endRow} of {filtered.length} rows
        </div>
        <div className="report-pagination-controls">
          <label>
            Rows per page:
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="page-size-select"
              aria-label="Rows per page"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="page-indicator">Page {page} of {totalPages}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            Next
          </button>
          <label>
            Export as:
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
              className="page-size-select"
              aria-label="Export format"
            >
              {EXPORT_FORMATS.map((f) => (
                <option key={f} value={f}>{f.toUpperCase()}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExport}
            disabled={exporting}
            title={`Export full report as ${exportFormat.toUpperCase()}`}
          >
            {exporting ? 'Exporting…' : `📥 Export ${exportFormat.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
