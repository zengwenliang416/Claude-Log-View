/**
 * Production-safe professional logging system
 * Supports environment-aware logging with structured output and performance monitoring
 */

// Log levels enum
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

// Environment detection utilities
const detectEnvironment = () => {
  // Check Vite environment first (build-time)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.NODE_ENV || (import.meta.env.DEV ? 'development' : 'production')
  }
  // Fallback to process.env (runtime)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV || 'development'
  }
  // Default fallback
  return 'production'
}

const isProduction = () => detectEnvironment() === 'production'
const isDevelopment = () => detectEnvironment() === 'development'

// Configuration class for centralized logging management
class LoggerConfig {
  constructor() {
    this.environment = detectEnvironment()
    this.level = this.getDefaultLogLevel()
    this.enableConsole = true
    this.enableStructured = isProduction()
    this.prefix = '[Claude-Log-View]'
    this.enableMetrics = isDevelopment()
    this.maxMessageLength = 1000
  }

  getDefaultLogLevel() {
    // Check for explicit log level configuration
    const envLogLevel = this.getEnvironmentLogLevel()
    if (envLogLevel !== null) return envLogLevel
    
    // Default based on environment
    return isProduction() ? LogLevel.WARN : LogLevel.DEBUG
  }

  getEnvironmentLogLevel() {
    let levelString = null
    
    // Check Vite environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      levelString = import.meta.env.VITE_LOG_LEVEL
    }
    
    // Check process environment variables
    if (!levelString && typeof process !== 'undefined' && process.env) {
      levelString = process.env.LOG_LEVEL || process.env.VITE_LOG_LEVEL
    }
    
    if (!levelString) return null
    
    const upperLevel = levelString.toUpperCase()
    return LogLevel[upperLevel] !== undefined ? LogLevel[upperLevel] : null
  }

  setLevel(level) {
    if (typeof level === 'string') {
      const upperLevel = level.toUpperCase()
      this.level = LogLevel[upperLevel] !== undefined ? LogLevel[upperLevel] : LogLevel.INFO
    } else if (typeof level === 'number' && level >= 0 && level <= 4) {
      this.level = level
    }
  }

  isLevelEnabled(level) {
    return level >= this.level
  }
}

// Professional Logger implementation
class Logger {
  constructor() {
    this.config = new LoggerConfig()
    this.metrics = {
      messagesLogged: 0,
      errorCount: 0,
      warningCount: 0,
      startTime: Date.now()
    }
  }

  /**
   * Format message with context and metadata
   * @param {string} level - Log level
   * @param {string} message - Primary message
   * @param {any} context - Additional context data
   * @returns {object|string} Formatted message
   */
  formatMessage(level, message, context = null) {
    if (this.config.enableStructured) {
      return {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message: this.truncateMessage(message),
        context: context ? this.sanitizeContext(context) : undefined,
        environment: this.config.environment,
        component: context?.component || 'unknown'
      }
    } else {
      const timestamp = new Date().toLocaleTimeString()
      const prefix = this.config.prefix
      const contextStr = context ? ` [${context.component || 'app'}]` : ''
      return `${timestamp} ${prefix}${contextStr} [${level.toUpperCase()}] ${message}`
    }
  }

  /**
   * Truncate long messages to prevent console overflow
   * @param {string} message - Message to truncate
   * @returns {string} Truncated message
   */
  truncateMessage(message) {
    if (typeof message !== 'string') return message
    if (message.length <= this.config.maxMessageLength) return message
    return message.substring(0, this.config.maxMessageLength) + '...[truncated]'
  }

  /**
   * Sanitize context data to prevent sensitive information exposure
   * @param {any} context - Context to sanitize
   * @returns {any} Sanitized context
   */
  sanitizeContext(context) {
    if (!context || typeof context !== 'object') return context
    
    const sanitized = {}
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth']
    
    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeContext(value)
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  /**
   * Output message to console with appropriate method
   * @param {string} level - Log level
   * @param {any} formattedMessage - Formatted message
   */
  output(level, formattedMessage) {
    if (!this.config.enableConsole) return
    
    this.metrics.messagesLogged++
    
    switch (level) {
      case 'error':
        this.metrics.errorCount++
        console.error(formattedMessage)
        break
      case 'warn':
        this.metrics.warningCount++
        console.warn(formattedMessage)
        break
      case 'info':
        console.info(formattedMessage)
        break
      case 'debug':
      default:
        if (console.debug) {
          console.debug(formattedMessage)
        } else {
          console.log(formattedMessage)
        }
        break
    }
  }

  /**
   * Debug level logging
   * @param {string} message - Debug message
   * @param {any} context - Additional context
   */
  debug(message, context = null) {
    if (!this.config.isLevelEnabled(LogLevel.DEBUG)) return
    const formatted = this.formatMessage('debug', message, context)
    this.output('debug', formatted)
  }

  /**
   * Info level logging
   * @param {string} message - Info message
   * @param {any} context - Additional context
   */
  info(message, context = null) {
    if (!this.config.isLevelEnabled(LogLevel.INFO)) return
    const formatted = this.formatMessage('info', message, context)
    this.output('info', formatted)
  }

  /**
   * Warning level logging
   * @param {string} message - Warning message
   * @param {any} context - Additional context
   */
  warn(message, context = null) {
    if (!this.config.isLevelEnabled(LogLevel.WARN)) return
    const formatted = this.formatMessage('warn', message, context)
    this.output('warn', formatted)
  }

  /**
   * Error level logging
   * @param {string} message - Error message
   * @param {any} context - Additional context (may include error objects)
   */
  error(message, context = null) {
    if (!this.config.isLevelEnabled(LogLevel.ERROR)) return
    
    // Extract error details if context contains an error
    if (context?.error instanceof Error) {
      context = {
        ...context,
        error: {
          name: context.error.name,
          message: context.error.message,
          stack: isDevelopment() ? context.error.stack : undefined
        }
      }
    }
    
    const formatted = this.formatMessage('error', message, context)
    this.output('error', formatted)
  }

  /**
   * Set logging level
   * @param {number|string} level - Log level to set
   */
  setLevel(level) {
    this.config.setLevel(level)
  }

  /**
   * Check if a log level is enabled
   * @param {number} level - Log level to check
   * @returns {boolean} Whether the level is enabled
   */
  isEnabled(level) {
    return this.config.isLevelEnabled(level)
  }

  /**
   * Get logging metrics for performance monitoring
   * @returns {object} Logging metrics
   */
  getMetrics() {
    if (!this.config.enableMetrics) {
      return { metricsDisabled: true }
    }
    
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.startTime,
      environment: this.config.environment,
      currentLevel: this.config.level,
      averageLogsPerSecond: this.metrics.messagesLogged / ((Date.now() - this.metrics.startTime) / 1000)
    }
  }

  /**
   * Clear metrics (useful for testing)
   */
  clearMetrics() {
    this.metrics = {
      messagesLogged: 0,
      errorCount: 0,
      warningCount: 0,
      startTime: Date.now()
    }
  }
}

// Performance logging utilities
class PerformanceLogger {
  constructor(logger) {
    this.logger = logger
    this.timers = new Map()
  }

  /**
   * Time a function execution with automatic logging
   * @param {string} label - Label for the timing
   * @param {Function} fn - Function to time
   * @returns {any} Result of the function
   */
  time(label, fn) {
    if (!this.logger.isEnabled(LogLevel.DEBUG)) {
      return fn()
    }

    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      
      this.logger.debug(`Performance timing: ${label}`, {
        component: 'PerformanceLogger',
        duration: `${duration.toFixed(2)}ms`,
        label
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.logger.error(`Performance timing failed: ${label}`, {
        component: 'PerformanceLogger',
        duration: `${duration.toFixed(2)}ms`,
        label,
        error
      })
      throw error
    }
  }

  /**
   * Start a performance timer
   * @param {string} label - Timer label
   */
  timeStart(label) {
    if (this.logger.isEnabled(LogLevel.DEBUG)) {
      this.timers.set(label, performance.now())
    }
  }

  /**
   * End a performance timer and log the result
   * @param {string} label - Timer label
   */
  timeEnd(label) {
    if (!this.logger.isEnabled(LogLevel.DEBUG)) return
    
    const startTime = this.timers.get(label)
    if (startTime === undefined) {
      this.logger.warn(`Performance timer '${label}' was not started`, {
        component: 'PerformanceLogger'
      })
      return
    }
    
    const duration = performance.now() - startTime
    this.timers.delete(label)
    
    this.logger.debug(`Performance timer: ${label}`, {
      component: 'PerformanceLogger',
      duration: `${duration.toFixed(2)}ms`,
      label
    })
  }

  /**
   * Clear all active timers
   */
  clearTimers() {
    this.timers.clear()
  }
}

// Create singleton instances
export const logger = new Logger()
export const perfLogger = new PerformanceLogger(logger)

// Backward compatibility exports
export const log = logger.info.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)
export const debug = logger.debug.bind(logger)
export const info = logger.info.bind(logger)

// Export for configuration
export { Logger, LoggerConfig, PerformanceLogger }
export default logger