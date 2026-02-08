'use client';

import { useState, useMemo } from 'react';

function ExportCsvButton() {
  const [loading, setLoading] = useState(false);
  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/export-csv', { credentials: 'include' });
      if (res.status === 401) {
        window.location.href = '/admin/login?from=/admin';
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
      setLoading(false);
    }
  }
  return (
    <button type="button" className="btn btn-primary" onClick={handleExport} disabled={loading}>
      {loading ? 'Exporting…' : '📥 Export to CSV'}
    </button>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

type Church = {
  id: string;
  church_name: string;
  ga_2023: boolean;
  ga_2024: boolean;
  ga_2025: boolean;
  remarks: string | null;
};

type Batch = {
  id: string;
  association_name: string;
  region_code: string | null;
  region_name: string | null;
  province_code: string | null;
  province_name: string | null;
  municipality_code: string | null;
  municipality_name: string | null;
  barangay_code: string | null;
  barangay_name: string | null;
  contact_person: string;
  position: string;
  phone_number: string;
  email: string | null;
  submitted_at: string;
  assessment_churches: Church[];
};

function SubmissionDetailModal({ batch, onClose }: { batch: Batch; onClose: () => void }) {
  return (
    <div className="submission-detail-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="detail-modal-title">
      <div className="submission-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="submission-detail-header">
          <h3 id="detail-modal-title" className="submission-title">{batch.association_name}</h3>
          <div className="submission-detail-actions">
            <span className="submission-date">{new Date(batch.submitted_at).toLocaleString()}</span>
            <button type="button" className="btn-close-detail" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        <div className="submission-info">
          <div className="info-item">
            <span className="info-label">Region</span>
            <span className="info-value">{batch.region_name ?? '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Address</span>
            <span className="info-value">
              {[batch.region_name, batch.province_name, batch.municipality_name, batch.barangay_name].filter(Boolean).join(', ') || '—'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Contact Person</span>
            <span className="info-value">{batch.contact_person}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Position</span>
            <span className="info-value">{batch.position}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Phone</span>
            <span className="info-value">{batch.phone_number}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{batch.email || '—'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Churches Reported</span>
            <span className="info-value">{batch.assessment_churches.length}</span>
          </div>
        </div>
        <div className="churches-list">
          <div className="info-label" style={{ marginBottom: '0.75rem' }}>Churches Detail:</div>
          {batch.assessment_churches.map((church) => (
            <div key={church.id} className="church-item">
              <div className="church-name">{church.church_name}</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>2023:</span>
                <span className={`year-badge ${church.ga_2023 ? 'checked' : 'unchecked'}`}>{church.ga_2023 ? '✓' : '✗'}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>2024:</span>
                <span className={`year-badge ${church.ga_2024 ? 'checked' : 'unchecked'}`}>{church.ga_2024 ? '✓' : '✗'}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>2025:</span>
                <span className={`year-badge ${church.ga_2025 ? 'checked' : 'unchecked'}`}>{church.ga_2025 ? '✓' : '✗'}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{church.remarks || 'No remarks'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard({
  batches,
  totalSubmissions,
  totalChurches,
  totalAssociations,
}: {
  batches: Batch[];
  totalSubmissions: number;
  totalChurches: number;
  totalAssociations: number;
}) {
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return batches;
    const q = search.toLowerCase();
    return batches.filter((b) => {
      const addressStr = [b.region_name, b.province_name, b.municipality_name, b.barangay_name].filter(Boolean).join(', ');
      return (
        b.association_name.toLowerCase().includes(q) ||
        (b.region_name?.toLowerCase().includes(q)) ||
        b.contact_person.toLowerCase().includes(q) ||
        addressStr.toLowerCase().includes(q) ||
        b.assessment_churches.some((c) => c.church_name.toLowerCase().includes(q))
      );
    });
  }, [batches, search]);

  return (
    <>
      <div className="admin-header">
        <h2 style={{ fontFamily: "'Crimson Pro', serif", color: 'var(--primary)', fontSize: '1.8rem' }}>
          Dashboard Overview
        </h2>
        <div className="header-actions">
          <ExportCsvButton />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Submissions (Batches)</div>
          <div className="stat-value">{totalSubmissions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Churches</div>
          <div className="stat-value">{totalChurches}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Associations</div>
          <div className="stat-value">{totalAssociations}</div>
        </div>
      </div>

      <div className="card">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by association, region, church name, or contact person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="submissions-table-wrapper">
          {filtered.length === 0 ? (
            <p className="submissions-empty">No submissions yet.</p>
          ) : (
            <table className="submissions-table">
              <thead>
                <tr>
                  <th>Association</th>
                  <th>Region</th>
                  <th>Contact Person</th>
                  <th>Churches</th>
                  <th>Submitted</th>
                  <th className="th-actions">View</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id}>
                    <td className="td-association">{sub.association_name}</td>
                    <td>{sub.region_name ?? '—'}</td>
                    <td>{sub.contact_person}</td>
                    <td>{sub.assessment_churches.length}</td>
                    <td>{new Date(sub.submitted_at).toLocaleString()}</td>
                    <td className="td-actions">
                      <button
                        type="button"
                        className="btn-view-detail"
                        onClick={() => setSelectedBatch(sub)}
                        title="View full submission"
                        aria-label={`View full submission for ${sub.association_name}`}
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedBatch && (
        <SubmissionDetailModal batch={selectedBatch} onClose={() => setSelectedBatch(null)} />
      )}
    </>
  );
}
