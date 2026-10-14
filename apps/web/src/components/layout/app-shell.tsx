'use client';

import React, { useState } from 'react';
import { AppSidebar } from './sidebar';
import { AppHeader } from './header';
import { useAuth } from '@/lib/auth-context';

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#1E3A2F] border-t-transparent animate-spin" />
          <div className="text-xs font-medium text-[#78716C] tracking-wide">Connecting to FairGig Platform...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex overflow-x-hidden">
      {/* Sidebar with Mobile Drawer capability */}
      <AppSidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        <AppHeader
          title={title}
          subtitle={subtitle}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
