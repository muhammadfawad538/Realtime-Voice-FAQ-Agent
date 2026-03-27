/**
 * Latency Tracker
 * 
 * Provides performance measurement and tracking for voice pipeline stages.
 * Uses Performance API for accurate timing.
 * 
 * Usage:
 * ```typescript
 * import { latencyTracker } from '@/utils/latency-logger';
 * 
 * // Start tracking
 * latencyTracker.start('stt');
 * 
 * // End tracking and get duration
 * const duration = latencyTracker.end('stt');
 * 
 * // Log full pipeline breakdown
 * latencyTracker.logBreakdown({ stt: 850, llm: 1200, tts: 1800 });
 * ```
 */

import { logger, createLogger } from './logger';

const performanceLogger = createLogger('Performance');

// ============================================
// Latency Breakdown Type
// ============================================

export interface LatencyBreakdown {
  stt: number;      // Speech-to-text duration (ms)
  llm: number;      // LLM processing duration (ms)
  tts: number;      // Text-to-speech duration (ms)
  total: number;    // End-to-end duration (ms)
}

// ============================================
// Performance Thresholds
// ============================================

export interface LatencyThresholds {
  /** Target latency (green) */
  target: number;
  
  /** Acceptable latency (yellow) */
  acceptable: number;
  
  /** Too slow (red) */
  tooSlow: number;
}

export const defaultThresholds: LatencyThresholds = {
  target: 3000,      // < 3s is good
  acceptable: 5000,  // < 5s is acceptable
  tooSlow: 8000,     // > 8s is too slow
};

export const stageThresholds: Record<string, LatencyThresholds> = {
  stt: {
    target: 800,
    acceptable: 1500,
    tooSlow: 3000,
  },
  llm: {
    target: 1000,
    acceptable: 2000,
    tooSlow: 4000,
  },
  tts: {
    target: 1000,
    acceptable: 2000,
    tooSlow: 3500,
  },
};

// ============================================
// Timing Session
// ============================================

interface TimingSession {
  startTime: number;
  stageStarts: Map<string, number>;
  stageDurations: Map<string, number>;
  metadata?: Record<string, unknown>;
}

// ============================================
// Latency Tracker Class
// ============================================

export class LatencyTracker {
  private sessions: Map<string, TimingSession>;
  private history: LatencyBreakdown[];
  private maxHistorySize: number;

  constructor(maxHistorySize = 100) {
    this.sessions = new Map();
    this.history = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Start a new timing session
   * @param sessionId - Unique session identifier
   * @param metadata - Optional metadata to track
   */
  start(sessionId: string, metadata?: Record<string, unknown>): void {
    this.sessions.set(sessionId, {
      startTime: performance.now(),
      stageStarts: new Map(),
      stageDurations: new Map(),
      metadata,
    });
    
    performanceLogger.debug('Session started', { sessionId });
  }

  /**
   * Start timing a specific stage
   * @param sessionId - Session identifier
   * @param stageName - Stage name (e.g., 'stt', 'llm', 'tts')
   */
  startStage(sessionId: string, stageName: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      performanceLogger.warn('Session not found', { sessionId });
      return;
    }
    
    session.stageStarts.set(stageName, performance.now());
    performanceLogger.debug(`Stage started: ${stageName}`, { sessionId });
  }

  /**
   * End timing a specific stage
   * @param sessionId - Session identifier
   * @param stageName - Stage name
   * @returns Stage duration in milliseconds
   */
  endStage(sessionId: string, stageName: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) {
      performanceLogger.warn('Session not found', { sessionId });
      return -1;
    }
    
    const stageStart = session.stageStarts.get(stageName);
    if (!stageStart) {
      performanceLogger.warn('Stage not started', { sessionId, stageName });
      return -1;
    }
    
    const duration = performance.now() - stageStart;
    session.stageDurations.set(stageName, duration);
    
    performanceLogger.debug(`Stage ended: ${stageName}`, { sessionId, duration: `${duration.toFixed(2)}ms` });
    
    return duration;
  }

  /**
   * End the timing session and get breakdown
   * @param sessionId - Session identifier
   * @returns Latency breakdown or null if session not found
   */
  end(sessionId: string): LatencyBreakdown | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      performanceLogger.warn('Session not found', { sessionId });
      return null;
    }
    
    const total = performance.now() - session.startTime;
    
    const breakdown: LatencyBreakdown = {
      stt: session.stageDurations.get('stt') || 0,
      llm: session.stageDurations.get('llm') || 0,
      tts: session.stageDurations.get('tts') || 0,
      total,
    };
    
    // Add to history
    this.addToHistory(breakdown);
    
    // Log the breakdown
    this.logBreakdown(breakdown, sessionId);
    
    // Clean up session
    this.sessions.delete(sessionId);
    
    return breakdown;
  }

  /**
   * Record a one-off timing (without session management)
   * @param stageName - Stage name
   * @param duration - Duration in milliseconds
   */
  record(stageName: string, duration: number): void {
    performanceLogger.debug(`Recorded: ${stageName}`, { duration: `${duration.toFixed(2)}ms` });
  }

  /**
   * Get current session duration without ending it
   * @param sessionId - Session identifier
   * @returns Current duration in milliseconds
   */
  getCurrentDuration(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return -1;
    }
    return performance.now() - session.startTime;
  }

  /**
   * Get stage-specific duration
   * @param sessionId - Session identifier
   * @param stageName - Stage name
   * @returns Stage duration or -1 if not found
   */
  getStageDuration(sessionId: string, stageName: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return -1;
    }
    return session.stageDurations.get(stageName) || -1;
  }

  /**
   * Add breakdown to history
   */
  private addToHistory(breakdown: LatencyBreakdown): void {
    this.history.push(breakdown);
    
    // Trim history if exceeds max size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Log latency breakdown with color-coded status
   */
  logBreakdown(breakdown: LatencyBreakdown, sessionId?: string): void {
    const context: Record<string, string> = {
      total: `${breakdown.total.toFixed(0)}ms`,
      stt: `${breakdown.stt.toFixed(0)}ms`,
      llm: `${breakdown.llm.toFixed(0)}ms`,
      tts: `${breakdown.tts.toFixed(0)}ms`,
    };
    
    // Determine status based on total latency
    const status = this.getStatus(breakdown.total, defaultThresholds);
    const statusEmoji = status === 'good' ? '✅' : status === 'acceptable' ? '⚠️' : '❌';
    
    performanceLogger.info(
      `${statusEmoji} Latency Breakdown${sessionId ? ` (${sessionId})` : ''}`,
      { ...context, status }
    );
    
    // Log individual stage statuses
    (['stt', 'llm', 'tts'] as const).forEach((stage) => {
      const stageDuration = breakdown[stage];
      const thresholds = stageThresholds[stage];
      const stageStatus = this.getStatus(stageDuration, thresholds);
      const stageEmoji = stageStatus === 'good' ? '✅' : stageStatus === 'acceptable' ? '⚠️' : '❌';
      
      performanceLogger.debug(`${stageEmoji} ${stage.toUpperCase()}`, {
        duration: `${stageDuration.toFixed(0)}ms`,
        status: stageStatus,
      });
    });
  }

  /**
   * Get status based on thresholds
   */
  private getStatus(duration: number, thresholds: LatencyThresholds): 'good' | 'acceptable' | 'tooSlow' {
    if (duration <= thresholds.target) return 'good';
    if (duration <= thresholds.acceptable) return 'acceptable';
    return 'tooSlow';
  }

  /**
   * Get average latency from history
   */
  getAverageLatency(): LatencyBreakdown | null {
    if (this.history.length === 0) return null;
    
    const sum = this.history.reduce(
      (acc, curr) => ({
        stt: acc.stt + curr.stt,
        llm: acc.llm + curr.llm,
        tts: acc.tts + curr.tts,
        total: acc.total + curr.total,
      }),
      { stt: 0, llm: 0, tts: 0, total: 0 }
    );
    
    const count = this.history.length;
    return {
      stt: sum.stt / count,
      llm: sum.llm / count,
      tts: sum.tts / count,
      total: sum.total / count,
    };
  }

  /**
   * Get p95 latency from history
   */
  getP95Latency(): LatencyBreakdown | null {
    if (this.history.length === 0) return null;
    
    const sorted = [...this.history].sort((a, b) => a.total - b.total);
    const p95Index = Math.floor(sorted.length * 0.95);
    
    return sorted[Math.min(p95Index, sorted.length - 1)];
  }

  /**
   * Get latency statistics
   */
  getStatistics(): {
    count: number;
    average: LatencyBreakdown | null;
    p95: LatencyBreakdown | null;
    min: LatencyBreakdown | null;
    max: LatencyBreakdown | null;
  } | null {
    if (this.history.length === 0) return null;
    
    const sorted = [...this.history].sort((a, b) => a.total - b.total);
    
    return {
      count: this.history.length,
      average: this.getAverageLatency(),
      p95: this.getP95Latency(),
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    performanceLogger.debug('Latency history cleared');
  }

  /**
   * Export history for analysis
   */
  exportHistory(): LatencyBreakdown[] {
    return [...this.history];
  }
}

// ============================================
// Default Tracker Instance
// ============================================

export const latencyTracker = new LatencyTracker();

// ============================================
// Convenience Functions
// ============================================

/**
 * Measure a single async operation
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  performanceLogger.debug(`Measured: ${operation}`, { duration: `${duration.toFixed(2)}ms` });
  
  return { result, duration };
}

/**
 * Measure a single sync operation
 */
export function measure<T>(
  operation: string,
  fn: () => T
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  performanceLogger.debug(`Measured: ${operation}`, { duration: `${duration.toFixed(2)}ms` });
  
  return { result, duration };
}

/**
 * Create a performance mark
 */
export function mark(name: string): void {
  performance.mark(`voice-agent-${name}-start`);
  performanceLogger.debug(`Mark: ${name} started`);
}

/**
 * Measure between two marks
 */
export function measureBetweenMarks(startMark: string, endMark: string): number {
  const startEntry = performance.getEntriesByName(`voice-agent-${startMark}-start`, 'mark')[0];
  
  if (!startEntry) {
    performanceLogger.warn('Start mark not found', { mark: startMark });
    return -1;
  }
  
  performance.mark(`voice-agent-${endMark}-end`);
  const endEntry = performance.getEntriesByName(`voice-agent-${endMark}-end`, 'mark')[0];
  
  if (!endEntry) {
    performanceLogger.warn('End mark not found', { mark: endMark });
    return -1;
  }
  
  const duration = endEntry.startTime - startEntry.startTime;
  performanceLogger.debug(`Measure: ${startMark} → ${endMark}`, { duration: `${duration.toFixed(2)}ms` });
  
  return duration;
}

/**
 * Clear all performance marks
 */
export function clearMarks(): void {
  const marks = performance.getEntriesByType('mark');
  marks.forEach((mark) => {
    if (mark.name.startsWith('voice-agent-')) {
      performance.clearMarks(mark.name);
    }
  });
}
