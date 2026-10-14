import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FairGig — Gig Worker Income & Rights Platform',
  description: 'Empowering gig economy workers with verifiable earnings, dispute advocacy, and transparent analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
