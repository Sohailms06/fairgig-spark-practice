import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Failed to Load Data',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`card-subtle p-8 border-red-200 bg-red-50/30 flex flex-col items-center justify-center text-center ${className}`}
      role="alert"
    >
      <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-[#1C1917] tracking-tight">{title}</h3>
      <p className="text-xs text-[#78716C] max-w-sm mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-press focus-ring inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white border border-[#E7E5E4] text-[#1C1917] hover:bg-stone-50 shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#78716C]" aria-hidden="true" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
}
