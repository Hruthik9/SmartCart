import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { IPhoneFrame } from './components/IPhoneFrame';
import { DynamicIsland } from './components/DynamicIsland';
import type { DynamicIslandState } from './components/DynamicIsland';
import { BottomTabBar } from './components/BottomTabBar';
import type { TabType } from './components/BottomTabBar';
import { CameraScanner } from './components/CameraScanner';
import { ShoppingList } from './components/ShoppingList';
import { SmartSwaps } from './components/SmartSwaps';
import { BudgetTracker } from './components/BudgetTracker';
import { ProductCardModal } from './components/ProductCardModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { ScannedItemsDrawer } from './components/ScannedItemsDrawer';
import type { CartItem, Product, ProductCategory, ScannedRecord } from './types/grocery';
import { GROCERY_CATALOG, PRODUCT_BY_ID } from './data/groceryCatalog';
import { speechAssistant } from './services/speechService';
import { soundEffects } from './services/soundEffects';

const SCANNED_STORAGE_KEY = 'smartcart_scanned_session_records';
const CART_STORAGE_KEY = 'smartcart_cart_items';

const loadInitialScannedRecords = (): ScannedRecord[] => {
  try {
    const saved = localStorage.getItem(SCANNED_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not read saved scanned records:', e);
  }
  return [];
};

const saveScannedToStorage = (records: ScannedRecord[]) => {
  try {
    const trimmed = records.slice(0, 25);
    localStorage.setItem(SCANNED_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Storage quota limit reached, trimming base64 URLs:', e);
    try {
      const lightweight = records.slice(0, 15).map((r, i) => i < 5 ? r : { ...r, snapshotUrl: undefined });
      localStorage.setItem(SCANNED_STORAGE_KEY, JSON.stringify(lightweight));
    } catch {
      // Ignore
    }
  }
};

const loadInitialCartItems = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not read saved cart items:', e);
  }
  return [
    {
      product: GROCERY_CATALOG[0], // Honey Nut Cheerios ($5.49, Nutri C)
      quantity: 1,
      addedVia: 'manual',
      timestamp: Date.now() - 60000,
      checked: false,
    },
    {
      product: GROCERY_CATALOG[3], // Silk Vanilla Almond Milk ($4.79, Nutri C)
      quantity: 1,
      addedVia: 'manual',
      timestamp: Date.now() - 30000,
      checked: true,
    }
  ];
};

const saveCartToStorage = (items: CartItem[]) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.slice(0, 50)));
  } catch (e) {
    console.warn('Could not save cart items:', e);
  }
};

export const App: React.FC = () => {
  // Cart & Budget State (persisted to localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(loadInitialCartItems);

  const [budgetLimit, setBudgetLimit] = useState<number>(35);
  const [currentTab, setCurrentTab] = useState<TabType>('scan');
  const [scannedProductModal, setScannedProductModal] = useState<Product | null>(null);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState<boolean>(false);
  const [dynamicIslandState, setDynamicIslandState] = useState<DynamicIslandState>({ mode: 'idle' });
  const [lastVoiceFeedback, setLastVoiceFeedback] = useState<string>('');

  // Scanned Session History (persisted to localStorage)
  const [scannedRecords, setScannedRecords] = useState<ScannedRecord[]>(loadInitialScannedRecords);
  const [isScannedDrawerOpen, setIsScannedDrawerOpen] = useState<boolean>(false);

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalSpent = subtotal * 1.07; // with 7% tax
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Count available swaps
  const availableSwapsCount = cartItems.filter(
    item => item.product.healthierAlternativeId || item.product.cheaperAlternativeId
  ).length;

  // Check budget overrun & notify
  useEffect(() => {
    if (totalSpent > budgetLimit && budgetLimit > 0) {
      const overAmount = totalSpent - budgetLimit;
      setDynamicIslandState({ mode: 'budget_alert', overAmount });
      soundEffects.playAlert();
      const timer = setTimeout(() => {
        setDynamicIslandState({ mode: 'idle' });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [totalSpent, budgetLimit]);

  // Handle camera item detection & save into scanned session history
  const handleProductDetected = (product: Product) => {
    // Record into session scanned items (most recent first)
    const newRecord: ScannedRecord = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      product,
      snapshotUrl: product.snapshotUrl,
      scannedAt: Date.now(),
    };
    setScannedRecords(prev => {
      const updated = [newRecord, ...prev.filter(r => r.product.id !== product.id)];
      saveScannedToStorage(updated);
      return updated;
    });
    setScannedProductModal(product);
  };

  // Add all pending scanned items to cart at once
  const handleAddAllPendingToCart = () => {
    const cartProductIds = new Set(cartItems.map(i => i.product.id));
    const pending = scannedRecords.filter(r => !cartProductIds.has(r.product.id));
    if (pending.length === 0) return;

    soundEffects.playSwapChime();
    setCartItems(prev => {
      const additions: CartItem[] = pending.map(r => ({
        product: r.product,
        quantity: 1,
        addedVia: 'camera',
        timestamp: Date.now(),
        checked: false,
        snapshotUrl: r.snapshotUrl,
      }));
      const updated = [...prev, ...additions];
      saveCartToStorage(updated);
      return updated;
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    setDynamicIslandState({ mode: 'scanned', product: pending[0].product });
    setTimeout(() => setDynamicIslandState({ mode: 'idle' }), 3500);
  };

  const handleDeleteScannedRecord = (recordId: string) => {
    setScannedRecords(prev => {
      const updated = prev.filter(r => r.id !== recordId);
      saveScannedToStorage(updated);
      return updated;
    });
  };

  const handleClearScannedHistory = () => {
    setScannedRecords([]);
    try {
      localStorage.removeItem(SCANNED_STORAGE_KEY);
    } catch {}
  };

  // Add item to cart
  const handleAddToCart = (product: Product, quantity: number = 1, addedVia: 'camera' | 'voice' | 'manual' | 'swap' = 'camera') => {
    soundEffects.playScanBeep();
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      let updated: CartItem[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx].quantity += quantity;
        if (product.snapshotUrl) {
          updated[existingIdx].snapshotUrl = product.snapshotUrl;
          updated[existingIdx].product.snapshotUrl = product.snapshotUrl;
        }
      } else {
        updated = [...prev, {
          product,
          quantity,
          addedVia,
          timestamp: Date.now(),
          checked: false,
          snapshotUrl: product.snapshotUrl,
        }];
      }
      saveCartToStorage(updated);
      return updated;
    });

    setScannedProductModal(null);
    setDynamicIslandState({ mode: 'scanned', product });

    setTimeout(() => {
      setDynamicIslandState({ mode: 'idle' });
    }, 3500);
  };

  // Perform 1-tap smart swap
  const handleSwapItem = (originalProductId: string, newProduct: Product, savings: number) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id === originalProductId) {
          return {
            ...item,
            product: newProduct,
            addedVia: 'swap' as const,
            timestamp: Date.now(),
          };
        }
        return item;
      });
      saveCartToStorage(updated);
      return updated;
    });

    setDynamicIslandState({ mode: 'swap_saved', amount: savings });
    setTimeout(() => {
      setDynamicIslandState({ mode: 'idle' });
    }, 3500);
  };

  // Update item quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
      saveCartToStorage(updated);
      return updated;
    });
  };

  // Toggle item collected/checked
  const handleToggleChecked = (productId: string) => {
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.product.id === productId) {
          return { ...item, checked: !item.checked };
        }
        return item;
      });
      saveCartToStorage(updated);
      return updated;
    });
  };

  // Remove single item
  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.product.id !== productId);
      saveCartToStorage(updated);
      return updated;
    });
  };

  // Clear all
  const handleClearCart = () => {
    setCartItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  };

  // Inspect product in modal
  const handleInspectProduct = (product: Product) => {
    setScannedProductModal(product);
  };

  // View alternative directly from modal
  const handleViewAlternative = (alternativeId: string) => {
    const alt = PRODUCT_BY_ID[alternativeId];
    if (alt) {
      setScannedProductModal(alt);
    }
  };

  // Voice command execution
  const handleVoiceCommand = (transcript: string) => {
    setDynamicIslandState({ mode: 'listening', transcript });

    const result = speechAssistant.parseVoiceCommand(transcript, totalSpent, budgetLimit);
    setLastVoiceFeedback(result.feedback);
    speechAssistant.speak(result.feedback);

    if (result.action === 'add_item' && result.itemQuery) {
      const match = GROCERY_CATALOG.find(p => p.name.toLowerCase().includes(result.itemQuery!.toLowerCase()));
      if (match) {
        handleAddToCart(match, result.quantity || 1, 'voice');
      } else {
        // Create custom product if not in catalog with smart category inference
        const q = result.itemQuery.toLowerCase();
        let cat: ProductCategory = 'Produce';
        let isFoodItem = true;
        let unit = '1 item';
        let price = 4.99;

        if (q.includes('charger') || q.includes('cable') || q.includes('battery') || q.includes('mouse') || q.includes('headphone') || q.includes('airpod') || q.includes('phone')) {
          cat = 'Electronics & Tech';
          isFoodItem = false;
          price = 14.99;
        } else if (q.includes('tide') || q.includes('detergent') || q.includes('wipe') || q.includes('soap') || q.includes('towel') || q.includes('cleaner') || q.includes('paper')) {
          cat = 'Household & Cleaning';
          isFoodItem = false;
          price = 8.99;
        } else if (q.includes('lotion') || q.includes('shampoo') || q.includes('toothpaste') || q.includes('wash') || q.includes('pill') || q.includes('medicine') || q.includes('cream')) {
          cat = 'Personal Care & Pharmacy';
          isFoodItem = false;
          price = 7.49;
        } else if (q.includes('cup') || q.includes('bottle') || q.includes('tumbler') || q.includes('pan') || q.includes('pot') || q.includes('pitcher')) {
          cat = 'Home & Kitchen';
          isFoodItem = false;
          price = 19.99;
        } else if (q.includes('notebook') || q.includes('marker') || q.includes('pen') || q.includes('paper') || q.includes('pencil')) {
          cat = 'Stationery & Office';
          isFoodItem = false;
          price = 3.99;
        }

        const customProd: Product = {
          id: `prod-custom-${Date.now()}`,
          barcode: '999999999999',
          name: result.itemQuery,
          brand: isFoodItem ? 'Market Fresh' : 'Mart Retail',
          category: cat,
          isFood: isFoodItem,
          price,
          unit,
          image: isFoodItem 
            ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'
            : 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80',
          nutriScore: isFoodItem ? 'A' : undefined,
          badges: ['Voice Added', 'Target & Walmart'],
          allergens: isFoodItem ? [] : undefined,
          nutrition: isFoodItem ? { calories: 100, sugars: '2g', sodium: '10mg', fat: '0g', protein: '1g' } : undefined,
          specs: !isFoodItem ? { 'Category': cat, 'Added Via': 'Hands-Free Voice' } : undefined,
          storeAvailability: ['Walmart', 'Target'],
          description: `Custom retail item added via voice: "${result.itemQuery}"`,
        };
        handleAddToCart(customProd, result.quantity || 1, 'voice');
      }
    } else if (result.action === 'remove_item' && result.itemQuery) {
      const match = cartItems.find(i => i.product.name.toLowerCase().includes(result.itemQuery!.toLowerCase()));
      if (match) {
        handleRemoveItem(match.product.id);
      }
    } else if (result.action === 'find_swaps') {
      setCurrentTab('swaps');
      setVoiceAssistantOpen(false);
    } else if (result.action === 'clear_cart') {
      handleClearCart();
    } else if (result.action === 'set_budget' && result.budgetAmount) {
      setBudgetLimit(result.budgetAmount);
    }

    setTimeout(() => {
      setDynamicIslandState({ mode: 'idle' });
    }, 3500);
  };

  // Finish shopping checkout celebration
  const handleFinishShopping = () => {
    soundEffects.playSwapChime();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
    });
    speechAssistant.speak(`Shopping trip complete! You spent $${totalSpent.toFixed(2)}. Thank you for using SmartCart!`);
  };

  return (
    <IPhoneFrame>
      {/* Dynamic Island Status Pill */}
      <DynamicIsland
        state={dynamicIslandState}
        cartCount={totalItemsCount}
        totalSpent={totalSpent}
        onTap={() => {
          if (dynamicIslandState.mode !== 'idle') {
            setDynamicIslandState({ mode: 'idle' });
          } else {
            setCurrentTab('budget');
          }
        }}
      />

      {/* Main Screen Viewport */}
      <div className="flex-1 w-full relative overflow-hidden">
        <div className={`w-full h-full ${currentTab === 'scan' ? 'block' : 'hidden'}`}>
          <CameraScanner
            isActive={currentTab === 'scan'}
            onProductDetected={handleProductDetected}
            onOpenCart={() => setCurrentTab('cart')}
            cartCount={totalItemsCount}
            scannedCount={scannedRecords.length}
            latestSnapshotUrl={scannedRecords[0]?.snapshotUrl || null}
            latestScannedProduct={scannedRecords[0]?.product || null}
            onOpenScannedDrawer={() => setIsScannedDrawerOpen(true)}
            onInspectProduct={handleInspectProduct}
          />
        </div>

        {currentTab === 'cart' && (
          <ShoppingList
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onToggleChecked={handleToggleChecked}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onInspectProduct={handleInspectProduct}
            onGoToSwaps={() => setCurrentTab('swaps')}
            onFinishShopping={handleFinishShopping}
            budgetLimit={budgetLimit}
          />
        )}

        {currentTab === 'swaps' && (
          <SmartSwaps
            cartItems={cartItems}
            onSwapItem={handleSwapItem}
            onInspectProduct={handleInspectProduct}
          />
        )}

        {currentTab === 'budget' && (
          <BudgetTracker
            cartItems={cartItems}
            budgetLimit={budgetLimit}
            onUpdateBudget={setBudgetLimit}
          />
        )}
      </div>

      {/* Bottom Floating iOS Tab Bar */}
      <BottomTabBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        cartItemCount={totalItemsCount}
        availableSwapsCount={availableSwapsCount}
        onOpenVoice={() => setVoiceAssistantOpen(true)}
      />

      {/* Scanned Items Session Drawer (view snaps, review, and move to cart) */}
      <ScannedItemsDrawer
        isOpen={isScannedDrawerOpen}
        onClose={() => setIsScannedDrawerOpen(false)}
        scannedRecords={scannedRecords}
        cartItems={cartItems}
        onAddToCart={(prod, qty) => handleAddToCart(prod, qty, 'camera')}
        onUpdateQuantity={handleUpdateQuantity}
        onInspectProduct={(prod) => {
          setIsScannedDrawerOpen(false);
          setScannedProductModal(prod);
        }}
        onClearHistory={handleClearScannedHistory}
        onDeleteRecord={handleDeleteScannedRecord}
        onAddAllPendingToCart={handleAddAllPendingToCart}
        onOpenCart={() => {
          setIsScannedDrawerOpen(false);
          setCurrentTab('cart');
        }}
      />

      {/* Product Detail & Add Bottom Sheet Modal */}
      {scannedProductModal && (
        <ProductCardModal
          product={scannedProductModal}
          onAddToCart={(prod, qty) => handleAddToCart(prod, qty, 'camera')}
          onClose={() => setScannedProductModal(null)}
          onViewAlternative={handleViewAlternative}
        />
      )}

      {/* Voice Assistant Hands-Free Modal */}
      <VoiceAssistantModal
        isOpen={voiceAssistantOpen}
        onClose={() => setVoiceAssistantOpen(false)}
        onCommand={handleVoiceCommand}
        lastAssistantFeedback={lastVoiceFeedback}
      />
    </IPhoneFrame>
  );
};

export default App;
