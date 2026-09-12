export type NutriScore = 'A' | 'B' | 'C' | 'D' | 'E';

export type ProductCategory = 
  | 'Produce'
  | 'Dairy & Eggs'
  | 'Snacks & Sweets'
  | 'Beverages'
  | 'Bakery & Pantry'
  | 'Frozen'
  | 'Meat & Seafood'
  | 'Electronics & Tech'
  | 'Household & Cleaning'
  | 'Personal Care & Pharmacy'
  | 'Home & Kitchen'
  | 'Stationery & Office'
  | 'Apparel & Basics';

export interface NutritionInfo {
  calories: number;
  sugars: string;
  sodium: string;
  fat: string;
  protein: string;
  fiber?: string;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  unit: string;
  image: string;
  isFood?: boolean;
  nutriScore?: NutriScore;
  badges: string[];
  allergens?: string[];
  nutrition?: NutritionInfo;
  specs?: Record<string, string>;
  storeAvailability?: string[];
  description: string;
  healthierAlternativeId?: string;
  cheaperAlternativeId?: string;
  healthExplanation?: string;
  cheapExplanation?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addedVia: 'camera' | 'voice' | 'manual' | 'swap';
  timestamp: number;
  checked: boolean;
}

export interface SwapRecommendation {
  id: string;
  type: 'healthier' | 'cheaper';
  originalProduct: Product;
  suggestedProduct: Product;
  reason: string;
  savingsAmount?: number;
  nutriDelta?: {
    from: NutriScore;
    to: NutriScore;
  };
  healthHighlights?: string[];
}

export interface VoiceCommandResult {
  action: 'add_item' | 'remove_item' | 'check_total' | 'find_swaps' | 'clear_cart' | 'set_budget' | 'unknown';
  itemQuery?: string;
  feedback: string;
  quantity?: number;
  budgetAmount?: number;
}
