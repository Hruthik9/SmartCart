import React from 'react';
import { 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  Sparkles, 
  ShoppingBag, 
  ArrowRight,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import type { CartItem, Product } from '../types/grocery';

interface ShoppingListProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onToggleChecked: (productId: string) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onInspectProduct: (product: Product) => void;
  onGoToSwaps: () => void;
  onFinishShopping: () => void;
  budgetLimit: number;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({
  items,
  onUpdateQuantity,
  onToggleChecked,
  onRemoveItem,
  onClearCart,
  onInspectProduct,
  onGoToSwaps,
  onFinishShopping,
  budgetLimit,
}) => {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const estTax = subtotal * 0.07;
  const grandTotal = subtotal + estTax;
  const isOverBudget = grandTotal > budgetLimit;
  const swapCount = items.filter(i => i.product.healthierAlternativeId || i.product.cheaperAlternativeId).length;

  return (
    <div className="w-full h-full flex flex-col bg-black text-white px-4 pt-2 pb-24 overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center py-3 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Shopping Cart</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-normal">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </h1>
          <p className="text-xs text-zinc-400">
            Tap items to view nutritional facts
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs font-semibold text-zinc-400 hover:text-ios-red flex items-center space-x-1 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Smart Swaps Alert Banner if any items have alternatives */}
      {swapCount > 0 && (
        <div 
          onClick={onGoToSwaps}
          className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-ios-purple/20 to-blue-600/20 border border-ios-purple/40 flex items-center justify-between cursor-pointer hover:border-ios-purple transition-all group"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-ios-purple/30 flex items-center justify-center text-ios-purple flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover:text-purple-200">
                {swapCount} Smart {swapCount === 1 ? 'Alternative' : 'Alternatives'} Available
              </p>
              <p className="text-[11px] text-zinc-300">
                Save money or upgrade nutrition with 1-tap swaps
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-300 transform group-hover:translate-x-1 transition-transform" />
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pt-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-base font-semibold text-white">Your cart is empty</h3>
            <p className="text-xs text-zinc-400 max-w-xs mt-1">
              Use the camera scanner or tap the microphone to quickly add groceries to your list.
            </p>
          </div>
        ) : (
          items.map(({ product, quantity, checked }) => {
            const hasSwap = product.healthierAlternativeId || product.cheaperAlternativeId;
            return (
              <div
                key={product.id}
                className={`p-3 rounded-2xl border transition-all ${
                  checked 
                    ? 'bg-zinc-900/40 border-white/5 opacity-60' 
                    : 'bg-ios-card border-white/10 shadow-lg'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Item Picked Checkbox */}
                  <button
                    onClick={() => onToggleChecked(product.id)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      checked 
                        ? 'bg-ios-green border-ios-green text-black' 
                        : 'border-zinc-500 hover:border-white'
                    }`}
                    aria-label="Mark item as collected"
                  >
                    {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  {/* Product Thumbnail */}
                  <img
                    src={product.image}
                    alt={product.name}
                    onClick={() => onInspectProduct(product)}
                    className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0 cursor-pointer"
                  />

                  {/* Details */}
                  <div 
                    onClick={() => onInspectProduct(product)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <p className="text-[10px] font-medium text-ios-blue truncate">{product.brand}</p>
                    <p className={`text-xs font-bold leading-tight truncate ${checked ? 'line-through text-zinc-400' : 'text-white'}`}>
                      {product.name}
                    </p>
                    <div className="flex items-center space-x-1.5 mt-1">
                      <span className="text-xs font-bold font-mono text-zinc-200">
                        ${(product.price * quantity).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        (${product.price.toFixed(2)}/ea)
                      </span>
                      {hasSwap && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-ios-purple/30 text-purple-300 flex items-center space-x-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Swap</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stepper & Delete */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-zinc-800 rounded-xl p-0.5 border border-white/5">
                      <button
                        onClick={() => onUpdateQuantity(product.id, -1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white active:scale-95"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white active:scale-95"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(product.id)}
                      className="w-8 h-8 rounded-xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-ios-red active:scale-95 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Order Summary */}
      {items.length > 0 && (
        <div className="pt-3 border-t border-white/10 bg-black/90 backdrop-blur-md">
          <div className="space-y-1 text-xs mb-3">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="font-mono">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Estimated Tax (7%)</span>
              <span className="font-mono">${estTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/5">
              <span>Estimated Total</span>
              <span className={`font-mono text-base ${isOverBudget ? 'text-ios-red' : 'text-ios-green'}`}>
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={onFinishShopping}
            className="w-full py-3.5 px-4 rounded-2xl bg-ios-blue text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-ios-blue/30 hover:bg-blue-500 active:scale-98 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish Shopping & Pay</span>
          </button>
        </div>
      )}

    </div>
  );
};
