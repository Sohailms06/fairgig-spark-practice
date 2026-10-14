'use client';

import React from 'react';
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
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, switchDemoUser } = useAuth();

  const role = user?.role || 'worker';

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

  return (
    <aside className="w-64 border-r border-[#E7E5E4] bg-white flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-[#E7E5E4]">
        <div className="w-8 h-8 rounded-lg bg-[#1E3A2F] flex items-center justify-center text-white font-bold text-sm">
          FG
        </div>
        <div>
          <div className="font-semibold text-sm tracking-tight text-[#1C1917]">FairGig Platform</div>
          <div className="text-[11px] font-medium text-[#78716C] uppercase tracking-wider">
            {role === 'advocate' ? 'Advocate Portal' : role === 'verifier' ? 'Verifier Audit' : 'Worker Workspace'}
          </div>
        </div>
      </div>

      {/* Role Switcher for Hackathon Judges */}
      <div className="p-3 bg-[#FAFAF8] border-b border-[#E7E5E4]">
        <div className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
          <span>Judge Quick-Switch</span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">1-Click</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => switchDemoUser('worker')}
            className={`px-2 py-1 text-xs rounded font-medium transition ${
              role === 'worker'
                ? 'bg-[#1E3A2F] text-white shadow-xs'
                : 'bg-white border border-[#E7E5E4] text-[#44403C] hover:bg-stone-50'
            }`}
          >
            Worker
          </button>
          <button
            onClick={() => switchDemoUser('advocate')}
            className={`px-2 py-1 text-xs rounded font-medium transition ${
              role === 'advocate'
                ? 'bg-[#1E3A2F] text-white shadow-xs'
                : 'bg-white border border-[#E7E5E4] text-[#44403C] hover:bg-stone-50'
            }`}
          >
            Advocate
          </button>
          <button
            onClick={() => switchDemoUser('verifier')}
            className={`px-2 py-1 text-xs rounded font-medium transition ${
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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1E3A2F]' : 'text-[#78716C]'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#1E3A2F]" />}
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
            title="Sign out"
            className="p-1.5 text-[#78716C] hover:text-[#1C1917] hover:bg-stone-100 rounded-md transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
