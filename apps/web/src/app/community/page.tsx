'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldAlert,
  Layers,
  Filter,
  Flame,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { apiClient } from '@/lib/api-client';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommunityBoardPage() {
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      try {
        const data = await apiClient.getPublicCommunityFeed();
        setFeed(data);
      } catch (err) {
        console.error('Failed to load community feed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  const filteredFeed = feed.filter((item) => {
    if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    return true;
  });

  return (
    <AppShell
      title="Anonymous Community Board"
      subtitle="Public transparency feed aggregating recurring platform disputes & collective worker actions"
    >
      {/* Privacy Safeguard Banner */}
      <div className="mb-6 p-4 rounded-xl border border-[#C5D9CE] bg-[#F2F7F4] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A2F] text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#1C1917]">K-Anonymity &amp; PII Concealment Enforced</div>
            <div className="text-[11px] text-[#44403C]">
              Worker identities, private evidence URLs, and phone numbers are scrubbed from public broadcasts.
            </div>
          </div>
        </div>
        <span className="text-[11px] bg-white border border-[#C5D9CE] text-[#1E3A2F] px-2.5 py-1 rounded-md font-mono font-medium shadow-2xs">
          ANON Masking Active
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#78716C] bg-white border border-[#E7E5E4] px-3 py-1.5 rounded-lg shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-[#78716C]" aria-hidden="true" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-[#1C1917] font-medium focus:outline-none cursor-pointer"
              aria-label="Filter community feed by platform"
            >
              <option value="all">All Platforms</option>
              <option value="careem">Careem Pakistan</option>
              <option value="indrive">inDrive Pakistan</option>
              <option value="foodpanda">Foodpanda Pakistan</option>
              <option value="bykea">Bykea</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#78716C] bg-white border border-[#E7E5E4] px-3 py-1.5 rounded-lg shadow-2xs">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-[#1C1917] font-medium focus:outline-none cursor-pointer"
              aria-label="Filter community feed by dispute category"
            >
              <option value="all">All Dispute Categories</option>
              <option value="unexplained_deduction">Unexplained Deductions</option>
              <option value="fare_underpayment">Fare Underpayments</option>
              <option value="surge_manipulation">Surge Manipulations</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-[#78716C]">{filteredFeed.length} collective reports visible</span>
      </div>

      {/* Community Feed Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-subtle p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filteredFeed.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Reports Found"
          description="There are currently no public grievance reports matching the selected filters."
        />
      ) : (
        <div className="space-y-4">
          {filteredFeed.map((item) => (
            <div key={item.id} className="card-subtle p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#1E3A2F] bg-[#E2ECE6] px-2.5 py-0.5 rounded">
                    {item.anonymousWorkerId || 'ANON-7110A1'}
                  </span>
                  <span className="text-xs text-[#78716C] capitalize font-medium">Platform: {item.platform}</span>
                  <span className="text-[#E7E5E4]">&bull;</span>
                  <span className="text-xs text-[#78716C]">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="px-2.5 py-0.5 rounded-full capitalize text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[#1C1917] mb-1.5">{item.title}</h3>
              <p className="text-xs text-[#44403C] leading-relaxed mb-4">{item.description}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F0EFEA] text-xs">
                <div className="flex items-center gap-4 text-[#78716C]">
                  <span>
                    Total Claimed Impact: <strong className="text-[#1C1917]">PKR {item.claimedLossAmount}</strong>
                  </span>
                  <span>Category: <strong className="capitalize">{item.category?.replace(/_/g, ' ')}</strong></span>
                </div>

                {item.affectedWorkersCount && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                    <Flame className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                    <span>{item.affectedWorkersCount} Workers Affected by this Pattern</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
