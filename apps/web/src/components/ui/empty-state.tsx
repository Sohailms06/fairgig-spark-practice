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
      className={`card-subtle p-10 flex flex-col items-center justify-center text-center ${className}`}
      role="status"
    >
      <div className="w-12 h-12 rounded-full bg-[#F2F7F4] border border-[#C5D9CE] flex items-center justify-center text-[#1E3A2F] mb-4">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-[#1C1917] tracking-tight">{title}</h3>
      <p className="text-xs text-[#78716C] max-w-sm mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-press focus-ring px-4 py-2 text-xs font-medium rounded-lg bg-[#1E3A2F] text-white hover:bg-[#234737] shadow-xs cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
