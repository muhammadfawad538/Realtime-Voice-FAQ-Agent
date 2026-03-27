/**
 * API Usage Tracker Service
 * 
 * Tracks API consumption against free tier limits.
 * Provides warnings at 80% threshold and handles monthly resets.
 * 
 * Free Tier Limits:
 * - Gemini: 1M tokens/month, 15 requests/minute
 * - Edge TTS: Unlimited (but be conservative)
 * 
 * Usage:
 * ```typescript
 * import { apiUsageTracker } from '@/services/APIUsageTracker';
 * 
 * // Track usage
 * await apiUsageTracker.trackGeminiUsage(250); // 250 tokens
 * 
 * // Check if within limits
 * const status = await apiUsageTracker.getUsageStatus();
 * if (status.isLimited) {
 *   console.log('API limit reached');
 * }
 * ```
 */

import { APIUsage, GeminiUsage, EdgeTTSUsage } from '@/types';
import { getAPIUsage, updateAPIUsage, resetAPIUsage } from '@/utils/storage';
import { createLogger } from '@/utils/logger';

const logger = createLogger('APIUsageTracker');

// ============================================
// Constants
// ============================================

const GEMINI_MONTHLY_LIMIT = 1_000_000; // 1M tokens
const GEMINI_WARNING_THRESHOLD = 0.8; // 80%
const MONTH_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// ============================================
// Usage Status
// ============================================

export interface UsageStatus {
  gemini: {
    tokensUsed: number;
    limit: number;
    percentage: number;
    isWarning: boolean;
    isLimited: boolean;
    remainingTokens: number;
    requestsCount: number;
  };
  edgeTTS: {
    charactersUsed: number;
    isLimited: boolean;
  };
  lastReset: number;
  daysUntilReset: number;
}

// ============================================
// API Usage Tracker Class
// ============================================

export class APIUsageTrackerService {
  private cachedUsage: APIUsage | null = null;
  private cacheTimestamp: number = 0;
  private cacheDurationMs = 5000; // Cache for 5 seconds

  /**
   * Get current API usage (with caching)
   */
  async getUsage(): Promise<APIUsage> {
    const now = Date.now();
    
    // Return cached usage if still valid
    if (this.cachedUsage && now - this.cacheTimestamp < this.cacheDurationMs) {
      return this.cachedUsage;
    }
    
    // Fetch fresh usage
    let usage = getAPIUsage();
    
    // Check if monthly reset is needed
    if (this.shouldReset(usage)) {
      usage = await this.resetMonthlyUsage();
    }
    
    this.cachedUsage = usage;
    this.cacheTimestamp = now;
    
    return usage;
  }

  /**
   * Check if monthly reset is needed
   */
  private shouldReset(usage: APIUsage): boolean {
    const now = Date.now();
    return now - usage.gemini.lastReset > MONTH_MS;
  }

  /**
   * Reset monthly usage counters
   */
  private async resetMonthlyUsage(): Promise<APIUsage> {
    logger.info('Resetting monthly API usage counters');
    
    const resetUsage: APIUsage = {
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
    
    await updateAPIUsage(resetUsage);
    return resetUsage;
  }

  /**
   * Track Gemini API usage
   * @param tokens - Number of tokens used
   * @returns Updated usage status
   */
  async trackGeminiUsage(tokens: number): Promise<UsageStatus> {
    const usage = await this.getUsage();
    
    const updatedUsage: APIUsage = {
      ...usage,
      gemini: {
        ...usage.gemini,
        tokensUsed: usage.gemini.tokensUsed + tokens,
        requestsCount: usage.gemini.requestsCount + 1,
      },
      lastUpdated: Date.now(),
    };
    
    await updateAPIUsage(updatedUsage);
    
    // Clear cache to force fresh read
    this.cachedUsage = null;
    
    // Check if warning should be shown
    const percentage = updatedUsage.gemini.tokensUsed / GEMINI_MONTHLY_LIMIT;
    if (percentage >= GEMINI_WARNING_THRESHOLD && !usage.gemini.lastWarning) {
      logger.warn(`Gemini API usage at ${Math.round(percentage * 100)}% of monthly limit`, {
        tokensUsed: updatedUsage.gemini.tokensUsed,
        limit: GEMINI_MONTHLY_LIMIT,
      });
      
      // Update warning timestamp
      await updateAPIUsage({
        ...updatedUsage,
        gemini: {
          ...updatedUsage.gemini,
          lastWarning: Date.now(),
        },
      });
    }
    
    return this.getStatus();
  }

  /**
   * Track Edge TTS usage
   * @param characters - Number of characters synthesized
   */
  async trackTTSUsage(characters: number): Promise<UsageStatus> {
    const usage = await this.getUsage();
    
    const updatedUsage: APIUsage = {
      ...usage,
      edgeTTS: {
        ...usage.edgeTTS,
        charactersUsed: usage.edgeTTS.charactersUsed + characters,
      },
      lastUpdated: Date.now(),
    };
    
    await updateAPIUsage(updatedUsage);
    this.cachedUsage = null;
    
    return this.getStatus();
  }

  /**
   * Get current usage status
   */
  async getStatus(): Promise<UsageStatus> {
    const usage = await this.getUsage();
    const now = Date.now();
    
    const geminiPercentage = usage.gemini.tokensUsed / GEMINI_MONTHLY_LIMIT;
    const daysUntilReset = Math.ceil((usage.gemini.lastReset + MONTH_MS - now) / (24 * 60 * 60 * 1000));
    
    return {
      gemini: {
        tokensUsed: usage.gemini.tokensUsed,
        limit: GEMINI_MONTHLY_LIMIT,
        percentage: Math.round(geminiPercentage * 100) / 100,
        isWarning: geminiPercentage >= GEMINI_WARNING_THRESHOLD,
        isLimited: geminiPercentage >= 1,
        remainingTokens: Math.max(0, GEMINI_MONTHLY_LIMIT - usage.gemini.tokensUsed),
        requestsCount: usage.gemini.requestsCount,
      },
      edgeTTS: {
        charactersUsed: usage.edgeTTS.charactersUsed,
        isLimited: false, // Edge TTS is free/unlimited
      },
      lastReset: usage.gemini.lastReset,
      daysUntilReset: Math.max(0, daysUntilReset),
    };
  }

  /**
   * Check if Gemini API is available (not rate limited)
   */
  async isGeminiAvailable(): Promise<boolean> {
    const status = await this.getStatus();
    return !status.gemini.isLimited;
  }

  /**
   * Get formatted usage summary for display
   */
  async getFormattedSummary(): Promise<string> {
    const status = await this.getStatus();
    
    const geminiStatus = status.gemini.isLimited
      ? '❌ Limited'
      : status.gemini.isWarning
      ? '⚠️ Warning'
      : '✅ Good';
    
    return `
API Usage Summary
─────────────────
Gemini API: ${geminiStatus}
  • Tokens: ${status.gemini.tokensUsed.toLocaleString()} / ${status.gemini.limit.toLocaleString()} (${Math.round(status.gemini.percentage * 100)}%)
  • Requests: ${status.gemini.requestsCount}
  • Remaining: ${status.gemini.remainingTokens.toLocaleString()} tokens
  • Reset in: ${status.daysUntilReset} days

Edge TTS: ✅ Unlimited
  • Characters: ${status.edgeTTS.charactersUsed.toLocaleString()}
`.trim();
  }

  /**
   * Reset all usage (for testing/admin purposes)
   */
  async resetAll(): Promise<void> {
    await resetAPIUsage();
    this.cachedUsage = null;
    logger.info('API usage reset by admin');
  }

  /**
   * Export usage data for analytics
   */
  async exportUsageData(): Promise<{
    usage: APIUsage;
    status: UsageStatus;
    exportedAt: number;
  }> {
    const usage = await this.getUsage();
    const status = await this.getStatus();
    
    return {
      usage,
      status,
      exportedAt: Date.now(),
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

export const apiUsageTracker = new APIUsageTrackerService();

// ============================================
// Convenience Functions
// ============================================

/**
 * Track Gemini usage (shortcut)
 */
export async function trackGeminiUsage(tokens: number): Promise<UsageStatus> {
  return apiUsageTracker.trackGeminiUsage(tokens);
}

/**
 * Track TTS usage (shortcut)
 */
export async function trackTTSUsage(characters: number): Promise<UsageStatus> {
  return apiUsageTracker.trackTTSUsage(characters);
}

/**
 * Get usage status (shortcut)
 */
export async function getUsageStatus(): Promise<UsageStatus> {
  return apiUsageTracker.getStatus();
}

/**
 * Check if Gemini is available (shortcut)
 */
export async function isGeminiAvailable(): Promise<boolean> {
  return apiUsageTracker.isGeminiAvailable();
}
