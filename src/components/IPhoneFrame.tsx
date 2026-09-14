import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, BatteryMedium, Signal, Share2, X, QrCode } from 'lucide-react';

interface IPhoneFrameProps {
  children: React.ReactNode;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({ children }) => {
  const [isFramed, setIsFramed] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(true);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  useEffect(() => {
    const checkEnvironment = () => {
      const ua = navigator.userAgent || '';
      const mobileCheck = window.innerWidth < 640 || /iPhone|iPad|iPod|Android/i.test(ua);
      const iosCheck = /iPhone|iPad|iPod/i.test(ua);
      const standaloneCheck =
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches;

      setIsMobile(mobileCheck);
      setIsIOS(iosCheck);
      setIsStandalone(standaloneCheck);
    };

    checkEnvironment();
    window.addEventListener('resize', checkEnvironment);
    return () => window.removeEventListener('resize', checkEnvironment);
  }, []);

  // When on an actual mobile device, render native edge-to-edge view
  if (isMobile) {
    return (
      <div className="w-full min-h-[100dvh] h-[100dvh] bg-black text-white flex flex-col overflow-hidden relative font-sans">
        {/* iOS Web App Install Tip for Safari users who haven't added to Home Screen yet */}
        {!isStandalone && isIOS && showInstallBanner && (
          <div className="fixed top-2 left-2 right-2 z-50 bg-zinc-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3 shadow-2xl animate-fade-in flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-ios-green to-ios-blue flex items-center justify-center shrink-0 shadow-md">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-[13px]">Install SmartCart Beta</p>
                <p className="text-zinc-300 text-[11px] leading-tight mt-0.5">
                  Tap <span className="text-ios-blue font-semibold">Share</span> in Safari, then tap{' '}
                  <span className="text-white font-semibold">"Add to Home Screen"</span> for fullscreen app experience.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Real Mobile View: Direct Content */}
        <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
          {children}
        </div>
      </div>
    );
  }

  // Desktop / Tablet Presentation Frame
  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] flex flex-col items-center justify-center p-0 sm:p-4 md:p-8 font-sans">
      {/* Top Floating Control Bar */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-3 px-2 text-xs text-zinc-400">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-ios-green animate-pulse" />
          <span className="font-semibold text-zinc-300">SmartCart iOS PWA Beta</span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] text-zinc-500">iPhone Beta</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 hover:border-white/30 text-zinc-300 text-xs transition-all active:scale-95 shadow"
            title="Open on iPhone"
          >
            <QrCode className="w-3.5 h-3.5 text-ios-green" />
            <span>Test on iPhone</span>
          </button>

          <button
            onClick={() => setIsFramed(!isFramed)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 hover:border-white/30 text-zinc-200 text-xs transition-all active:scale-95 shadow"
          >
            {isFramed ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-ios-blue" />
                <span>Full View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-ios-purple" />
                <span>iPhone Frame</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Mockup Container */}
      <div
        className={`w-full transition-all duration-300 relative ${
          isFramed
            ? 'max-w-[420px] h-[880px] max-h-[96vh] rounded-[52px] border-[10px] border-[#2c2c2e] shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20'
            : 'max-w-md h-screen'
        } bg-black flex flex-col overflow-hidden`}
      >
        {/* Simulated iOS Status Bar on Desktop Mockup */}
        <div className="w-full flex justify-between items-center px-7 pt-3 text-xs font-semibold text-white select-none z-30 pointer-events-none">
          <span className="font-mono text-sm tracking-tight">9:41</span>
          <div className="flex items-center space-x-2 text-zinc-200">
            <Signal className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">5G</span>
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Simulated iOS Home Indicator */}
        <div className="w-full flex justify-center py-1.5 bg-black z-30 pointer-events-none select-none">
          <div className="w-32 h-1 bg-white/40 rounded-full" />
        </div>
      </div>

      {/* Desktop Footer Instructions */}
      <div className="hidden sm:block text-center mt-3 text-[11px] text-zinc-500">
        PWA Ready. Add to Home Screen in Safari on your iPhone for the native full-screen app experience.
      </div>

      {/* QR Code / iPhone Testing Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center relative animate-scale-up">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ios-green to-ios-blue flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Smartphone className="w-6 h-6 text-white" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Install on Your iPhone</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Follow these simple steps to install SmartCart as a beta app on any iPhone:
            </p>

            <div className="text-left bg-black/50 border border-white/10 rounded-2xl p-4 mb-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-ios-blue/20 text-ios-blue font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span className="text-zinc-200">Open the app URL in <strong>Safari</strong> on your iPhone.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-ios-blue/20 text-ios-blue font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span className="text-zinc-200">Tap the <strong>Share</strong> button <Share2 className="inline w-3.5 h-3.5 text-ios-blue mx-0.5" /> (square with arrow up).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-ios-blue/20 text-ios-blue font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span className="text-zinc-200">Scroll down and tap <strong>"Add to Home Screen"</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-ios-green/20 text-ios-green font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                <span className="text-zinc-200">Tap <strong>"Add"</strong> in top right. SmartCart is now installed!</span>
              </div>
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs active:scale-95 transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
