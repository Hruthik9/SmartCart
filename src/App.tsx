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
import type { CartItem, Product, ProductCategory } from './types/grocery';
import { GROCERY_CATALOG, PRODUCT_BY_ID } from './data/groceryCatalog';
import { speechAssistant } from './services/speechService';
import { soundEffects } from './services/soundEffects';

export const App: React.FC = () => {
  // Cart & Budget State (pre-populated with 2 relatable items so the user can immediately test Smart Swaps & Budget)
  const [cartItems, setCartItems] = useState<CartItem[]>([
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
  ]);

  const [budgetLimit, setBudgetLimit] = useState<number>(35);
  const [currentTab, setCurrentTab] = useState<TabType>('scan');
  const [scannedProductModal, setScannedProductModal] = useState<Product | null>(null);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState<boolean>(false);
  const [dynamicIslandState, setDynamicIslandState] = useState<DynamicIslandState>({ mode: 'idle' });
  const [lastVoiceFeedback, setLastVoiceFeedback] = useState<string>('');

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

  // Handle camera item detection
  const handleProductDetected = (product: Product) => {
    setScannedProductModal(product);
  };

  // Add item to cart
  const handleAddToCart = (product: Product, quantity: number = 1, addedVia: 'camera' | 'voice' | 'manual' | 'swap' = 'camera') => {
    soundEffects.playScanBeep();
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        if (product.snapshotUrl) {
          updated[existingIdx].snapshotUrl = product.snapshotUrl;
          updated[existingIdx].product.snapshotUrl = product.snapshotUrl;
        }
        return updated;
      } else {
        return [...prev, {
          product,
          quantity,
          addedVia,
          timestamp: Date.now(),
          checked: false,
          snapshotUrl: product.snapshotUrl,
        }];
      }
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
      return prev.map(item => {
        if (item.product.id === originalProductId) {
          return {
            ...item,
            product: newProduct,
            addedVia: 'swap',
            timestamp: Date.now(),
          };
        }
        return item;
      });
    });

    setDynamicIslandState({ mode: 'swap_saved', amount: savings });
    setTimeout(() => {
      setDynamicIslandState({ mode: 'idle' });
    }, 3500);
  };

  // Update item quantity
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Toggle item collected/checked
  const handleToggleChecked = (productId: string) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          return { ...item, checked: !item.checked };
        }
        return item;
      });
    });
  };

  // Remove single item
  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Clear all
  const handleClearCart = () => {
    setCartItems([]);
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
