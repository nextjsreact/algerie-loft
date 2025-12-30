import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logo Diagnostics - Loft Algérie',
  description: 'Diagnostic tools for testing and monitoring logo loading performance',
  robots: 'noindex, nofollow', // Prevent indexing of diagnostic page
};

export default function LogoDiagnosticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}