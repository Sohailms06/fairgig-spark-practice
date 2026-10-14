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
    { label: 'Shifts & Earnings', href: '/dashboard/earnings', icon: Calendar },
    { label: 'Anomaly Insights', href: '/dashboard/anomalies', icon: AlertTriangle },
    { label: 'My Grievances', href: '/dashboard/grievances', icon: FileText },
    { label: 'Income Certificate', href: '/dashboard/certificates', icon: Sparkles },
    { label: 'Community Feed', href: '/community', icon: Users },
  ];

  const advocateNav = [
    { label: 'Advocate Intelligence', href: '/advocate', icon: BarChart3 },
    { label: 'Collective Clusters', href: '/advocate/grievances', icon: Layers },
    { label: 'Commission Trends', href: '/advocate/commissions', icon: TrendingDown },
    { label: 'Vulnerability Radar', href: '/advocate/zones', icon: AlertTriangle },
    { label: 'Community Feed', href: '/community', icon: Users },
  ];

  const verifierNav = [
    { label: 'Evidence Queue', href: '/verifier', icon: ShieldCheck },
    { label: 'Audit History', href: '/verifier/history', icon: Calendar },
    { label: 'Community Feed', href: '/community', icon: Users },
  ];

  const navItems = role === 'advocate' ? advocateNav : role === 'verifier' ? verifierNav : workerNav;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#E7E5E4]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A2F] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            FG
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight text-[#1C1917]">FairGig Platform</div>
            <div className="text-[11px] font-medium text-[#78716C] uppercase tracking-wider">
              {role === 'advocate' ? 'Advocate Portal' : role === 'verifier' ? 'Verifier Audit' : 'Worker Workspace'}
            </div>
          </div>
        </div>

        {/* Close Button on Mobile */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-md focus-ring"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Switcher for Hackathon Judges */}
      <div className="p-3 bg-[#FAFAF8] border-b border-[#E7E5E4]">
        <div className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
          <span>Judge Quick-Switch</span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-medium">1-Click</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => switchDemoUser('worker')}
            className={`btn-press px-2 py-1.5 text-xs rounded-md font-medium transition cursor-pointer ${
              role === 'worker'
                ? 'bg-[#1E3A2F] text-white shadow-xs'
                : 'bg-white border border-[#E7E5E4] text-[#44403C] hover:bg-stone-50'
            }`}
          >
            Worker
          </button>
          <button
            onClick={() => switchDemoUser('advocate')}
            className={`btn-press px-2 py-1.5 text-xs rounded-md font-medium transition cursor-pointer ${
              role === 'advocate'
                ? 'bg-[#1E3A2F] text-white shadow-xs'
                : 'bg-white border border-[#E7E5E4] text-[#44403C] hover:bg-stone-50'
            }`}
          >
            Advocate
          </button>
          <button
            onClick={() => switchDemoUser('verifier')}
            className={`btn-press px-2 py-1.5 text-xs rounded-md font-medium transition cursor-pointer ${
              role === 'verifier'
                ? 'bg-[#1E3A2F] text-white shadow-xs'
                : 'bg-white border border-[#E7E5E4] text-[#44403C] hover:bg-stone-50'
            }`}
          >
            Verifier
          </button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
        <div className="text-[11px] font-semibold text-[#78716C] uppercase tracking-wider px-3 mb-2">Navigation</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-[#F2F7F4] text-[#1E3A2F] font-semibold'
                  : 'text-[#44403C] hover:bg-[#FAFAF8] hover:text-[#1C1917]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1E3A2F]' : 'text-[#78716C]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#1E3A2F] shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Current User Card & Logout */}
      <div className="p-3 border-t border-[#E7E5E4] bg-[#FAFAF8]">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E7E5E4]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#E2ECE6] text-[#1E3A2F] flex items-center justify-center font-bold text-xs shrink-0">
              {user?.fullName ? user.fullName[0] : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-[#1C1917] truncate">{user?.fullName || 'Active User'}</div>
              <div className="text-[10px] text-[#78716C] capitalize truncate">{role} &bull; {user?.cityName || 'Pakistan'}</div>
            </div>
          </div>
          <button
            onClick={logout}
            aria-label="Sign out"
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-stone-100 rounded-md transition focus-ring cursor-pointer"
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
      <aside className="hidden lg:flex w-64 border-r border-[#E7E5E4] bg-white flex-col h-screen sticky top-0 z-30 shrink-0">
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
