'use client';

import React from 'react';
import { Menu, ShieldCheck, Database } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
}

export function AppHeader({ title, subtitle, onOpenMobileMenu }: AppHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-14 px-4 sm:px-6 border-b border-[#E1E4EA] bg-white flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 text-[#5B6370] hover:text-[#22252A] hover:bg-[#F3F3F0] rounded-lg focus-ring transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-semibold text-[#22252A] tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-[#5B6370] leading-none mt-0.5 hidden xs:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* System PostgreSQL Ledger Status Pill (Honest, non-fake neutral state) */}
        <div
          className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#F3F3F0] border border-[#E1E4EA] text-[11px] font-medium text-[#22252A]"
          title="Direct connection to Supabase PostgreSQL Ledger"
        >
          <Database className="w-3.5 h-3.5 text-[#5B6370]" aria-hidden="true" />
          <span className="text-[11px] hidden sm:inline text-[#5B6370]">Ledger:</span>
          <span className="text-[11px] font-mono">PostgreSQL</span>
        </div>

        {/* Current User Badge */}
        <div className="text-xs text-right hidden sm:block">
          <div className="font-semibold text-[#22252A]">{user?.fullName || 'Tariq Mehmood'}</div>
          <div className="text-[10px] text-[#5B6370] capitalize">{user?.role || 'worker'} &bull; {user?.cityName || 'Lahore'}</div>
        </div>
      </div>
    </header>
  );
}
