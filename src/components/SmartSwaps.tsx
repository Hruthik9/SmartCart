import React from 'react';
import { 
  Sparkles, 
  TrendingDown, 
  Heart, 
  DollarSign, 
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CartItem, Product, NutriScore } from '../types/grocery';
import { PRODUCT_BY_ID } from '../data/groceryCatalog';
import { soundEffects } from '../services/soundEffects';

interface SmartSwapsProps {
  cartItems: CartItem[];
  onSwapItem: (originalProductId: string, newProduct: Product, savings: number) => void;
  onInspectProduct: (product: Product) => void;
}

export const SmartSwaps: React.FC<SmartSwapsProps> = ({
  cartItems,
  onSwapItem,
  onInspectProduct,
}) => {

  const getNutriColor = (score: NutriScore) => {
    switch (score) {
      case 'A': return 'bg-[#00C853] text-black';
      case 'B': return 'bg-[#8BC34A] text-black';
      case 'C': return 'bg-[#FFD600] text-black';
      case 'D': return 'bg-[#FF9100] text-black';
      case 'E': return 'bg-[#FF3D00] text-white';
    }
  };

  // Compile all swap opportunities
  const swapCards: {
    cartItem: CartItem;
    type: 'healthier' | 'cheaper';
    alternative: Product;
    explanation?: string;
    savings: number;
  }[] = [];

  cartItems.forEach(item => {
    if (item.product.healthierAlternativeId) {
      const alt = PRODUCT_BY_ID[item.product.healthierAlternativeId];
      if (alt) {
        swapCards.push({
          cartItem: item,
          type: 'healthier',
          alternative: alt,
          explanation: item.product.healthExplanation,
          savings: Math.max(0, item.product.price - alt.price),
        });
      }
    }
    if (item.product.cheaperAlternativeId) {
      const alt = PRODUCT_BY_ID[item.product.cheaperAlternativeId];
      if (alt) {
        swapCards.push({
          cartItem: item,
          type: 'cheaper',
          alternative: alt,
          explanation: item.product.cheapExplanation,
          savings: item.product.price - alt.price,
        });
      }
    }
  });

  const totalPotentialSavings = swapCards
    .filter(s => s.savings > 0)
    .reduce((sum, s) => sum + s.savings * s.cartItem.quantity, 0);

  const handlePerformSwap = (originalId: string, alt: Product, savings: number) => {
    soundEffects.playSwapChime();
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 }
    });
    onSwapItem(originalId, alt, savings);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black text-white px-4 pt-2 pb-24 overflow-hidden">
      
      {/* Header */}
      <div className="py-3 border-b border-white/10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-ios-purple" />
              <span>Smart Alternatives</span>
            </h1>
            <p className="text-xs text-zinc-400">
              AI-recommended healthier, cheaper & eco-friendly store swaps
            </p>
          </div>
        </div>

        {/* Potential Savings Banner */}
        {totalPotentialSavings > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-zinc-900 border border-ios-green/30 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-ios-green/20 flex items-center justify-center text-ios-green">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Potential Savings: <span className="text-ios-green font-mono">${totalPotentialSavings.toFixed(2)}</span>
                </p>
                <p className="text-[10px] text-zinc-400">
                  Switching to store brand and recommended items cuts costs without sacrificing quality
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Swaps Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pt-3">
        {swapCards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-3">
              <ShieldCheck className="w-8 h-8 text-ios-green" />
            </div>
            <h3 className="text-base font-semibold text-white">Great Job!</h3>
            <p className="text-xs text-zinc-400 max-w-xs mt-1">
              Your cart is already optimized for high quality and budget value. Scan more groceries or retail goods to see more alternatives!
            </p>
          </div>
        ) : (
          swapCards.map(({ cartItem, type, alternative, explanation, savings }, idx) => {
            const isHealthier = type === 'healthier';
            const isFood = cartItem.product.isFood !== false && !!cartItem.product.nutriScore;
            return (
              <div 
                key={`${cartItem.product.id}-${type}-${idx}`}
                className="bg-ios-card rounded-3xl p-4 border border-white/10 shadow-xl space-y-3 relative overflow-hidden"
              >
                {/* Header tag */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    {isHealthier ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-ios-mint/20 text-ios-mint border border-ios-mint/30 flex items-center space-x-1">
                        <Heart className="w-3 h-3 fill-current" />
                        <span>{isFood ? 'Healthier Nutrition Swap' : 'Eco & Quality Upgrade'}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-ios-orange/20 text-ios-orange border border-ios-orange/30 flex items-center space-x-1">
                        <TrendingDown className="w-3 h-3" />
                        <span>Budget Saver Swap</span>
                      </span>
                    )}
                  </div>

                  {savings > 0 && (
                    <span className="text-xs font-bold text-ios-green font-mono bg-ios-green/10 px-2 py-0.5 rounded-full border border-ios-green/20">
                      Save ${(savings * cartItem.quantity).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Comparative Row */}
                <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-2.5 rounded-2xl border border-white/5 relative">
                  
                  {/* Current Item */}
                  <div 
                    onClick={() => onInspectProduct(cartItem.product)}
                    className="p-2 rounded-xl bg-black/40 border border-white/5 cursor-pointer relative"
                  >
                    <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">In Cart</span>
                    <img
                      src={cartItem.product.image}
                      alt={cartItem.product.name}
                      className="w-full h-16 object-cover rounded-lg my-1"
                    />
                    <p className="text-[11px] font-bold text-zinc-300 truncate">{cartItem.product.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-mono font-bold text-white">${cartItem.product.price.toFixed(2)}</span>
                      {cartItem.product.nutriScore ? (
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${getNutriColor(cartItem.product.nutriScore)}`}>
                          {cartItem.product.nutriScore}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                          Retail
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recommended Alternative */}
                  <div 
                    onClick={() => onInspectProduct(alternative)}
                    className="p-2 rounded-xl bg-ios-purple/10 border border-ios-purple/30 cursor-pointer relative"
                  >
                    <span className="text-[9px] font-bold uppercase text-ios-purple tracking-wider flex items-center space-x-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Recommended</span>
                    </span>
                    <img
                      src={alternative.image}
                      alt={alternative.name}
                      className="w-full h-16 object-cover rounded-lg my-1"
                    />
                    <p className="text-[11px] font-bold text-white truncate">{alternative.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-mono font-bold text-ios-green">${alternative.price.toFixed(2)}</span>
                      {alternative.nutriScore ? (
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${getNutriColor(alternative.nutriScore)}`}>
                          {alternative.nutriScore}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-ios-purple/30 text-purple-200">
                          Value Pick
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Explanation text */}
                {explanation && (
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-2.5 rounded-xl border border-white/5">
                    {explanation}
                  </p>
                )}

                {/* 1-Tap Swap Button */}
                <button
                  onClick={() => handlePerformSwap(cartItem.product.id, alternative, savings)}
                  className="w-full py-2.5 px-4 rounded-xl bg-ios-purple text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-ios-purple/30 hover:bg-purple-600 active:scale-98 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Swap for {alternative.name} {savings > 0 ? `(Save $${(savings * cartItem.quantity).toFixed(2)})` : ''}
                  </span>
                </button>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
