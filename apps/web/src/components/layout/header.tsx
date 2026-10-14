'use client';

import React from 'react';
import { ShieldCheck, Wifi } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();

  return (
    <header className="h-16 px-8 border-b border-[#E7E5E4] bg-white flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-base font-semibold text-[#1C1917] tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-[#78716C]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* System Ledger Status Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#F2F7F4] border border-[#C5D9CE] text-[11px] font-medium text-[#234737]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>PostgreSQL Active</span>
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
