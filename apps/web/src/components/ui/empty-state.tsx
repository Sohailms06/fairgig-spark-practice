import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`card-subtle p-8 flex flex-col items-center justify-center text-center ${className}`}
      role="status"
    >
      <div className="w-10 h-10 rounded-full bg-[#F3F3F0] border border-[#E1E4EA] flex items-center justify-center text-[#1B4332] mb-3">
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-[#22252A] tracking-tight">{title}</h3>
      <p className="text-xs text-[#5B6370] max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-press focus-ring px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#1B4332] text-white hover:bg-[#2D6A4F] shadow-2xs cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
