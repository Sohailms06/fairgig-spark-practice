'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Users,
  LogOut,
  TrendingDown,
  Layers,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { InstallPwaButton } from '@/components/pwa/install-button';

interface AppSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ isMobileOpen = false, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logout, switchDemoUser } = useAuth();

  const role = user?.role || 'worker';

  // Close mobile drawer on route change
  useEffect(() => {
    if (onMobileClose && isMobileOpen) {
      onMobileClose();
    }
  }, [pathname]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onMobileClose) {
        onMobileClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onMobileClose]);

  const workerNav = [
    { label: 'Overview', href: '/dashboard', icon: BarChart3 },
    { label: 'Earnings', href: '/dashboard/earnings', icon: Calendar },
    { label: 'Anomalies', href: '/dashboard/anomalies', icon: AlertTriangle },
    { label: 'Grievances', href: '/dashboard/grievances', icon: FileText },
    { label: 'Certificates', href: '/dashboard/certificates', icon: Sparkles },
    { label: 'Community', href: '/community', icon: Users },
  ];

  const advocateNav = [
    { label: 'Overview', href: '/advocate', icon: BarChart3 },
    { label: 'Commissions', href: '/advocate/commissions', icon: TrendingDown },
    { label: 'Zones', href: '/advocate/zones', icon: AlertTriangle },
    { label: 'Grievances', href: '/advocate/grievances', icon: Layers },
    { label: 'Community', href: '/community', icon: Users },
  ];

  const verifierNav = [
    { label: 'Audit Queue', href: '/verifier', icon: ShieldCheck },
    { label: 'History', href: '/verifier/history', icon: Calendar },
    { label: 'Community', href: '/community', icon: Users },
  ];

  const navItems = role === 'advocate' ? advocateNav : role === 'verifier' ? verifierNav : workerNav;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-[#E1E4EA]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#1B4332] flex items-center justify-center text-white font-semibold text-xs shadow-2xs">
            FG
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-[#22252A]">FairGig</div>
            <div className="text-xs text-[#5B6370] leading-none mt-0.5">
              {role === 'advocate' ? 'Advocate Portal' : role === 'verifier' ? 'Verifier Audit' : 'Worker Workspace'}
            </div>
          </div>
        </div>

        {/* Close Button on Mobile */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 text-[#5B6370] hover:text-[#22252A] rounded-md focus-ring"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Switcher */}
      <div className="p-3 border-b border-[#E1E4EA] bg-[#FAF9F5]">
        <div className="text-xs font-medium text-[#5B6370] px-1 mb-1.5">
          Switch workspace
        </div>
        <div className="grid grid-cols-3 gap-1 bg-[#F3F3F0] p-1 rounded-lg border border-[#E1E4EA]">
          <button
            onClick={() => switchDemoUser('worker')}
            className={`btn-press px-2 py-1 text-xs rounded-md font-medium transition cursor-pointer text-center ${
              role === 'worker'
                ? 'bg-white text-[#1B4332] shadow-2xs font-semibold'
                : 'text-[#5B6370] hover:text-[#22252A]'
            }`}
          >
            Worker
          </button>
          <button
            onClick={() => switchDemoUser('advocate')}
            className={`btn-press px-2 py-1 text-xs rounded-md font-medium transition cursor-pointer text-center ${
              role === 'advocate'
                ? 'bg-white text-[#1B4332] shadow-2xs font-semibold'
                : 'text-[#5B6370] hover:text-[#22252A]'
            }`}
          >
            Advocate
          </button>
          <button
            onClick={() => switchDemoUser('verifier')}
            className={`btn-press px-2 py-1 text-xs rounded-md font-medium transition cursor-pointer text-center ${
              role === 'verifier'
                ? 'bg-white text-[#1B4332] shadow-2xs font-semibold'
                : 'text-[#5B6370] hover:text-[#22252A]'
            }`}
          >
            Verifier
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-[#F3F3F0] text-[#1B4332] font-semibold'
                  : 'text-[#5B6370] hover:bg-[#F3F3F0]/60 hover:text-[#22252A] font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1B4332]' : 'text-[#5B6370]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#1B4332] shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* PWA Install Button & User Card */}
      <div className="p-3 border-t border-[#E1E4EA] bg-[#FAF9F5] space-y-2">
        <InstallPwaButton variant="outline" className="w-full justify-center bg-white" />
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#E1E4EA]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#E2ECE6] text-[#1B4332] flex items-center justify-center font-semibold text-xs shrink-0">
              {user?.fullName ? user.fullName[0] : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-[#22252A] truncate">{user?.fullName || 'Active User'}</div>
              <div className="text-xs text-[#5B6370] capitalize truncate">{role} &bull; {user?.cityName || 'Pakistan'}</div>
            </div>
          </div>
          <button
            onClick={logout}
            aria-label="Sign out"
            className="p-1.5 text-[#5B6370] hover:text-[#22252A] hover:bg-[#F3F3F0] rounded-md transition focus-ring cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-[#E1E4EA] bg-white flex-col h-screen sticky top-0 z-30 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Accessible Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer Panel */}
          <aside
            className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-modal-enter"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Drawer"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
