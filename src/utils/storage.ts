/**
 * localStorage Utility Wrappers
 * 
 * Provides safe, typed access to localStorage with:
 * - JSON serialization/deserialization
 * - Error handling for quota exceeded
 * - Feature detection for browsers without localStorage
 * - Type-safe getters/setters
 */

import { APIUsage, AppSettings, FAQItem } from '@/types';
import { validateAPIUsage, validateAppSettings, validateFAQItemSafe } from './validation';

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
  FAQS: 'voice-agent-faqs',
  API_USAGE: 'voice-agent-api-usage',
  SETTINGS: 'voice-agent-settings',
  API_KEY: 'voice-agent-gemini-key',
  SESSION_HISTORY: 'voice-agent-session-history',
} as const;

// ============================================
// Feature Detection
// ============================================

/**
 * Check if localStorage is available
 * Handles private browsing modes and browser restrictions
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('localStorage is not available:', e);
    return false;
  }
}

/**
 * Check if sessionStorage is available
 */
export function isSessionStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('sessionStorage is not available:', e);
    return false;
  }
}

// ============================================
// Generic Storage Operations
// ============================================

/**
 * Get item from localStorage with JSON parsing
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist
 * @returns Parsed value or default
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, returning default value');
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

/**
 * Set item in localStorage with JSON serialization
 * @param key - Storage key
 * @param value - Value to store
 * @returns true if successful, false if failed (e.g., quota exceeded)
 */
export function setInStorage<T>(key: string, value: T): boolean {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, cannot set item');
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded. Consider clearing old data.');
    } else {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
    return false;
  }
}

/**
 * Remove item from localStorage
 * @param key - Storage key
 */
export function removeFromStorage(key: string): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, cannot remove item');
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
}

/**
 * Clear all items with a specific prefix
 * @param prefix - Key prefix to match
 */
export function clearStorageByPrefix(prefix: string): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage not available, cannot clear items');
    return;
  }

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing storage by prefix:', error);
  }
}

// ============================================
// FAQ Storage Operations
// ============================================

/**
 * Get all FAQs from localStorage
 * @returns Array of FAQ items
 */
export function getFAQs(): FAQItem[] {
  const faqs = getFromStorage<unknown[]>(STORAGE_KEYS.FAQS, []);
  
  // Validate each FAQ item
  return faqs.filter((faq) => {
    const result = validateFAQItemSafe(faq);
    return result.success;
  }) as FAQItem[];
}

/**
 * Save FAQs to localStorage
 * @param faqs - Array of FAQ items to save
 * @returns true if successful
 */
export function saveFAQs(faqs: FAQItem[]): boolean {
  return setInStorage(STORAGE_KEYS.FAQS, faqs);
}

/**
 * Add a single FAQ
 * @param faq - FAQ item to add
 * @returns true if successful
 */
export function addFAQ(faq: FAQItem): boolean {
  const faqs = getFAQs();
  faqs.push(faq);
  return saveFAQs(faqs);
}

/**
 * Update an existing FAQ
 * @param id - FAQ ID
 * @param updates - Partial FAQ updates
 * @returns Updated FAQ or null if not found
 */
export function updateFAQ(id: string, updates: Partial<FAQItem>): FAQItem | null {
  const faqs = getFAQs();
  const index = faqs.findIndex((f) => f.id === id);
  
  if (index === -1) {
    return null;
  }
  
  faqs[index] = { ...faqs[index], ...updates, updatedAt: Date.now() };
  saveFAQs(faqs);
  return faqs[index];
}

/**
 * Delete an FAQ
 * @param id - FAQ ID
 * @returns true if deleted
 */
export function deleteFAQ(id: string): boolean {
  const faqs = getFAQs();
  const filtered = faqs.filter((f) => f.id !== id);
  
  if (filtered.length === faqs.length) {
    return false; // FAQ not found
  }
  
  return saveFAQs(filtered);
}

// ============================================
// API Usage Storage Operations
// ============================================

/**
 * Get current API usage
 * @returns API usage object
 */
export function getAPIUsage(): APIUsage {
  const defaultUsage: APIUsage = {
    gemini: {
      tokensUsed: 0,
      requestsCount: 0,
      lastReset: Date.now(),
    },
    edgeTTS: {
      charactersUsed: 0,
    },
    version: 1,
    lastUpdated: Date.now(),
  };
  
  const usage = getFromStorage<unknown>(STORAGE_KEYS.API_USAGE, defaultUsage);
  return validateAPIUsage(usage);
}

/**
 * Update API usage
 * @param updates - Partial usage updates
 * @returns true if successful
 */
export function updateAPIUsage(updates: Partial<APIUsage>): boolean {
  const current = getAPIUsage();
  const updated = { ...current, ...updates, lastUpdated: Date.now() };
  return setInStorage(STORAGE_KEYS.API_USAGE, updated);
}

/**
 * Increment Gemini token usage
 * @param tokens - Number of tokens to add
 * @returns Updated usage
 */
export function incrementGeminiUsage(tokens: number): APIUsage {
  const current = getAPIUsage();
  const updated: APIUsage = {
    ...current,
    gemini: {
      ...current.gemini,
      tokensUsed: current.gemini.tokensUsed + tokens,
      requestsCount: current.gemini.requestsCount + 1,
    },
    lastUpdated: Date.now(),
  };
  setInStorage(STORAGE_KEYS.API_USAGE, updated);
  return updated;
}

/**
 * Increment Edge TTS character usage
 * @param characters - Number of characters to add
 * @returns Updated usage
 */
export function incrementTTSUsage(characters: number): APIUsage {
  const current = getAPIUsage();
  const updated: APIUsage = {
    ...current,
    edgeTTS: {
      ...current.edgeTTS,
      charactersUsed: current.edgeTTS.charactersUsed + characters,
    },
    lastUpdated: Date.now(),
  };
  setInStorage(STORAGE_KEYS.API_USAGE, updated);
  return updated;
}

/**
 * Reset monthly API usage counters
 * @returns true if successful
 */
export function resetAPIUsage(): boolean {
  const defaultUsage: APIUsage = {
    gemini: {
      tokensUsed: 0,
      requestsCount: 0,
      lastReset: Date.now(),
    },
    edgeTTS: {
      charactersUsed: 0,
    },
    version: 1,
    lastUpdated: Date.now(),
  };
  return setInStorage(STORAGE_KEYS.API_USAGE, defaultUsage);
}

// ============================================
// Settings Storage Operations
// ============================================

/**
 * Get app settings
 * @returns App settings object
 */
export function getSettings(): AppSettings {
  const defaultSettings: AppSettings = {
    language: 'en-US',
    voiceSpeed: 1.0,
    voiceName: undefined,
    highContrast: false,
    reducedMotion: false,
    screenReaderMode: false,
    debugMode: false,
    showLatencyMetrics: false,
    allowAnalytics: false,
  };
  
  const settings = getFromStorage<unknown>(STORAGE_KEYS.SETTINGS, defaultSettings);
  return validateAppSettings(settings);
}

/**
 * Update app settings
 * @param updates - Partial settings updates
 * @returns true if successful
 */
export function updateSettings(updates: Partial<AppSettings>): boolean {
  const current = getSettings();
  const updated = { ...current, ...updates };
  return setInStorage(STORAGE_KEYS.SETTINGS, updated);
}

// ============================================
// API Key Storage Operations
// ============================================

/**
 * Get Gemini API key
 * Note: For production, use environment variables or secure backend
 * @returns API key or empty string
 */
export function getAPIKey(): string {
  // First check environment variable (preferred for security)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) {
    return envKey;
  }
  
  // Fallback to localStorage (development only)
  return getFromStorage(STORAGE_KEYS.API_KEY, '');
}

/**
 * Set Gemini API key in localStorage
 * Note: For production, use environment variables instead
 * @param key - API key
 * @returns true if successful
 */
export function setAPIKey(key: string): boolean {
  return setInStorage(STORAGE_KEYS.API_KEY, key);
}

/**
 * Clear stored API key
 */
export function clearAPIKey(): void {
  removeFromStorage(STORAGE_KEYS.API_KEY);
}

/**
 * Check if API key is set
 * @returns true if API key is available
 */
export function isAPIKeySet(): boolean {
  const key = getAPIKey();
  return key !== '' && key.length > 0;
}

// ============================================
// Storage Statistics
// ============================================

/**
 * Get total localStorage usage in bytes
 * @returns Approximate bytes used
 */
export function getStorageUsage(): number {
  if (!isLocalStorageAvailable()) {
    return 0;
  }
  
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      total += key.length + value.length; // Approximate bytes
    }
  }
  return total;
}

/**
 * Get storage usage as human-readable string
 * @returns Formatted string (e.g., "1.5 KB")
 */
export function getStorageUsageFormatted(): string {
  const bytes = getStorageUsage();
  
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

/**
 * Clear all voice-agent data from localStorage
 * @returns true if successful
 */
export function clearAllVoiceAgentData(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }
  
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing voice-agent data:', error);
    return false;
  }
}
