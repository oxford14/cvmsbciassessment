import Link from 'next/link';

export function Header({ title = 'Church Assessment System', showAdminLink = false }: { title?: string; showAdminLink?: boolean }) {
  return (
    <div className="header">
      <div className="header-content">
        <div className="logo">
          <div className="logo-icon">CVMSBCI</div>
          <span style={{ fontWeight: 600 }}>Convention in Visayas and Mindanao of Southern Baptist Churches</span>
        </div>
        <h1>{title}</h1>
        <p className="subtitle">
          Convention in Visayas and Mindanao of Southern Baptist Churches, Inc. • Libby Road, Puan, Toril District, Davao City
        </p>
        {showAdminLink && (
          <p style={{ marginTop: '1rem' }}>
            <Link href="/admin" style={{ color: 'rgba(255,255,255,0.9)', textDecoration: 'underline' }}>
              Admin Dashboard →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
