import React from 'react';
import { 
  PieChart, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders 
} from 'lucide-react';
import type { CartItem, ProductCategory } from '../types/grocery';

interface BudgetTrackerProps {
  cartItems: CartItem[];
  budgetLimit: number;
  onUpdateBudget: (newLimit: number) => void;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  cartItems,
  budgetLimit,
  onUpdateBudget,
}) => {
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = subtotal * 0.07;
  const total = subtotal + tax;
  const percentUsed = Math.min(100, Math.round((total / (budgetLimit || 1)) * 100));
  const remaining = budgetLimit - total;
  const isOver = remaining < 0;

  // Category breakdown
  const categoryTotals: Partial<Record<ProductCategory, number>> = {};

  cartItems.forEach(item => {
    categoryTotals[item.product.category] = (categoryTotals[item.product.category] || 0) + item.product.price * item.quantity;
  });

  const categories = Object.entries(categoryTotals)
    .filter(([, amount]) => (amount ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)) as [ProductCategory, number][];

  return (
    <div className="w-full h-full flex flex-col bg-black text-white px-4 pt-2 pb-24 overflow-hidden">
      
      {/* Header */}
      <div className="py-3 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
          <PieChart className="w-5 h-5 text-ios-orange" />
          <span>Spending & Budget</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Track in-store spending against your shopping budget
        </p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pt-3">
        
        {/* Main Budget Progress Card */}
        <div className={`p-4 rounded-3xl border transition-all ${
          isOver 
            ? 'bg-red-950/30 border-ios-red/40' 
            : percentUsed > 80 
            ? 'bg-amber-950/20 border-ios-orange/30' 
            : 'bg-ios-card border-white/10 shadow-xl'
        }`}>
          <div className="flex justify-between items-baseline mb-2">
            <div>
              <p className="text-xs text-zinc-400 font-medium">Estimated Total (w/ Tax)</p>
              <h2 className="text-3xl font-black text-white font-mono mt-0.5">
                ${total.toFixed(2)}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400 font-medium">Budget Limit</p>
              <p className="text-xl font-bold text-zinc-300 font-mono mt-0.5">
                ${budgetLimit.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3.5 rounded-full bg-zinc-900 overflow-hidden p-0.5 border border-white/5 my-3">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isOver 
                  ? 'bg-ios-red shadow-[0_0_12px_rgba(255,69,58,0.8)]' 
                  : percentUsed > 80 
                  ? 'bg-ios-orange' 
                  : 'bg-ios-green shadow-[0_0_10px_rgba(48,209,88,0.6)]'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          {/* Status Details */}
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-300">
              {percentUsed}% of budget used
            </span>
            {isOver ? (
              <span className="font-bold text-ios-red flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Over by ${Math.abs(remaining).toFixed(2)}</span>
              </span>
            ) : (
              <span className="font-bold text-ios-green flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>${remaining.toFixed(2)} remaining</span>
              </span>
            )}
          </div>
        </div>

        {/* Budget Limit Quick Adjuster */}
        <div className="bg-ios-card p-4 rounded-3xl border border-white/10 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-ios-blue" />
              <span>Adjust Target Budget</span>
            </span>
            <span className="text-xs font-mono font-bold text-ios-blue bg-ios-blue/10 px-2.5 py-0.5 rounded-full border border-ios-blue/20">
              ${budgetLimit}
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={15}
            max={200}
            step={5}
            value={budgetLimit}
            onChange={(e) => onUpdateBudget(Number(e.target.value))}
            className="w-full accent-ios-blue cursor-pointer"
          />

          {/* Preset Buttons */}
          <div className="flex justify-between gap-1.5 pt-1">
            {[25, 50, 75, 100, 150].map((amt) => (
              <button
                key={amt}
                onClick={() => onUpdateBudget(amt)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                  budgetLimit === amt 
                    ? 'bg-ios-blue text-white shadow' 
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Cost Breakdown Details */}
        <div className="bg-ios-card p-4 rounded-3xl border border-white/10 space-y-2 text-xs">
          <h3 className="text-xs font-bold text-zinc-200 mb-2">Detailed Breakdown</h3>
          <div className="flex justify-between text-zinc-400">
            <span>Items Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span className="font-mono text-zinc-200">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Estimated State & Local Tax (7%)</span>
            <span className="font-mono text-zinc-200">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-white pt-2 border-t border-white/5">
            <span>Grand Total</span>
            <span className="font-mono text-sm">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Category Breakdown */}
        {categories.length > 0 && (
          <div className="bg-ios-card p-4 rounded-3xl border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200">Category Spending</h3>
            <div className="space-y-2">
              {categories.map(([cat, amount]) => {
                const catPercent = Math.round((amount / (subtotal || 1)) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{cat}</span>
                      <span className="text-zinc-400 font-mono">${amount.toFixed(2)} ({catPercent}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-ios-blue to-ios-purple"
                        style={{ width: `${catPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
