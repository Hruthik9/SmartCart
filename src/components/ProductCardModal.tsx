import React, { useState } from 'react';
import { X, Plus, Minus, Check, Sparkles, ShieldAlert, ArrowRight, Store, Info } from 'lucide-react';
import type { Product, NutriScore } from '../types/grocery';

interface ProductCardModalProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  onClose: () => void;
  onViewAlternative?: (alternativeId: string) => void;
}

export const ProductCardModal: React.FC<ProductCardModalProps> = ({
  product,
  onAddToCart,
  onClose,
  onViewAlternative,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [showSnapshotView, setShowSnapshotView] = useState<boolean>(!!product.snapshotUrl);

  const isFood = product.isFood !== false && !!product.nutrition && !!product.nutriScore;
  const currentDisplayImage = showSnapshotView && product.snapshotUrl ? product.snapshotUrl : product.image;

  const getNutriColor = (score?: NutriScore) => {
    switch (score) {
      case 'A': return 'bg-[#00C853] text-black';
      case 'B': return 'bg-[#8BC34A] text-black';
      case 'C': return 'bg-[#FFD600] text-black';
      case 'D': return 'bg-[#FF9100] text-black';
      case 'E': return 'bg-[#FF3D00] text-white';
      default: return 'bg-ios-blue text-white';
    }
  };

  const handleAdd = () => {
    onAddToCart(product, quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="w-full max-w-md bg-ios-card border-t border-white/10 rounded-t-[36px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300"
      >
        {/* Grab Handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-zinc-600/60" />
        </div>

        {/* Modal Header & Close */}
        <div className="flex justify-between items-center px-5 pt-1 pb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ios-subtext">
              {product.category}
            </span>
            <span className="text-xs text-zinc-600">•</span>
            <span className="text-xs font-mono text-zinc-500">
              {product.barcode}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 pb-6 space-y-4 no-scrollbar">
          
          {/* Main Visual & Score/Retail Badge */}
          <div className="flex space-x-4 items-start bg-zinc-900/60 p-3 rounded-2xl border border-white/5">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/10 group">
              <img 
                src={currentDisplayImage} 
                alt={product.name} 
                className="w-full h-full object-cover transition-all"
              />
              <div className="absolute top-1 left-1">
                {isFood && product.nutriScore ? (
                  <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase shadow ${getNutriColor(product.nutriScore)}`}>
                    Score {product.nutriScore}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-ios-blue/90 text-white shadow">
                    Mart Pick
                  </span>
                )}
              </div>

              {product.snapshotUrl && (
                <button
                  onClick={() => setShowSnapshotView(!showSnapshotView)}
                  className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-semibold text-zinc-200 border border-white/20 hover:text-white"
                >
                  {showSnapshotView ? 'Snap 📸' : 'Art 🖼️'}
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ios-blue">{product.brand}</p>
              <h2 className="text-base font-bold text-white leading-snug mt-0.5 line-clamp-2">
                {product.name}
              </h2>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-black text-white font-mono">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-xs text-ios-subtext">{product.unit}</span>
              </div>
            </div>
          </div>

          {/* Captured Camera Snapshot Session Card */}
          {product.snapshotUrl && (
            <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-zinc-900/90 border border-ios-blue/30 shadow-md">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20 flex-shrink-0">
                <img 
                  src={product.snapshotUrl} 
                  alt="Captured camera snapshot" 
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowSnapshotView(true)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-ios-green animate-pulse" />
                  <p className="text-xs font-bold text-white">Live Camera Snapshot Captured</p>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Saved to this session and marked as scanned in your cart.
                </p>
              </div>
            </div>
          )}

          {/* Store Availability Tag */}
          {product.storeAvailability && product.storeAvailability.length > 0 && (
            <div className="flex items-center space-x-2 p-2 rounded-xl bg-zinc-900/80 border border-white/5 text-xs text-zinc-300">
              <Store className="w-3.5 h-3.5 text-ios-orange flex-shrink-0" />
              <span>Available at: <strong className="text-white">{product.storeAvailability.join(', ')}</strong></span>
            </div>
          )}

          {/* Badges & Allergen Alert */}
          {product.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.badges.map((b, i) => (
                <span 
                  key={i} 
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-200 border border-white/5"
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          {isFood && product.allergens && product.allergens.length > 0 && (
            <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>Contains: <strong>{product.allergens.join(', ')}</strong></span>
            </div>
          )}

          {/* Product Description */}
          {product.description && (
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/40 p-2.5 rounded-xl border border-white/5">
              {product.description}
            </p>
          )}

          {/* Conditional: Food Nutri-Score & Facts VS Non-Food Retail Specs */}
          {isFood && product.nutrition && product.nutriScore ? (
            <>
              {/* Nutri-Score Spectrum Bar */}
              <div className="bg-zinc-900/80 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-zinc-300">Nutri-Score Rating</span>
                  <span className="text-[11px] text-zinc-400">Nutritional Quality</span>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden p-0.5 bg-black/40 gap-0.5">
                  {(['A', 'B', 'C', 'D', 'E'] as NutriScore[]).map((score) => {
                    const isSelected = product.nutriScore === score;
                    return (
                      <div
                        key={score}
                        className={`flex-1 rounded-sm flex items-center justify-center text-[9px] font-black transition-all ${
                          getNutriColor(score)
                        } ${isSelected ? 'ring-2 ring-white scale-105 z-10' : 'opacity-40'}`}
                      >
                        {score}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nutritional Breakdown Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-white/5">
                  <p className="text-[10px] text-zinc-400">Calories</p>
                  <p className="text-sm font-bold text-white mt-0.5">{product.nutrition.calories}</p>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-white/5">
                  <p className="text-[10px] text-zinc-400">Sugars</p>
                  <p className={`text-sm font-bold mt-0.5 ${parseFloat(product.nutrition.sugars) > 10 ? 'text-ios-red' : 'text-ios-green'}`}>
                    {product.nutrition.sugars}
                  </p>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-white/5">
                  <p className="text-[10px] text-zinc-400">Protein</p>
                  <p className="text-sm font-bold text-white mt-0.5">{product.nutrition.protein}</p>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-white/5">
                  <p className="text-[10px] text-zinc-400">Sodium</p>
                  <p className="text-sm font-bold text-white mt-0.5">{product.nutrition.sodium}</p>
                </div>
              </div>
            </>
          ) : (
            /* Non-Food Retail Specifications Card */
            <div className="bg-zinc-900/80 p-3.5 rounded-2xl border border-white/5 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-300 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-ios-blue" />
                  <span>Product Specifications & Details</span>
                </span>
                <span className="text-[10px] font-bold text-ios-blue bg-ios-blue/10 px-2 py-0.5 rounded-full border border-ios-blue/20">
                  Verified Mart Item
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {product.specs ? (
                  Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="bg-black/40 p-2 rounded-xl border border-white/5">
                      <p className="text-[10px] text-zinc-400">{key}</p>
                      <p className="text-xs font-semibold text-white mt-0.5 truncate">{val}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                      <p className="text-[10px] text-zinc-400">Category</p>
                      <p className="text-xs font-semibold text-white mt-0.5 truncate">{product.category}</p>
                    </div>
                    <div className="bg-black/40 p-2 rounded-xl border border-white/5">
                      <p className="text-[10px] text-zinc-400">Package Unit</p>
                      <p className="text-xs font-semibold text-white mt-0.5 truncate">{product.unit}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Smart Swap Opportunities Teaser */}
          {(product.healthierAlternativeId || product.cheaperAlternativeId) && (
            <div className="bg-gradient-to-r from-ios-purple/15 to-indigo-500/15 p-3.5 rounded-2xl border border-ios-purple/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-ios-purple font-semibold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Smart Alternatives Found</span>
                </div>
                <span className="text-[10px] font-bold bg-ios-purple/30 text-purple-200 px-2 py-0.5 rounded-full">
                  AI Nudge
                </span>
              </div>

              {product.healthExplanation && (
                <p className="text-xs text-zinc-300">
                  <strong className="text-ios-mint">{isFood ? 'Healthier Swap:' : 'Eco / Quality Swap:'}</strong> {product.healthExplanation}
                </p>
              )}

              {product.cheapExplanation && (
                <p className="text-xs text-zinc-300">
                  <strong className="text-ios-orange">Budget Swap:</strong> {product.cheapExplanation}
                </p>
              )}

              {onViewAlternative && (
                <button
                  onClick={() => onViewAlternative(product.healthierAlternativeId || product.cheaperAlternativeId!)}
                  className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-ios-purple/20 hover:bg-ios-purple/30 text-purple-200 text-xs font-semibold transition-colors mt-1"
                >
                  <span>Compare & Swap Alternative</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Quantity Stepper & Add Button */}
          <div className="pt-2 flex items-center space-x-3">
            <div className="flex items-center bg-zinc-800 rounded-2xl p-1 border border-white/10">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 active:scale-95 transition-all"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-sm text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-700 active:scale-95 transition-all"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              className="flex-1 py-3 px-4 rounded-2xl bg-ios-green text-black font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-ios-green/30 hover:bg-emerald-400 active:scale-98 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Add to Cart • ${(product.price * quantity).toFixed(2)}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
