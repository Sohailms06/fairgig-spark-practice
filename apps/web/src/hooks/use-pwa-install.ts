'use client';

import { useState, useEffect } from 'react';

export interface PwaInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  showIOSPrompt: boolean;
  setShowIOSPrompt: (val: boolean) => void;
  showInstructionModal: boolean;
  setShowInstructionModal: (val: boolean) => void;
  installApp: () => Promise<boolean>;
}

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check standalone mode (already installed & running as PWA)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isStandaloneNavigator = (window.navigator as any).standalone === true;
      const standalone = isStandaloneMedia || isStandaloneNavigator;
      setIsStandalone(standalone);
      if (standalone) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      return standalone;
    };

    const standalone = checkStandalone();

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIosDevice);

    if (isIosDevice && !standalone) {
      // iOS Safari does not support beforeinstallprompt; user can install manually
      setIsInstallable(true);
    }

    // Listen for Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowIOSPrompt(false);
      setShowInstructionModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (isStandalone) {
      return false;
    }

    // Chromium native prompt flow
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          setDeferredPrompt(null);
          return true;
        } else {
          setDeferredPrompt(null);
          setIsInstallable(false);
          return false;
        }
      } catch (err) {
        console.warn('[PWA] Prompt error:', err);
      }
    }

    // iOS manual guidance flow
    if (isIOS) {
      setShowIOSPrompt(true);
      return false;
    }

    // Desktop other browsers manual instruction
    setShowInstructionModal(true);
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isStandalone,
    showIOSPrompt,
    setShowIOSPrompt,
    showInstructionModal,
    setShowInstructionModal,
    installApp,
  };
}
