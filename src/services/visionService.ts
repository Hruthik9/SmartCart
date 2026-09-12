import { GoogleGenAI } from '@google/genai';
import type { Product, NutriScore, ProductCategory } from '../types/grocery';
import { GROCERY_CATALOG, PRODUCT_BY_BARCODE, PRODUCT_BY_ID, searchCatalog } from '../data/groceryCatalog';
import { GEMINI_CONFIG } from '../config';

// Declare types for experimental BarcodeDetector API
interface DetectedBarcode {
  rawValue: string;
  format: string;
  cornerPoints: { x: number; y: number }[];
}

interface BarcodeDetectorInstance {
  detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new(options?: { formats: string[] }): BarcodeDetectorInstance;
      getSupportedFormats(): Promise<string[]>;
    };
  }
}

export class VisionService {
  private barcodeDetector: BarcodeDetectorInstance | null = null;
  private isDetectorSupported: boolean = false;
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    this.initDetector();
    this.initGemini();
  }

  private initGemini() {
    try {
      if (GEMINI_CONFIG.apiKey) {
        this.aiClient = new GoogleGenAI({ apiKey: GEMINI_CONFIG.apiKey });
      }
    } catch (e) {
      console.warn('Could not initialize GoogleGenAI client:', e);
    }
  }

  private async initDetector() {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window && window.BarcodeDetector) {
      try {
        this.barcodeDetector = new window.BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128', 'code_39']
        });
        this.isDetectorSupported = true;
      } catch {
        this.isDetectorSupported = false;
      }
    }
  }

  isNativeBarcodeSupported(): boolean {
    return this.isDetectorSupported;
  }

  // Detect barcodes directly from video element
  async detectFromVideo(video: HTMLVideoElement): Promise<Product | null> {
    if (!this.barcodeDetector || video.readyState < 2) {
      return null;
    }

    try {
      const barcodes = await this.barcodeDetector.detect(video);
      if (barcodes && barcodes.length > 0) {
        for (const bc of barcodes) {
          const product = PRODUCT_BY_BARCODE[bc.rawValue.trim()];
          if (product) {
            return product;
          }
        }
      }
    } catch {
      // Detection failed this frame
    }

    return null;
  }

  // Multimodal Gemini AI Vision Analysis from Camera Snapshot
  async identifyFromSnapshot(canvas: HTMLCanvasElement, hintText?: string): Promise<Product | null> {
    // 1. First check if a readable physical barcode is visible in frame
    if (this.barcodeDetector) {
      try {
        const barcodes = await this.barcodeDetector.detect(canvas);
        if (barcodes && barcodes.length > 0) {
          const matched = PRODUCT_BY_BARCODE[barcodes[0].rawValue.trim()];
          if (matched) return matched;
        }
      } catch {
        // Continue to AI vision
      }
    }

    // 2. Prepare optimized base64 image (scale down to max 800px width for ultra-fast upload)
    let base64Data = '';
    try {
      let targetCanvas = canvas;
      if (canvas.width > 800 || canvas.height > 800) {
        const scale = Math.min(800 / canvas.width, 800 / canvas.height);
        const temp = document.createElement('canvas');
        temp.width = Math.round(canvas.width * scale);
        temp.height = Math.round(canvas.height * scale);
        const tCtx = temp.getContext('2d');
        if (tCtx) {
          tCtx.drawImage(canvas, 0, 0, temp.width, temp.height);
          targetCanvas = temp;
        }
      }
      const dataUrl = targetCanvas.toDataURL('image/jpeg', 0.85);
      base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    } catch (err) {
      console.warn('Canvas to base64 conversion failed:', err);
    }

    // 3. Multimodal Analysis via Gemini API
    if (this.aiClient && base64Data) {
      const modelsToTry = [GEMINI_CONFIG.defaultModel, ...GEMINI_CONFIG.fallbackModels];
      
      const prompt = `
You are an advanced retail and supermarket AI shopping assistant capable of recognizing ANY item found in major department stores, marts, and supermarkets (such as Walmart, Target, Costco, Walgreens, CVS, electronics stores, and groceries).
Examine this camera snapshot carefully.
Identify the product shown — which can be:
- Electronics & tech (chargers, headphones, phone accessories, batteries, cables, computer peripherals)
- Household essentials & cleaning (laundry pods, paper towels, dish soap, surface cleaners, trash bags)
- Personal care, beauty & pharmacy (lotions, toothpaste, body wash, shampoo, OTC medicines like ibuprofen, skincare)
- Home, kitchenware & office supplies (tumblers, water pitchers, food containers, notebooks, markers, pens)
- Fresh produce, groceries, snacks, beverages, bakery, frozen, or supplements

${hintText ? `User note: ${hintText}` : ''}

Determine whether the object is an edible food/grocery item ('isFood': true) or a general retail/department store product ('isFood': false).

Return a valid JSON object matching this schema:
{
  "name": string (e.g. "Apple 20W USB-C Power Adapter", "Tide PODS Clean Breeze 42ct", "CeraVe Daily Moisturizing Lotion", "Fresh Golden Pineapple"),
  "brand": string (e.g. "Apple", "Tide", "CeraVe", "Bounty", "Dole", or brand on package),
  "category": "Produce" | "Dairy & Eggs" | "Snacks & Sweets" | "Beverages" | "Bakery & Pantry" | "Frozen" | "Meat & Seafood" | "Electronics & Tech" | "Household & Cleaning" | "Personal Care & Pharmacy" | "Home & Kitchen" | "Stationery & Office" | "Apparel & Basics",
  "isFood": boolean,
  "price": number (realistic retail price in USD, e.g. 19.00, 12.99, 15.99, 3.99),
  "unit": string (e.g. "1 adapter", "42 pods tub", "12 fl oz", "1 tumbler", "each", "1 lb"),
  "storeAvailability": string[] (e.g. ["Target", "Walmart"]),
  "badges": string[] (2-4 relevant badges, e.g. "Fast Charging", "USB-C PD", "Oxi Power", "Ceramides", "Dermatologist Tested"),
  "specs": { [key: string]: string } (for non-food items, e.g. {"Wattage": "20W", "Compatibility": "iPhone & iPad"} or {"Count": "42 Pacs", "Scent": "Clean Breeze"}),
  "nutriScore": "A" | "B" | "C" | "D" | "E" (ONLY if isFood is true, otherwise omit),
  "allergens": string[] (only if isFood is true, otherwise []),
  "nutrition": {
    "calories": number,
    "sugars": string,
    "sodium": string,
    "fat": string,
    "protein": string,
    "fiber": string
  } (ONLY if isFood is true),
  "description": string (1-2 clear sentences describing the product and key utility or features),
  "healthierAlternative": {
    "name": string (eco-friendly, plant-based, higher-spec, or healthier alternative),
    "explanation": string,
    "price": number
  },
  "cheaperAlternative": {
    "name": string (store-brand or budget equivalent, e.g. Walmart Great Value/Equate/onn. or Target up & up/Room Essentials),
    "explanation": string,
    "price": number,
    "savings": number
  }
}
If the object is non-food, do NOT include nutritional values or nutriScore. Instead, provide detailed 'specs'.
`;

      for (const model of modelsToTry) {
        try {
          const response = await this.aiClient.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
                ]
              }
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2
            }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            if (parsed.name) {
              const product = this.buildProductFromGemini(parsed, canvas);
              return product;
            }
          }
        } catch (apiErr) {
          console.warn(`Gemini model ${model} attempt failed, trying fallback:`, apiErr);
        }
      }
    }

    // 4. Smart fallback if offline or API unavailable
    // Check if hintText or search query matches
    if (hintText) {
      const matches = searchCatalog(hintText);
      if (matches.length > 0) return matches[0];
    }

    // Heuristic color/shape matching
    return this.heuristicFallback(canvas);
  }

  // Convert Gemini JSON response to a registered Product with swap links
  private buildProductFromGemini(raw: any, sourceCanvas: HTMLCanvasElement): Product {
    const timestamp = Date.now();
    const id = `prod-gemini-${timestamp}`;
    const barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    // Use current snapshot as image thumbnail
    let imageUrl = '';
    try {
      imageUrl = sourceCanvas.toDataURL('image/jpeg', 0.8);
    } catch {
      imageUrl = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
    }

    const foodCategories: ProductCategory[] = [
      'Produce', 'Dairy & Eggs', 'Snacks & Sweets', 'Beverages', 'Bakery & Pantry', 'Frozen', 'Meat & Seafood'
    ];

    const allCategories: ProductCategory[] = [
      ...foodCategories,
      'Electronics & Tech',
      'Household & Cleaning',
      'Personal Care & Pharmacy',
      'Home & Kitchen',
      'Stationery & Office',
      'Apparel & Basics'
    ];

    const validatedCat: ProductCategory = allCategories.includes(raw.category) 
      ? raw.category 
      : 'Produce';

    const isFood = typeof raw.isFood === 'boolean' 
      ? raw.isFood 
      : foodCategories.includes(validatedCat);

    // Build alternative products and register them in catalog
    let healthierAlternativeId: string | undefined;
    let cheaperAlternativeId: string | undefined;

    if (raw.healthierAlternative && raw.healthierAlternative.name) {
      const hId = `prod-alt-health-${timestamp}`;
      const healthProd: Product = {
        id: hId,
        barcode: (parseInt(barcode) + 1).toString(),
        name: raw.healthierAlternative.name,
        brand: isFood ? 'Nutrient Plus' : 'Eco & Smart Value',
        category: validatedCat,
        isFood,
        price: Number(raw.healthierAlternative.price) || (raw.price + 1.00),
        unit: raw.unit || 'each',
        image: imageUrl || 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=400&q=80',
        nutriScore: isFood ? ((raw.healthierAlternative.nutriScore as NutriScore) || 'A') : undefined,
        badges: isFood ? ['Healthier Pick', 'Nutrient Rich'] : ['Eco Choice', 'Safer Ingredients'],
        allergens: isFood ? [] : undefined,
        nutrition: isFood ? {
          calories: Math.round((raw.nutrition?.calories || 100) * 0.8),
          sugars: '0g',
          sodium: '10mg',
          fat: '0.5g',
          protein: `${Math.round(parseFloat(raw.nutrition?.protein || '2') * 1.5)}g`,
          fiber: '4g'
        } : undefined,
        specs: !isFood ? (raw.specs || { 'Type': 'Eco-Friendly Alternative' }) : undefined,
        storeAvailability: raw.storeAvailability || ['Target', 'Walmart'],
        description: raw.healthierAlternative.explanation || (isFood ? 'Higher nutrient density and lower added sugar.' : 'Eco-friendly and sustainable alternative.')
      };
      PRODUCT_BY_ID[hId] = healthProd;
      GROCERY_CATALOG.push(healthProd);
      healthierAlternativeId = hId;
    }

    if (raw.cheaperAlternative && raw.cheaperAlternative.name) {
      const cId = `prod-alt-cheap-${timestamp}`;
      const cheapPrice = Number(raw.cheaperAlternative.price) || Math.max(0.99, raw.price * 0.65);
      
      let storeBrand = 'Store Value Brand';
      if (validatedCat === 'Electronics & Tech') storeBrand = 'onn. (Walmart)';
      else if (validatedCat === 'Personal Care & Pharmacy') storeBrand = 'Equate (Walmart)';
      else if (validatedCat === 'Household & Cleaning') storeBrand = 'Great Value (Walmart)';
      else if (validatedCat === 'Home & Kitchen' || validatedCat === 'Stationery & Office') storeBrand = 'Target up & up';

      const cheapProd: Product = {
        id: cId,
        barcode: (parseInt(barcode) + 2).toString(),
        name: raw.cheaperAlternative.name,
        brand: storeBrand,
        category: validatedCat,
        isFood,
        price: Number(cheapPrice.toFixed(2)),
        unit: raw.unit || 'each',
        image: imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
        nutriScore: isFood ? ((raw.nutriScore as NutriScore) || 'B') : undefined,
        badges: ['Budget Saver', 'Store Brand Value'],
        allergens: isFood ? (raw.allergens || []) : undefined,
        nutrition: isFood ? (raw.nutrition || { calories: 100, sugars: '2g', sodium: '20mg', fat: '1g', protein: '2g' }) : undefined,
        specs: !isFood ? (raw.specs || { 'Value Comparison': 'Store Brand Match' }) : undefined,
        storeAvailability: raw.storeAvailability || ['Walmart', 'Target'],
        description: raw.cheaperAlternative.explanation || 'Store brand equivalent offering identical utility at significantly lower price.'
      };
      PRODUCT_BY_ID[cId] = cheapProd;
      GROCERY_CATALOG.push(cheapProd);
      cheaperAlternativeId = cId;
    }

    const validatedNutri: NutriScore | undefined = isFood
      ? (['A', 'B', 'C', 'D', 'E'].includes(raw.nutriScore) ? (raw.nutriScore as NutriScore) : 'A')
      : undefined;

    const newProduct: Product = {
      id,
      barcode,
      name: raw.name,
      brand: raw.brand || (isFood ? 'Fresh Market' : 'Department Store Brand'),
      category: validatedCat,
      isFood,
      price: Number(Number(raw.price || 4.99).toFixed(2)),
      unit: raw.unit || '1 item',
      image: imageUrl,
      nutriScore: validatedNutri,
      badges: Array.isArray(raw.badges) ? raw.badges : (isFood ? ['Fresh Pick'] : ['Target & Walmart Essential']),
      allergens: isFood ? (Array.isArray(raw.allergens) ? raw.allergens : []) : undefined,
      nutrition: isFood ? {
        calories: Number(raw.nutrition?.calories) || 90,
        sugars: raw.nutrition?.sugars || '3g',
        sodium: raw.nutrition?.sodium || '15mg',
        fat: raw.nutrition?.fat || '0.5g',
        protein: raw.nutrition?.protein || '2g',
        fiber: raw.nutrition?.fiber || '2g',
      } : undefined,
      specs: !isFood ? (raw.specs || {
        'Category': validatedCat,
        'Brand': raw.brand || 'Retail Brand',
        'Store': 'Available at Walmart & Target',
      }) : undefined,
      storeAvailability: Array.isArray(raw.storeAvailability) ? raw.storeAvailability : ['Walmart', 'Target'],
      description: raw.description || `${raw.name} by ${raw.brand || 'Store Brand'}.`,
      healthierAlternativeId,
      cheaperAlternativeId,
      healthExplanation: raw.healthierAlternative?.explanation,
      cheapExplanation: raw.cheaperAlternative?.explanation || `Save $${((raw.price || 5) - (raw.cheaperAlternative?.price || 3)).toFixed(2)} with store brand equivalent.`
    };

    // Register into catalog
    PRODUCT_BY_ID[id] = newProduct;
    PRODUCT_BY_BARCODE[barcode] = newProduct;
    GROCERY_CATALOG.unshift(newProduct);

    return newProduct;
  }

  // Fast heuristic fallback
  private heuristicFallback(canvas: HTMLCanvasElement): Product {
    const ctx = canvas.getContext('2d');
    if (!ctx) return GROCERY_CATALOG[0];

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let r = 0, g = 0, b = 0;
    const step = 4 * 16;
    let count = 0;

    for (let i = 0; i < data.length; i += step) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }

    const avgR = r / count;
    const avgG = g / count;
    const avgB = b / count;

    // Check for bright white device or packaging -> Apple charger or AirPods
    if (avgR > 185 && avgG > 185 && avgB > 185) {
      return GROCERY_CATALOG.find(p => p.id === 'prod-apple-charger') || GROCERY_CATALOG[0];
    }
    // Check for blue packaging -> CeraVe lotion or Dawn Dish Soap
    if (avgB > avgR + 25 && avgB > avgG) {
      return GROCERY_CATALOG.find(p => p.id === 'prod-cerave-lotion') || GROCERY_CATALOG.find(p => p.id === 'prod-dawn-dish') || GROCERY_CATALOG[0];
    }
    // Check for orange/warm packaging -> Tide PODS
    if (avgR > 150 && avgG > 70 && avgG < 130 && avgB < 70) {
      return GROCERY_CATALOG.find(p => p.id === 'prod-tide-pods') || GROCERY_CATALOG[0];
    }
    // Check for yellowish/golden produce -> Pineapple or Banana
    if (avgR > 130 && avgG > 120 && avgB < 90) {
      return GROCERY_CATALOG.find(p => p.id === 'prod-pineapple') || GROCERY_CATALOG.find(p => p.id === 'prod-bananas') || GROCERY_CATALOG[0];
    }
    // Check for Green -> Avocados
    if (avgG > avgR && avgG > avgB) {
      return GROCERY_CATALOG.find(p => p.id === 'prod-avocados') || GROCERY_CATALOG[0];
    }
    // Check for Red -> Strawberries or Coke
    if (avgR > 140 && avgG < 90 && avgB < 90) {
      return GROCERY_CATALOG.find(p => p.id === 'prod-organic-strawberries') || GROCERY_CATALOG[0];
    }

    // Check if supplement box or dark gadget (white/grey/dark)
    if (avgR > 100 && avgG > 100 && avgB > 100 && Math.abs(avgR - avgG) < 20 && Math.abs(avgG - avgB) < 20) {
      return GROCERY_CATALOG.find(p => p.id === 'prod-whey-protein') || GROCERY_CATALOG.find(p => p.id === 'prod-logitech-mouse') || GROCERY_CATALOG[0];
    }

    return GROCERY_CATALOG.find(p => p.id === 'prod-apple-charger') || GROCERY_CATALOG[0];
  }
}

export const visionService = new VisionService();
