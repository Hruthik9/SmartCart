import React, { useState } from 'react';
import { Smartphone, Monitor, Wifi, BatteryMedium, Signal } from 'lucide-react';

interface IPhoneFrameProps {
  children: React.ReactNode;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({ children }) => {
  const [isFramed, setIsFramed] = useState<boolean>(true);

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] flex flex-col items-center justify-center p-0 sm:p-4 md:p-8 font-sans">
      
      {/* Top Floating Control Bar for Demo / Presentation Mode */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-md mb-3 px-2 text-xs text-zinc-400">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-ios-green animate-pulse" />
          <span className="font-semibold text-zinc-300">SmartCart iOS Prototype</span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] text-zinc-500">HCI Project</span>
        </div>

        <button
          onClick={() => setIsFramed(!isFramed)}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 hover:border-white/30 text-zinc-200 text-xs transition-all active:scale-95 shadow"
        >
          {isFramed ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-ios-blue" />
              <span>Full Screen</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-ios-purple" />
              <span>iPhone Frame</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container */}
      <div
        className={`w-full transition-all duration-300 relative ${
          isFramed
            ? 'max-w-[420px] h-[880px] max-h-[96vh] rounded-[52px] border-[10px] border-[#2c2c2e] shadow-[0_0_80px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20'
            : 'max-w-md h-screen'
        } bg-black flex flex-col overflow-hidden`}
      >
        {/* iOS Status Bar */}
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

        {/* iOS Home Indicator Bar */}
        <div className="w-full flex justify-center py-1.5 bg-black z-30 pointer-events-none select-none">
          <div className="w-32 h-1 bg-white/40 rounded-full" />
        </div>
      </div>

      {/* Presentation Footer */}
      <div className="hidden sm:block text-center mt-3 text-[11px] text-zinc-500">
        Camera modality active. Use the bottom tabs to explore shopping list, smart swaps, and budget tracking.
      </div>

    </div>
  );
};
