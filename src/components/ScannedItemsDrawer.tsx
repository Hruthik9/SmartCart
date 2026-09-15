import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Camera, 
  ChevronDown
} from 'lucide-react';
import type { ScannedRecord, CartItem, Product } from '../types/grocery';

interface ScannedItemsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  scannedRecords: ScannedRecord[];
  cartItems: CartItem[];
  onAddToCart: (product: Product, quantity: number) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onInspectProduct: (product: Product) => void;
  onClearHistory: () => void;
  onDeleteRecord: (recordId: string) => void;
  onAddAllPendingToCart: () => void;
  onOpenCart?: () => void;
}

export const ScannedItemsDrawer: React.FC<ScannedItemsDrawerProps> = ({
  isOpen,
  onClose,
  scannedRecords,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onInspectProduct,
  onClearHistory,
  onDeleteRecord,
  onAddAllPendingToCart,
  onOpenCart,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_cart'>('all');

  if (!isOpen) return null;

  // Check which products are already in cart
  const cartProductMap = new Map<string, CartItem>();
  cartItems.forEach(item => {
    cartProductMap.set(item.product.id, item);
  });

  const pendingItems = scannedRecords.filter(r => !cartProductMap.has(r.product.id));
  const inCartItems = scannedRecords.filter(r => cartProductMap.has(r.product.id));

  const filteredRecords = scannedRecords.filter(record => {
    const isInCart = cartProductMap.has(record.product.id);
    if (filter === 'pending') return !isInCart;
    if (filter === 'in_cart') return isInCart;
    return true;
  });

  const pendingTotal = pendingItems.reduce((sum, r) => sum + r.product.price, 0);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      
      {/* Slide-Up Container */}
      <div className="w-full max-w-md bg-ios-card border-t border-white/10 rounded-t-[36px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
        
        {/* Grab Handle */}
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-zinc-600/60" />
        </div>

        {/* Drawer Header */}
        <div className="flex justify-between items-center px-5 pt-1 pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-ios-blue/20 text-ios-blue flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-1.5">
                <span>Scanned Session Items</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                  {scannedRecords.length}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Photos & products snapped during this store walk
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {scannedRecords.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-zinc-400 hover:text-ios-red p-1.5 rounded-lg hover:bg-zinc-800 transition"
                title="Clear scanned list"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Header Banner if items are pending */}
        {pendingItems.length > 0 && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-ios-blue/15 to-purple-600/15 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">
                {pendingItems.length} {pendingItems.length === 1 ? 'item' : 'items'} ready for cart
              </p>
              <p className="text-[10px] text-zinc-300">
                Pending Subtotal: <span className="font-mono text-ios-green font-semibold">${pendingTotal.toFixed(2)}</span>
              </p>
            </div>

            <button
              onClick={onAddAllPendingToCart}
              className="px-3 py-1.5 rounded-xl bg-ios-blue text-white text-xs font-semibold flex items-center space-x-1 shadow active:scale-95 transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add All ({pendingItems.length})</span>
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-1.5 px-4 pt-3 pb-2 border-b border-white/5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              filter === 'all'
                ? 'bg-white text-black shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            All Snaps ({scannedRecords.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              filter === 'pending'
                ? 'bg-ios-blue text-white shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            Pending Cart ({pendingItems.length})
          </button>
          <button
            onClick={() => setFilter('in_cart')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              filter === 'in_cart'
                ? 'bg-ios-green text-black shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-white'
            }`}
          >
            In Cart ({inCartItems.length})
          </button>
        </div>

        {/* Scanned Items Scroll List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 no-scrollbar">
          {filteredRecords.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-6">
              <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-3">
                <Camera className="w-6 h-6 text-zinc-500" />
              </div>
              <h4 className="text-sm font-bold text-white">No items in this filter</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                {filter === 'pending'
                  ? 'All your scanned items are already in your cart!'
                  : 'Point your camera at groceries, Walmart, or Target products and tap the shutter button to take snaps.'}
              </p>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const { id, product, snapshotUrl, scannedAt } = record;
              const cartEntry = cartProductMap.get(product.id);
              const isInCart = !!cartEntry;
              const displayImage = snapshotUrl || product.image;

              return (
                <div
                  key={id}
                  className={`p-3 rounded-2xl border transition-all flex items-center space-x-3 ${
                    isInCart 
                      ? 'bg-zinc-900/60 border-white/5' 
                      : 'bg-zinc-900/90 border-white/10 shadow-md'
                  }`}
                >
                  {/* Photo Thumbnail */}
                  <div
                    onClick={() => onInspectProduct(product)}
                    className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/15 flex-shrink-0 cursor-pointer group shadow"
                  >
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {snapshotUrl ? (
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[7px] font-black text-ios-blue text-center py-0.2">
                        📸 SNAP
                      </span>
                    ) : (
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[7px] font-semibold text-zinc-400 text-center py-0.2">
                        ART
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div 
                    onClick={() => onInspectProduct(product)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center space-x-1.5">
                      <p className="text-[10px] font-medium text-ios-blue truncate">{product.brand}</p>
                      <span className="text-[9px] text-zinc-500">•</span>
                      <span className="text-[9px] text-zinc-400">{formatTimeAgo(scannedAt)}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white truncate leading-snug">
                      {product.name}
                    </h4>

                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs font-mono font-bold text-ios-green">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.nutriScore ? (
                        <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-300 font-bold">
                          Score {product.nutriScore}
                        </span>
                      ) : (
                        <span className="text-[8px] px-1 rounded bg-ios-blue/20 text-ios-blue font-bold">
                          Mart Pick
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cart Action Buttons */}
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {isInCart ? (
                      <div className="flex items-center bg-zinc-800 rounded-xl p-0.5 border border-white/10">
                        <button
                          onClick={() => onUpdateQuantity(product.id, -1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-white">
                          {cartEntry.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAddToCart(product, 1)}
                        className="px-3 py-1.5 rounded-xl bg-ios-green text-black font-bold text-xs flex items-center space-x-1 shadow active:scale-95 transition hover:bg-emerald-400"
                        title="Move this item to Cart"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Move to Cart</span>
                      </button>
                    )}

                    <button
                      onClick={() => onInspectProduct(product)}
                      className="px-2 py-1.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white font-medium text-[11px] border border-white/5 transition"
                      title="Open full item details"
                    >
                      Details ↗
                    </button>

                    <button
                      onClick={() => onDeleteRecord(id)}
                      className="p-1.5 text-zinc-500 hover:text-ios-red rounded-lg transition"
                      title="Remove from scan history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Bar Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/50">
          <div className="text-xs text-zinc-400">
            <span className="text-white font-semibold">{inCartItems.length}</span> of {scannedRecords.length} in Cart
          </div>

          <div className="flex items-center space-x-2">
            {onOpenCart && cartItems.length > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="px-3.5 py-2 rounded-xl bg-ios-blue text-white font-semibold text-xs flex items-center space-x-1.5 shadow active:scale-95 transition"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Go to Cart ({cartItems.length})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 text-white font-medium text-xs hover:bg-zinc-700 transition active:scale-95"
            >
              Back to Camera
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
