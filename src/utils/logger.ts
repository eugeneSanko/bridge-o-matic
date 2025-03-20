
/**
 * Logger utility for managing application logs
 */

// Enable/disable all logs using this flag
const LOGGING_ENABLED = false; 

// Enable/disable debug logs based on environment
const isDevMode = import.meta.env.DEV || false;
const isDebugEnabled = isDevMode || import.meta.env.VITE_DEBUG_LOGS === 'true';

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Logger configuration
const loggerConfig = {
  enabled: LOGGING_ENABLED,
  debugEnabled: isDebugEnabled,
  prefix: '[Bridge]',
};

// Override console methods to prevent any direct console logs
if (!LOGGING_ENABLED) {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  // Override with empty functions when logging is disabled
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.debug = () => {};

  // Only expose the original error in production for critical errors
  if (!isDevMode) {
    console.error = originalConsole.error;
  }
}

/**
 * Main logger object
 */
export const logger = {
  /**
   * Log debug information (only in development or when debug logs are enabled)
   */
  debug: (message: string, ...data: any[]) => {
    if (!loggerConfig.enabled || !loggerConfig.debugEnabled) return;
    console.debug(`${loggerConfig.prefix} ${message}`, ...data);
  },

  /**
   * Log informational messages
   */
  info: (message: string, ...data: any[]) => {
    if (!loggerConfig.enabled) return;
    console.info(`${loggerConfig.prefix} ${message}`, ...data);
  },

  /**
   * Log warning messages
   */
  warn: (message: string, ...data: any[]) => {
    if (!loggerConfig.enabled) return;
    console.warn(`${loggerConfig.prefix} ${message}`, ...data);
  },

  /**
   * Log error messages (also affected by global logging flag)
   */
  error: (message: string, ...data: any[]) => {
    if (!loggerConfig.enabled) return;
    console.error(`${loggerConfig.prefix} ${message}`, ...data);
  },

  /**
   * Log API request details
   */
  apiRequest: (endpoint: string, method: string, body?: any) => {
    if (!loggerConfig.enabled || !loggerConfig.debugEnabled) return;
    console.debug(`${loggerConfig.prefix} API Request: ${method} ${endpoint}`, body || '');
  },

  /**
   * Log API response details
   */
  apiResponse: (endpoint: string, status: number, data?: any) => {
    if (!loggerConfig.enabled || !loggerConfig.debugEnabled) return;
    console.debug(`${loggerConfig.prefix} API Response: ${status} ${endpoint}`, data || '');
  },
};

/**
 * Create a child logger with a custom prefix
 */
export const createLogger = (prefix: string) => {
  return {
    debug: (message: string, ...data: any[]) => {
      if (!loggerConfig.enabled || !loggerConfig.debugEnabled) return;
      console.debug(`[${prefix}] ${message}`, ...data);
    },
    info: (message: string, ...data: any[]) => {
      if (!loggerConfig.enabled) return;
      console.info(`[${prefix}] ${message}`, ...data);
    },
    warn: (message: string, ...data: any[]) => {
      if (!loggerConfig.enabled) return;
      console.warn(`[${prefix}] ${message}`, ...data);
    },
    error: (message: string, ...data: any[]) => {
      if (!loggerConfig.enabled) return;
      console.error(`[${prefix}] ${message}`, ...data);
    },
  };
};

// Now let's also modify the console object's prototype to ensure that even console logs from external libraries or inaccessible files are suppressed
if (!LOGGING_ENABLED) {
  // This affects all console.log calls globally, even from third-party libraries
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      // Give time for other scripts to initialize, then silence the console
      if (!isDevMode) {
        console.log = () => {};
        console.info = () => {};
        console.warn = () => {};
        console.debug = () => {};
      }
    }, 100);
  });
}
