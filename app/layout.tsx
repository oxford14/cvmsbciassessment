import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CVMSBCI Church Assessment System',
  description: 'Convention in Visayas and Mindanao of Southern Baptist Churches, Inc. Church Assessment Form',
  icons: {
    icon: '/CVMSBCI_Logo.png',
    apple: '/CVMSBCI_Logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
