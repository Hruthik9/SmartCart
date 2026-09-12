import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, Mic, ShoppingBag } from 'lucide-react';
import type { Product } from '../types/grocery';

export type DynamicIslandState = 
  | { mode: 'idle' }
  | { mode: 'scanned'; product: Product }
  | { mode: 'listening'; transcript: string }
  | { mode: 'swap_saved'; amount: number }
  | { mode: 'budget_alert'; overAmount: number };

interface DynamicIslandProps {
  state: DynamicIslandState;
  cartCount: number;
  totalSpent: number;
  onTap?: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  state,
  cartCount,
  totalSpent,
  onTap
}) => {
  return (
    <div className="w-full flex justify-center pt-2 pb-1 px-4 z-40 select-none">
      <div 
        onClick={onTap}
        className={`bg-black text-white rounded-full transition-all duration-300 ease-out border border-white/10 shadow-2xl flex items-center justify-between cursor-pointer ${
          state.mode === 'idle'
            ? 'w-44 h-8 px-3'
            : state.mode === 'listening'
            ? 'w-64 h-10 px-4 ring-2 ring-ios-blue/50'
            : state.mode === 'scanned'
            ? 'w-72 h-11 px-3 ring-2 ring-ios-green/50'
            : state.mode === 'swap_saved'
            ? 'w-64 h-10 px-4 ring-2 ring-ios-purple/50'
            : 'w-64 h-10 px-4 ring-2 ring-ios-red/50'
        }`}
      >
        {state.mode === 'idle' && (
          <>
            <div className="flex items-center space-x-1.5 text-xs text-zinc-300">
              <ShoppingBag className="w-3.5 h-3.5 text-ios-green" />
              <span className="font-semibold text-white">{cartCount}</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
            </div>
            <div className="text-xs font-semibold text-zinc-300 font-mono">
              ${totalSpent.toFixed(2)}
            </div>
          </>
        )}

        {state.mode === 'listening' && (
          <div className="w-full flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-ios-blue animate-ping" />
              <Mic className="w-3.5 h-3.5 text-ios-blue" />
              <span className="font-medium text-zinc-200 truncate max-w-[120px]">
                {state.transcript || 'Listening...'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-1 h-3 bg-ios-blue rounded-full animate-wave" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-ios-blue rounded-full animate-wave" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-2 bg-ios-blue rounded-full animate-wave" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {state.mode === 'scanned' && (
          <div className="w-full flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 min-w-0">
              <img 
                src={state.product.image} 
                alt={state.product.name} 
                className="w-7 h-7 rounded-full object-cover border border-white/20 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-white truncate max-w-[110px] text-[11px] leading-tight">
                  {state.product.name}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {state.product.brand}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              <span className="font-bold text-ios-green text-xs font-mono">
                +${state.product.price.toFixed(2)}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-ios-green" />
            </div>
          </div>
        )}

        {state.mode === 'swap_saved' && (
          <div className="w-full flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-ios-purple font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Smart Swap Applied!</span>
            </div>
            <span className="text-white font-bold bg-ios-purple/30 px-2 py-0.5 rounded-full text-[11px]">
              Save ${state.amount.toFixed(2)}
            </span>
          </div>
        )}

        {state.mode === 'budget_alert' && (
          <div className="w-full flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-ios-red font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
              <span>Budget Exceeded</span>
            </div>
            <span className="text-white font-bold bg-ios-red/30 px-2 py-0.5 rounded-full text-[11px]">
              +${state.overAmount.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
