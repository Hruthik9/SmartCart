import type { VoiceCommandResult } from '../types/grocery';
import { GROCERY_CATALOG, searchCatalog } from '../data/groceryCatalog';

// Type definitions for SpeechRecognition browser API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
    isFinal: boolean;
  };
  length: number;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: { new(): ISpeechRecognition };
    webkitSpeechRecognition?: { new(): ISpeechRecognition };
  }
}

export class SpeechAssistant {
  private recognition: ISpeechRecognition | null = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser.');
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
    }

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      onResult(transcript, result.isFinal);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      this.recognition.start();
    } catch {
      this.isListening = false;
      onError('Microphone access could not be started.');
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.isListening = false;
    }
  }

  // Text-To-Speech voice response
  speak(text: string) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Cancel previous pending speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Pick an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Siri') || v.name.includes('Google')));
      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }

  // Parse natural language voice commands
  parseVoiceCommand(transcript: string, currentTotal: number, currentBudget: number): VoiceCommandResult {
    const raw = transcript.toLowerCase().trim();

    // Check spending total
    if (raw.includes('total') || raw.includes('how much') || raw.includes('spent') || raw.includes('balance') || raw.includes('budget status')) {
      const remaining = currentBudget - currentTotal;
      const feedback = remaining >= 0
        ? `Your current total is $${currentTotal.toFixed(2)}. You have $${remaining.toFixed(2)} left in your budget.`
        : `Your current total is $${currentTotal.toFixed(2)}. You have exceeded your budget by $${Math.abs(remaining).toFixed(2)}.`;
      return { action: 'check_total', feedback };
    }

    // Swaps or alternatives
    if (raw.includes('alternative') || raw.includes('healthier') || raw.includes('cheaper') || raw.includes('swap') || raw.includes('suggestion')) {
      return {
        action: 'find_swaps',
        feedback: 'Here are personalized healthier and budget-saving alternatives for items in your cart.'
      };
    }

    // Set budget command: "set budget to 50 dollars" or "my budget is 75"
    const budgetMatch = raw.match(/(?:budget(?: to| is)?|limit)\s*\$?(\d+(?:\.\d{1,2})?)/i);
    if (budgetMatch) {
      const amt = parseFloat(budgetMatch[1]);
      if (!isNaN(amt) && amt > 0) {
        return {
          action: 'set_budget',
          budgetAmount: amt,
          feedback: `Budget updated to $${amt.toFixed(2)}.`
        };
      }
    }

    // Clear cart
    if (raw.includes('clear cart') || raw.includes('empty cart') || raw.includes('clear list') || raw.includes('start over')) {
      return {
        action: 'clear_cart',
        feedback: 'Shopping cart cleared.'
      };
    }

    // Remove item: "remove milk" or "delete cookies"
    if (raw.startsWith('remove') || raw.startsWith('delete') || raw.startsWith('drop')) {
      const query = raw.replace(/^(remove|delete|drop)\s+/i, '').trim();
      return {
        action: 'remove_item',
        itemQuery: query,
        feedback: `Looking to remove ${query} from your cart.`
      };
    }

    // Add item: "add two gallons of almond milk", "add cheerios", "add strawberries"
    let addQuery = raw;
    if (raw.startsWith('add') || raw.startsWith('put') || raw.startsWith('scan')) {
      addQuery = raw.replace(/^(add|put|scan)\s+/i, '').trim();
    }

    // Detect quantity words: "2", "two", "three", "a box of"
    let quantity = 1;
    const numWordMap: Record<string, number> = {
      'one': 1, 'a': 1, 'an': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6
    };
    const qtyMatch = addQuery.match(/^(\d+|one|a|an|two|three|four|five|six)\s+(?:boxes of|bottles of|cartons of|bags of|packs of|loaves of)?\s*(.*)$/i);
    if (qtyMatch) {
      const qtyStr = qtyMatch[1].toLowerCase();
      quantity = parseInt(qtyStr, 10) || numWordMap[qtyStr] || 1;
      addQuery = qtyMatch[2] || addQuery;
    }

    // Search for closest product in catalog
    const matches = searchCatalog(addQuery);
    if (matches.length > 0) {
      const prod = matches[0];
      return {
        action: 'add_item',
        itemQuery: prod.name,
        quantity,
        feedback: `Added ${quantity > 1 ? `${quantity}x ` : ''}${prod.name} ($${(prod.price * quantity).toFixed(2)}) to your cart.`
      };
    }

    // Catalog fallback search by words
    const words = addQuery.split(' ').filter(w => w.length > 3);
    for (const word of words) {
      const match = GROCERY_CATALOG.find(p => p.name.toLowerCase().includes(word) || p.category.toLowerCase().includes(word));
      if (match) {
        return {
          action: 'add_item',
          itemQuery: match.name,
          quantity,
          feedback: `Found ${match.name}. Added to your cart.`
        };
      }
    }

    // If no catalog item matches, add as custom item
    if (addQuery.length > 1) {
      return {
        action: 'add_item',
        itemQuery: addQuery,
        quantity,
        feedback: `Added "${addQuery}" to your shopping list.`
      };
    }

    return {
      action: 'unknown',
      feedback: 'I didn’t catch that. You can say "Add Tide Pods", "Add charger", "What is my total?", or "Find cheaper alternatives".'
    };
  }
}

export const speechAssistant = new SpeechAssistant();
