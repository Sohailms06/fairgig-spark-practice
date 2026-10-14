'use client';

import React from 'react';
import { Smartphone, Download, Share, PlusSquare, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';

interface InstallButtonProps {
  variant?: 'primary' | 'outline' | 'compact';
  className?: string;
  showInstalledBadge?: boolean;
}

export function InstallPwaButton({
  variant = 'outline',
  className = '',
  showInstalledBadge = false,
}: InstallButtonProps) {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    showIOSPrompt,
    setShowIOSPrompt,
    showInstructionModal,
    setShowInstructionModal,
    installApp,
  } = usePwaInstall();

  // If running in standalone PWA mode
  if (isStandalone || isInstalled) {
    if (!showInstalledBadge) return null;
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Installed</span>
      </div>
    );
  }

  // If not installable and not iOS, don't show an inert button
  if (!isInstallable && !isIOS) {
    return null;
  }

  const baseStyle =
    'focus-ring inline-flex items-center gap-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none';

  const variantStyles = {
    primary:
      'bg-[#1B4332] text-white hover:bg-[#2D6A4F] px-3.5 py-2',
    outline:
      'bg-white border border-[#E1E4EA] text-[#22252A] hover:bg-[#F3F3F0] px-3 py-1.5',
    compact:
      'text-[#5B6370] hover:text-[#1B4332] hover:bg-[#F3F3F0] p-1.5 rounded-md',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => installApp()}
        aria-label="Install FairGig application"
        className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      >
        <Smartphone className="w-3.5 h-3.5 text-[#1B4332]" aria-hidden="true" />
        {variant !== 'compact' && <span>Install FairGig</span>}
      </button>

      {/* iOS Safari Installation Instruction Modal */}
      {showIOSPrompt && (
        <div
          className="fixed inset-0 bg-[#22252A]/40 z-50 flex items-center justify-center p-4 animate-modal-enter"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          <div className="bg-white border border-[#E1E4EA] rounded-xl max-w-sm w-full p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E4EA] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1B4332] text-white flex items-center justify-center text-xs font-semibold">
                  FG
                </div>
                <h3 id="ios-install-title" className="text-sm font-semibold text-[#22252A] tracking-tight">
                  Install on iOS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSPrompt(false)}
                className="p-1 text-[#5B6370] hover:text-[#22252A] rounded-md transition-colors focus-ring"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5B6370] leading-relaxed mb-4">
              Install FairGig on your iPhone home screen for an app-like financial workspace:
            </p>

            <ol className="space-y-3 text-xs text-[#22252A] mb-5">
              <li className="flex items-start gap-2.5 p-2.5 bg-[#FAF9F5] border border-[#E1E4EA] rounded-lg">
                <div className="w-6 h-6 rounded-md bg-white border border-[#E1E4EA] flex items-center justify-center shrink-0 text-[#1B4332]">
                  <Share className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <div>
                  <span className="font-semibold block">1. Tap the Share button</span>
                  <span className="text-[11px] text-[#5B6370]">Located in the Safari bottom toolbar.</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 bg-[#FAF9F5] border border-[#E1E4EA] rounded-lg">
                <div className="w-6 h-6 rounded-md bg-white border border-[#E1E4EA] flex items-center justify-center shrink-0 text-[#1B4332]">
                  <PlusSquare className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <div>
                  <span className="font-semibold block">2. Select &ldquo;Add to Home Screen&rdquo;</span>
                  <span className="text-[11px] text-[#5B6370]">Scroll down the share sheet and tap Add.</span>
                </div>
              </li>
            </ol>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowIOSPrompt(false)}
                className="focus-ring px-4 py-1.5 bg-[#1B4332] text-white text-xs font-medium rounded-md hover:bg-[#2D6A4F] transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop / Other Browsers Guidance Modal */}
      {showInstructionModal && (
        <div
          className="fixed inset-0 bg-[#22252A]/40 z-50 flex items-center justify-center p-4 animate-modal-enter"
          role="dialog"
          aria-modal="true"
          aria-labelledby="desktop-install-title"
        >
          <div className="bg-white border border-[#E1E4EA] rounded-xl max-w-sm w-full p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1E4EA] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1B4332] text-white flex items-center justify-center text-xs font-semibold">
                  FG
                </div>
                <h3 id="desktop-install-title" className="text-sm font-semibold text-[#22252A] tracking-tight">
                  Install Application
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructionModal(false)}
                className="p-1 text-[#5B6370] hover:text-[#22252A] rounded-md transition-colors focus-ring"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5B6370] leading-relaxed mb-4">
              You can install FairGig directly to your desktop or mobile home screen via your browser address bar:
            </p>

            <div className="p-3 bg-[#FAF9F5] border border-[#E1E4EA] rounded-lg text-xs space-y-2 mb-5">
              <div className="flex items-center gap-2 text-[#22252A]">
                <Download className="w-4 h-4 text-[#1B4332]" aria-hidden="true" />
                <span className="font-medium">Look for the Install icon in your address bar</span>
              </div>
              <p className="text-[11px] text-[#5B6370]">
                In Chrome, Edge, or Brave, click the computer/download icon in the top right of the URL bar.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstructionModal(false)}
                className="focus-ring px-4 py-1.5 bg-[#1B4332] text-white text-xs font-medium rounded-md hover:bg-[#2D6A4F] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
