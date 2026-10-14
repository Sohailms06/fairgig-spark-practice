import React from 'react';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`shimmer rounded-md ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-subtle p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 'h-72', title }: { height?: string; title?: string }) {
  return (
    <div className="card-subtle p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          {title ? (
            <div className="text-sm font-semibold text-[#1C1917]">{title}</div>
          ) : (
            <Skeleton className="h-4 w-36" />
          )}
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-7 w-20 rounded-md" />
      </div>

      <div className={`w-full ${height} rounded-lg bg-[#FAF9F6] border border-[#E7E5E4]/60 p-4 flex flex-col justify-between relative overflow-hidden`}>
        <div className="absolute inset-0 shimmer opacity-40" />
        {/* Simulated gridlines */}
        <div className="border-b border-[#E7E5E4]/50 w-full" />
        <div className="border-b border-[#E7E5E4]/50 w-full" />
        <div className="border-b border-[#E7E5E4]/50 w-full" />
        <div className="border-b border-[#E7E5E4]/50 w-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card-subtle overflow-hidden">
      <div className="p-4 border-b border-[#E7E5E4] flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="p-4 space-y-3">
        {/* Table header */}
        <div className="grid grid-cols-5 gap-4 pb-2 border-b border-[#E7E5E4]/60">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-3/4" />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid grid-cols-5 gap-4 py-2 border-b border-[#E7E5E4]/40 last:border-0">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-3.5 w-5/6" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
