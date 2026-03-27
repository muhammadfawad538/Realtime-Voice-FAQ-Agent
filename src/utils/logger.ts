/**
 * Logging Utility
 * 
 * Provides structured logging with levels, timestamps, and context.
 * Supports debug mode for verbose output.
 * 
 * Usage:
 * ```typescript
 * import { logger } from '@/utils/logger';
 * 
 * logger.info('Voice session started', { sessionId: '123' });
 * logger.error('STT failed', error);
 * ```
 */

import { VoiceAgentError } from './errors';

// ============================================
// Log Levels
// ============================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// ============================================
// Log Entry Structure
// ============================================

export interface LogEntry {
  /** Timestamp in ISO format */
  timestamp: string;
  
  /** Log level */
  level: LogLevel;
  
  /** Log message */
  message: string;
  
  /** Optional context data */
  context?: Record<string, unknown>;
  
  /** Optional error object */
  error?: VoiceAgentError | Error;
  
  /** Module/component name */
  module?: string;
}

// ============================================
// Logger Configuration
// ============================================

export interface LoggerConfig {
  /** Minimum log level to display */
  minLevel: LogLevel;
  
  /** Whether to include timestamps */
  includeTimestamp: boolean;
  
  /** Whether to include module names */
  includeModule: boolean;
  
  /** Whether to log to console */
  logToConsole: boolean;
  
  /** Optional callback for custom log handling */
  onLog?: (entry: LogEntry) => void;
}

const defaultConfig: LoggerConfig = {
  minLevel: LogLevel.INFO,
  includeTimestamp: true,
  includeModule: true,
  logToConsole: true,
};

let currentConfig = { ...defaultConfig };

// ============================================
// Logger Class
// ============================================

export class Logger {
  private module?: string;

  constructor(module?: string) {
    this.module = module;
  }

  /**
   * Create a child logger with a specific module name
   */
  child(module: string): Logger {
    return new Logger(`${this.module ? `${this.module}:` : ''}${module}`);
  }

  /**
   * Set global logger configuration
   */
  static configure(config: Partial<LoggerConfig>): void {
    currentConfig = { ...currentConfig, ...config };
  }

  /**
   * Get current configuration
   */
  static getConfig(): LoggerConfig {
    return { ...currentConfig };
  }

  /**
   * Enable debug mode
   */
  static enableDebug(): void {
    currentConfig.minLevel = LogLevel.DEBUG;
  }

  /**
   * Disable debug mode (production mode)
   */
  static disableDebug(): void {
    currentConfig.minLevel = LogLevel.INFO;
  }

  /**
   * Check if debug mode is enabled
   */
  static isDebugEnabled(): boolean {
    return currentConfig.minLevel <= LogLevel.DEBUG;
  }

  /**
   * Format log entry for output
   */
  private formatEntry(entry: LogEntry): string {
    const parts: string[] = [];

    // Timestamp
    if (currentConfig.includeTimestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    // Level
    const levelName = LogLevel[entry.level].padEnd(5);
    parts.push(`[${levelName}]`);

    // Module
    if (currentConfig.includeModule && entry.module) {
      parts.push(`[${entry.module}]`);
    }

    // Message
    parts.push(entry.message);

    // Context
    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context));
    }

    // Error
    if (entry.error) {
      if (entry.error instanceof Error) {
        parts.push(`Error: ${entry.error.message}`);
        if (entry.error.stack) {
          parts.push(`Stack: ${entry.error.stack}`);
        }
      } else {
        parts.push(`Error: ${JSON.stringify(entry.error)}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Create a log entry
   */
  private createEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: VoiceAgentError | Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      module: this.module,
    };
  }

  /**
   * Output log entry
   */
  private output(entry: LogEntry): void {
    // Skip if below minimum level
    if (entry.level < currentConfig.minLevel) {
      return;
    }

    // Log to console
    if (currentConfig.logToConsole) {
      const formatted = this.formatEntry(entry);
      
      switch (entry.level) {
        LogLevel.DEBUG:
          console.debug(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.ERROR:
          console.error(formatted);
          break;
      }
    }

    // Call custom handler
    if (currentConfig.onLog) {
      currentConfig.onLog(entry);
    }
  }

  // ============================================
  // Log Methods
  // ============================================

  /**
   * Debug level log (only in development)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.DEBUG, message, context);
    this.output(entry);
  }

  /**
   * Info level log (general information)
   */
  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.INFO, message, context);
    this.output(entry);
  }

  /**
   * Warning level log (potential issues)
   */
  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createEntry(LogLevel.WARN, message, context);
    this.output(entry);
  }

  /**
   * Error level log (errors and failures)
   */
  error(message: string, errorOrContext?: VoiceAgentError | Error | Record<string, unknown>, context?: Record<string, unknown>): void {
    let error: VoiceAgentError | Error | undefined;
    let ctx: Record<string, unknown> | undefined;

    if (errorOrContext instanceof Error || (errorOrContext && 'code' in errorOrContext)) {
      error = errorOrContext as VoiceAgentError | Error;
      ctx = context;
    } else {
      ctx = errorOrContext;
    }

    const entry = this.createEntry(LogLevel.ERROR, message, ctx, error);
    this.output(entry);
  }

  /**
   * Log a voice session event
   */
  logSession(event: string, sessionId: string, context?: Record<string, unknown>): void {
    this.info(`Session: ${event}`, { sessionId, ...context });
  }

  /**
   * Log API usage
   */
  logAPIUsage(api: string, tokens: number, latency: number): void {
    this.debug(`API Usage: ${api}`, { tokens, latency: `${latency}ms` });
  }

  /**
   * Log latency metrics
   */
  logLatency(operation: string, latencyMs: number, threshold?: number): void {
    const level = threshold && latencyMs > threshold ? LogLevel.WARN : LogLevel.DEBUG;
    
    const entry = this.createEntry(
      level,
      `Latency: ${operation}`,
      { latency: `${latencyMs}ms`, threshold: threshold ? `${threshold}ms` : undefined }
    );
    this.output(entry);
  }
}

// ============================================
// Default Logger Instance
// ============================================

export const logger = new Logger('VoiceAgent');

// ============================================
// Convenience Functions
// ============================================

/**
 * Create a logger for a specific module
 */
export function createLogger(module: string): Logger {
  return logger.child(module);
}

/**
 * Enable debug logging
 */
export function enableDebug(): void {
  Logger.enableDebug();
  logger.info('Debug logging enabled');
}

/**
 * Disable debug logging
 */
export function disableDebug(): void {
  Logger.disableDebug();
  logger.info('Debug logging disabled');
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return Logger.isDebugEnabled();
}

// ============================================
// Performance Logging
// ============================================

/**
 * Measure execution time and log result
 * 
 * @param operation - Operation name
 * @param fn - Function to measure
 * @param logger - Logger instance
 * @returns Function result
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  log: Logger = logger
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    log.logLatency(operation, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    log.logLatency(operation, duration);
    throw error;
  }
}

/**
 * Measure synchronous execution time and log result
 */
export function measure<T>(
  operation: string,
  fn: () => T,
  log: Logger = logger
): T {
  const start = performance.now();
  
  try {
    const result = fn();
    const duration = performance.now() - start;
    log.logLatency(operation, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    log.logLatency(operation, duration);
    throw error;
  }
}

// ============================================
// Log Buffer (for batch sending)
// ============================================

export class LogBuffer {
  private buffer: LogEntry[] = [];
  private maxSize: number;
  private flushCallback?: (entries: LogEntry[]) => void;

  constructor(maxSize = 100, flushCallback?: (entries: LogEntry[]) => void) {
    this.maxSize = maxSize;
    this.flushCallback = flushCallback;
  }

  /**
   * Add entry to buffer
   */
  add(entry: LogEntry): void {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.maxSize) {
      this.flush();
    }
  }

  /**
   * Flush buffer
   */
  flush(): void {
    if (this.buffer.length === 0) return;
    
    const entries = [...this.buffer];
    this.buffer = [];
    
    if (this.flushCallback) {
      this.flushCallback(entries);
    }
  }

  /**
   * Clear buffer without flushing
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Get buffer size
   */
  size(): number {
    return this.buffer.length;
  }
}
