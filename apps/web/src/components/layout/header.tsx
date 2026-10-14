'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { InstallPwaButton } from '@/components/pwa/install-button';

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
        {/* Mobile Hamburger Menu Toggle with 44px minimum touch target */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden w-11 h-11 -ml-2 text-[#5B6370] hover:text-[#22252A] hover:bg-[#F3F3F0] rounded-lg focus-ring transition-colors flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-[#22252A] tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-[#5B6370] leading-none mt-1 hidden xs:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* PWA Install Button (Appears if installable on client) */}
        <InstallPwaButton variant="outline" />

        {/* Current User Badge */}
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-[#22252A] leading-tight">{user?.fullName || 'Tariq Mehmood'}</div>
          <div className="text-xs text-[#5B6370] capitalize mt-0.5">{user?.role || 'worker'} &bull; {user?.cityName || 'Lahore'}</div>
        </div>
      </div>
    </header>
  );
}
