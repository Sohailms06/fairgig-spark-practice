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
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[#E7E5E4] bg-white flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 text-[#44403C] hover:text-[#1C1917] hover:bg-stone-100 rounded-lg focus-ring transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-[#1C1917] tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-[#78716C] leading-none mt-0.5 hidden xs:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* System PostgreSQL Ledger Status Pill */}
        <div
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F2F7F4] border border-[#C5D9CE] text-[11px] font-medium text-[#234737]"
          title="Direct connection to Supabase PostgreSQL Ledger active"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline font-mono text-[10px]">SUPABASE</span>
          <span className="text-[11px]">Ledger Active</span>
        </div>

        {/* Current User Badge */}
        <div className="text-xs text-right hidden sm:block">
          <div className="font-semibold text-[#1C1917]">{user?.fullName || 'Tariq Mehmood'}</div>
          <div className="text-[10px] text-[#78716C] capitalize">{user?.role || 'worker'} &bull; {user?.cityName || 'Lahore'}</div>
        </div>
      </div>
    </header>
  );
}
