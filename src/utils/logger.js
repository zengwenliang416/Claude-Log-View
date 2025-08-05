/**
 * Production-safe logging utility
 * Only logs in development environment or when explicitly enabled
 */

// Check if we're in development environment
const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development'
const isDebugEnabled = import.meta.env?.VITE_DEBUG_LOGS === 'true'

// Logger interface
export const logger = {
  /**
   * Log general information (only in development)
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (isDevelopment && console.log) {
      console.log(...args)
    }
  },

  /**
   * Log warnings (production safe - important for debugging)
   * @param {...any} args - Arguments to log
   */
  warn(...args) {
    if ((isDevelopment || isDebugEnabled) && console.warn) {
      console.warn(...args)
    }
  },

  /**
   * Log errors (production safe - always shown for debugging)
   * @param {...any} args - Arguments to log
   */
  error(...args) {
    if (console.error) {
      console.error(...args)
    }
  },

  /**
   * Log debug information (only when debug is enabled)
   * @param {...any} args - Arguments to log
   */
  debug(...args) {
    if ((isDevelopment || isDebugEnabled) && console.debug) {
      console.debug(...args)
    }
  },

  /**
   * Log information messages (production safe)
   * @param {...any} args - Arguments to log
   */
  info(...args) {
    if ((isDevelopment || isDebugEnabled) && console.info) {
      console.info(...args)
    }
  }
}

/**
 * Performance logging utility
 */
export const perfLogger = {
  /**
   * Time a function execution
   * @param {string} label - Label for the timing
   * @param {Function} fn - Function to time
   * @returns {any} Result of the function
   */
  time(label, fn) {
    if (!isDevelopment && !isDebugEnabled) {
      return fn()
    }

    const start = performance.now()
    const result = fn()
    const end = performance.now()
    
    logger.debug(`${label}: ${(end - start).toFixed(2)}ms`)
    return result
  },

  /**
   * Start a performance timer
   * @param {string} label - Timer label
   */
  timeStart(label) {
    if ((isDevelopment || isDebugEnabled) && console.time) {
      console.time(label)
    }
  },

  /**
   * End a performance timer
   * @param {string} label - Timer label
   */
  timeEnd(label) {
    if ((isDevelopment || isDebugEnabled) && console.timeEnd) {
      console.timeEnd(label)
    }
  }
}

export default logger