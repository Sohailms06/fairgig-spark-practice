import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

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
      <body className="min-h-screen bg-[#FAFAF8] text-[#1C1917] antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
