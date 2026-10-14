'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Filter,
  Flame,
  ShieldCheck,
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
      subtitle="Public transparency feed aggregating recurring platform disputes & collective worker actions."
    >
      {/* Privacy Safeguard Banner */}
      <div className="mb-6 p-4 rounded-xl border border-[#E1E4EA] bg-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1B4332] text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#22252A]">K-Anonymity &amp; PII Concealment Enforced</div>
            <div className="text-xs text-[#5B6370] mt-0.5">
              Worker identities, private evidence attachments, and phone numbers are scrubbed from public broadcasts.
            </div>
          </div>
        </div>
        <span className="text-xs bg-[#FAF9F5] border border-[#E1E4EA] text-[#1B4332] px-2.5 py-1 rounded-md font-mono font-medium">
          ANON Masking Active
        </span>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#5B6370] bg-white border border-[#E1E4EA] px-3 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-[#5B6370]" aria-hidden="true" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-[#22252A] font-medium focus:outline-none cursor-pointer"
              aria-label="Filter community feed by platform"
            >
              <option value="all">All Platforms</option>
              <option value="careem">Careem Pakistan</option>
              <option value="indrive">inDrive Pakistan</option>
              <option value="foodpanda">Foodpanda Pakistan</option>
              <option value="bykea">Bykea</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5B6370] bg-white border border-[#E1E4EA] px-3 py-1.5 rounded-lg">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-[#22252A] font-medium focus:outline-none cursor-pointer"
              aria-label="Filter community feed by dispute category"
            >
              <option value="all">All Dispute Categories</option>
              <option value="unexplained_deduction">Unexplained Deductions</option>
              <option value="fare_underpayment">Fare Underpayments</option>
              <option value="surge_manipulation">Surge Manipulations</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-[#5B6370] tabular-nums">{filteredFeed.length} collective reports visible</span>
      </div>

      {/* Community Feed Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-subtle p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20 rounded-md" />
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
                  <span className="font-mono text-xs font-semibold text-[#1B4332] bg-[#FAF9F5] border border-[#E1E4EA] px-2.5 py-0.5 rounded-md">
                    {item.anonymousWorkerId || 'ANON-7110A1'}
                  </span>
                  <span className="text-xs text-[#5B6370] capitalize font-medium">Platform: {item.platform}</span>
                  <span className="text-[#E1E4EA]">&bull;</span>
                  <span className="text-xs text-[#5B6370] tabular-nums">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <span className="px-2.5 py-0.5 rounded-md capitalize text-[10px] bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20">
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-semibold text-[#22252A] mb-1.5 tracking-tight">{item.title}</h3>
              <p className="text-xs text-[#5B6370] leading-relaxed mb-4">{item.description}</p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E1E4EA] text-xs">
                <div className="flex items-center gap-4 text-[#5B6370]">
                  <span>
                    Total Claimed Impact: <strong className="text-[#22252A] tabular-nums">PKR {item.claimedLossAmount}</strong>
                  </span>
                  <span>Category: <strong className="capitalize text-[#22252A]">{item.category?.replace(/_/g, ' ')}</strong></span>
                </div>

                {item.affectedWorkersCount && (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#D97706] bg-[#D97706]/10 px-2.5 py-1 rounded-md border border-[#D97706]/20">
                    <Flame className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
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
