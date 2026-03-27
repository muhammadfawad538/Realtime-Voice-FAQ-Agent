/**
 * Rate Limiter
 * 
 * Implements client-side rate limiting for API calls.
 * Ensures compliance with free tier limits (Gemini: 15 RPM, 4-second intervals).
 * 
 * Features:
 * - Request queuing
 * - Exponential backoff
 * - Retry-after header support
 * - User-friendly wait time estimates
 * 
 * Usage:
 * ```typescript
 * import { rateLimiter } from '@/utils/rate-limiter';
 * 
 * const result = await rateLimiter.enqueue(
 *   () => geminiService.generateAnswer(request),
 *   'gemini'
 * );
 * ```
 */

import { createLogger } from './logger';

const logger = createLogger('RateLimiter');

// ============================================
// Rate Limit Configuration
// ============================================

export interface RateLimitConfig {
  /** Minimum interval between requests in milliseconds */
  minInterval: number;
  
  /** Maximum number of requests per window */
  maxRequests: number;
  
  /** Window size in milliseconds */
  windowSize: number;
  
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Base delay for exponential backoff */
  baseDelay: number;
  
  /** Maximum delay cap */
  maxDelay: number;
}

// ============================================
// Predefined Configurations
// ============================================

export const predefinedConfigs: Record<string, RateLimitConfig> = {
  // Gemini API Free Tier: 15 RPM = 1 request per 4 seconds
  gemini: {
    minInterval: 4000,
    maxRequests: 15,
    windowSize: 60000, // 1 minute
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  },
  
  // Google Cloud STT Free Tier: 60 min/month
  googleStt: {
    minInterval: 1000,
    maxRequests: 100,
    windowSize: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  },
  
  // Edge TTS: No strict limits (be conservative)
  edgeTts: {
    minInterval: 500,
    maxRequests: 1000,
    windowSize: 3600000, // 1 hour
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  },
  
  // Generic conservative limits
  default: {
    minInterval: 1000,
    maxRequests: 60,
    windowSize: 60000,
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  },
};

// ============================================
// Request Queue Item
// ============================================

interface QueueItem<T> {
  operation: () => Promise<T>;
  resolve: (result: T) => void;
  reject: (error: unknown) => void;
  retries: number;
  config: RateLimitConfig;
}

// ============================================
// Rate Limiter Class
// ============================================

export class RateLimiter {
  private queue: QueueItem<unknown>[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestTimestamps: number[] = [];
  private config: RateLimitConfig;
  private name: string;

  constructor(name: string, config?: Partial<RateLimitConfig>) {
    this.name = name;
    this.config = { ...predefinedConfigs.default, ...config };
  }

  /**
   * Enqueue an operation for rate-limited execution
   * @param operation - Async operation to execute
   * @param priority - Higher priority = executed first (default: 0)
   * @returns Promise resolving to operation result
   */
  async enqueue<T>(operation: () => Promise<T>, priority = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      const item: QueueItem<T> = {
        operation,
        resolve,
        reject,
        retries: 0,
        config: this.config,
      };
      
      // Insert based on priority
      if (priority > 0) {
        const insertIndex = this.queue.findIndex(
          (item) => (item as unknown as { priority?: number }).priority || 0 < priority
        );
        if (insertIndex === -1) {
          this.queue.push(item);
        } else {
          this.queue.splice(insertIndex, 0, item);
        }
      } else {
        this.queue.push(item);
      }
      
      logger.debug(`Enqueued ${this.name} request`, {
        queueLength: this.queue.length,
        priority,
      });
      
      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift() as QueueItem<unknown>;
      
      try {
        // Wait for rate limit
        const waitTime = this.getWaitTime();
        if (waitTime > 0) {
          logger.debug(`Waiting ${waitTime}ms before ${this.name} request`);
          await this.sleep(waitTime);
        }
        
        // Execute operation
        const result = await item.operation();
        this.lastRequestTime = Date.now();
        this.recordRequest();
        
        item.resolve(result);
        
        logger.debug(`${this.name} request completed`, {
          queueLength: this.queue.length,
        });
      } catch (error) {
        const isRateLimitError = this.isRateLimitError(error);
        
        if (isRateLimitError && item.retries < this.config.maxRetries) {
          // Retry with exponential backoff
          item.retries++;
          const backoffDelay = this.calculateBackoff(item.retries);
          
          logger.warn(`${this.name} rate limited, retrying (${item.retries}/${this.config.maxRetries})`, {
            backoffDelay,
          });
          
          await this.sleep(backoffDelay);
          this.queue.unshift(item); // Put back at front
        } else {
          // Max retries exceeded or non-retryable error
          item.reject(error);
          
          logger.error(`${this.name} request failed`, {
            retries: item.retries,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    this.processing = false;
  }

  /**
   * Get wait time before next request
   */
  private getWaitTime(): number {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Check minimum interval
    if (timeSinceLastRequest < this.config.minInterval) {
      return this.config.minInterval - timeSinceLastRequest;
    }
    
    // Check window-based rate limit
    this.cleanOldTimestamps();
    if (this.requestTimestamps.length >= this.config.maxRequests) {
      const oldestTimestamp = this.requestTimestamps[0];
      const windowWaitTime = this.config.windowSize - (now - oldestTimestamp);
      return Math.max(0, windowWaitTime);
    }
    
    return 0;
  }

  /**
   * Record a request timestamp
   */
  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
    this.cleanOldTimestamps();
  }

  /**
   * Clean old timestamps outside the window
   */
  private cleanOldTimestamps(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowSize;
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > windowStart);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.3 * exponentialDelay; // Add 30% jitter
    return Math.min(exponentialDelay + jitter, this.config.maxDelay);
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: unknown): boolean {
    if (error && typeof error === 'object' && 'code' in error) {
      return (error as Record<string, unknown>).code === 'RATE_LIMITED';
    }
    
    if (error && typeof error === 'object' && 'status' in error) {
      return (error as Record<string, unknown>).status === 429;
    }
    
    return false;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Get estimated wait time for next request
   */
  getEstimatedWaitTime(): number {
    return this.getWaitTime();
  }

  /**
   * Get current requests per minute
   */
  getCurrentRPM(): number {
    this.cleanOldTimestamps();
    return this.requestTimestamps.length;
  }

  /**
   * Clear the queue (reject all pending requests)
   */
  clearQueue(reason?: string): void {
    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      item.reject(new Error(reason || 'Queue cleared'));
    }
    logger.warn(`${this.name} queue cleared`, { reason });
  }

  /**
   * Reset rate limiter state
   */
  reset(): void {
    this.lastRequestTime = 0;
    this.requestTimestamps = [];
    logger.info(`${this.name} rate limiter reset`);
  }
}

// ============================================
// Predefined Rate Limiter Instances
// ============================================

export const geminiRateLimiter = new RateLimiter('gemini', predefinedConfigs.gemini);
export const googleSttRateLimiter = new RateLimiter('googleStt', predefinedConfigs.googleStt);
export const edgeTtsRateLimiter = new RateLimiter('edgeTts', predefinedConfigs.edgeTts);

// ============================================
// Default Rate Limiter
// ============================================

export const rateLimiter = geminiRateLimiter;

// ============================================
// Rate Limit Status
// ============================================

export interface RateLimitStatus {
  queueLength: number;
  estimatedWaitTime: number;
  currentRPM: number;
  isProcessing: boolean;
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(limiter?: RateLimiter): RateLimitStatus {
  const l = limiter || rateLimiter;
  return {
    queueLength: l.getQueueLength(),
    estimatedWaitTime: l.getEstimatedWaitTime(),
    currentRPM: l.getCurrentRPM(),
    isProcessing: (l as unknown as { processing: boolean }).processing,
  };
}

// ============================================
// User-Friendly Wait Message
// ============================================

/**
 * Get user-friendly wait message
 */
export function getWaitMessage(limiter?: RateLimiter): string {
  const status = getRateLimitStatus(limiter);
  
  if (status.queueLength > 0) {
    const totalWait = status.estimatedWaitTime * status.queueLength;
    return `You're #${status.queueLength + 1} in line. Estimated wait: ${Math.round(totalWait / 1000)}s`;
  }
  
  if (status.estimatedWaitTime > 0) {
    return `Please wait ${Math.round(status.estimatedWaitTime / 1000)}s before next request`;
  }
  
  return 'Ready to process request';
}
