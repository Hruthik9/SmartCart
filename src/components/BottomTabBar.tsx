import React from 'react';
import { Camera, ShoppingCart, Sparkles, PieChart, Mic } from 'lucide-react';

export type TabType = 'scan' | 'cart' | 'swaps' | 'budget';

interface BottomTabBarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  cartItemCount: number;
  availableSwapsCount: number;
  onOpenVoice: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onSelectTab,
  cartItemCount,
  availableSwapsCount,
  onOpenVoice,
}) => {
  return (
    <div className="w-full relative z-30 pointer-events-auto">
      {/* Floating Glass Bar */}
      <div className="mx-4 mb-3 rounded-3xl ios-glass px-3 py-2 flex items-center justify-around shadow-2xl border border-white/10">
        
        {/* Tab 1: Shopping Cart */}
        <button
          onClick={() => onSelectTab('cart')}
          className={`flex flex-col items-center justify-center relative py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'cart' ? 'text-ios-blue scale-105' : 'text-zinc-400 hover:text-white'
          }`}
          aria-label="Shopping Cart"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-ios-blue text-white text-[10px] font-bold px-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center ring-2 ring-black">
                {cartItemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">Cart</span>
        </button>

        {/* Tab 2: Smart Swaps */}
        <button
          onClick={() => onSelectTab('swaps')}
          className={`flex flex-col items-center justify-center relative py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'swaps' ? 'text-ios-purple scale-105' : 'text-zinc-400 hover:text-white'
          }`}
          aria-label="Smart Swaps"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            {availableSwapsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-ios-purple text-white text-[10px] font-bold px-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center ring-2 ring-black animate-pulse">
                {availableSwapsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">Swaps</span>
        </button>

        {/* Central Primary Action: Camera Scanner Button */}
        <button
          onClick={() => onSelectTab('scan')}
          className="relative -top-4 flex flex-col items-center focus:outline-none group"
          aria-label="Camera Scanner"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform transform active:scale-95 ${
            currentTab === 'scan' 
              ? 'bg-gradient-to-tr from-ios-green to-emerald-400 text-black shadow-ios-green/50 ring-4 ring-black' 
              : 'bg-zinc-800 text-white hover:bg-zinc-700 ring-2 ring-white/20'
          }`}>
            <Camera className="w-7 h-7" />
          </div>
          <span className={`text-[10px] font-semibold mt-0.5 ${currentTab === 'scan' ? 'text-ios-green' : 'text-zinc-400'}`}>
            Scan
          </span>
        </button>

        {/* Tab 3: Budget & Analytics */}
        <button
          onClick={() => onSelectTab('budget')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
            currentTab === 'budget' ? 'text-ios-orange scale-105' : 'text-zinc-400 hover:text-white'
          }`}
          aria-label="Budget Tracker"
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Budget</span>
        </button>

        {/* Tab 4: Voice Assistant Trigger */}
        <button
          onClick={onOpenVoice}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-zinc-400 hover:text-ios-blue transition-all"
          aria-label="Voice Assistant"
        >
          <div className="relative">
            <Mic className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-ios-blue animate-pulse" />
          </div>
          <span className="text-[10px] font-medium mt-1">Voice</span>
        </button>

      </div>
    </div>
  );
};
