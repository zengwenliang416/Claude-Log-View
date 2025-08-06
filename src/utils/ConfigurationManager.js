import { logger } from './logger.js'

/**
 * Centralized environment configuration management system
 * Handles environment detection, variable loading, and validation
 */
export class ConfigurationManager {
  constructor() {
    this.environment = this.detectEnvironment()
    this.config = this.loadConfiguration()
    this.featureFlags = this.loadFeatureFlags()
    this.validated = false
    
    logger.debug('ConfigurationManager initialized', {
      component: 'ConfigurationManager',
      environment: this.environment,
      configKeys: Object.keys(this.config),
      featureFlagKeys: Object.keys(this.featureFlags)
    })
  }

  /**
   * Detect the current runtime environment
   * @returns {string} Environment name (development, production, test)
   */
  detectEnvironment() {
    // Check Vite environment variables first (build-time)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (import.meta.env.NODE_ENV) {
        return import.meta.env.NODE_ENV
      }
      if (import.meta.env.DEV) {
        return 'development'
      }
      if (import.meta.env.PROD) {
        return 'production'
      }
    }
    
    // Check process environment (Node.js runtime)
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV || 'development'
    }
    
    // Check for common test environment indicators
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        return 'development'
      }
    }
    
    // Default to production for safety
    return 'production'
  }

  /**
   * Load configuration from environment variables with defaults
   * @returns {object} Configuration object
   */
  loadConfiguration() {
    const config = {
      // Environment info
      NODE_ENV: this.environment,
      IS_PRODUCTION: this.environment === 'production',
      IS_DEVELOPMENT: this.environment === 'development',
      IS_TEST: this.environment === 'test',
      
      // Application info
      APP_NAME: this.getEnvVar('VITE_APP_NAME', 'Claude Log Viewer'),
      APP_VERSION: this.getEnvVar('VITE_APP_VERSION', '1.0.0'),
      BUILD_DATE: this.getEnvVar('VITE_BUILD_DATE', new Date().toISOString()),
      
      // Logging configuration
      LOG_LEVEL: this.getEnvVar('VITE_LOG_LEVEL', this.environment === 'production' ? 'WARN' : 'DEBUG'),
      ENABLE_DEBUG_LOGS: this.getBooleanEnvVar('VITE_ENABLE_DEBUG_LOGS', this.environment !== 'production'),
      ENABLE_PERFORMANCE_LOGS: this.getBooleanEnvVar('VITE_ENABLE_PERFORMANCE_LOGS', true),
      
      // File upload configuration
      MAX_FILE_SIZE: this.getNumberEnvVar('VITE_MAX_FILE_SIZE', 50 * 1024 * 1024), // 50MB
      ALLOWED_FILE_TYPES: this.getArrayEnvVar('VITE_ALLOWED_FILE_TYPES', ['.jsonl', '.json']),
      UPLOAD_TIMEOUT: this.getNumberEnvVar('VITE_UPLOAD_TIMEOUT', 30000), // 30 seconds
      
      // Performance configuration
      CACHE_SIZE: this.getNumberEnvVar('VITE_CACHE_SIZE', 2000),
      VIRTUAL_SCROLL_ITEM_HEIGHT: this.getNumberEnvVar('VITE_VIRTUAL_SCROLL_ITEM_HEIGHT', 50),
      DEBOUNCE_DELAY: this.getNumberEnvVar('VITE_DEBOUNCE_DELAY', 300),
      
      // UI configuration
      ENABLE_3D_BACKGROUND: this.getBooleanEnvVar('VITE_ENABLE_3D_BACKGROUND', true),
      ENABLE_ANIMATIONS: this.getBooleanEnvVar('VITE_ENABLE_ANIMATIONS', true),
      THEME_PREFERENCE: this.getEnvVar('VITE_THEME_PREFERENCE', 'auto'),
      
      // Security configuration
      ENABLE_CONTENT_SECURITY: this.getBooleanEnvVar('VITE_ENABLE_CONTENT_SECURITY', true),
      STRICT_FILE_VALIDATION: this.getBooleanEnvVar('VITE_STRICT_FILE_VALIDATION', this.environment === 'production'),
      SANITIZE_CONTENT: this.getBooleanEnvVar('VITE_SANITIZE_CONTENT', true),
      
      // Monitoring and analytics
      ENABLE_PERFORMANCE_MONITORING: this.getBooleanEnvVar('VITE_ENABLE_PERFORMANCE_MONITORING', true),
      ENABLE_ERROR_REPORTING: this.getBooleanEnvVar('VITE_ENABLE_ERROR_REPORTING', this.environment === 'production'),
      ANALYTICS_ID: this.getEnvVar('VITE_ANALYTICS_ID', null),
      
      // Development tools
      ENABLE_VUE_DEVTOOLS: this.getBooleanEnvVar('VITE_ENABLE_VUE_DEVTOOLS', this.environment === 'development'),
      ENABLE_DEBUG_OVERLAY: this.getBooleanEnvVar('VITE_ENABLE_DEBUG_OVERLAY', this.environment === 'development'),
      
      // API configuration (for future use)
      API_BASE_URL: this.getEnvVar('VITE_API_BASE_URL', null),
      API_TIMEOUT: this.getNumberEnvVar('VITE_API_TIMEOUT', 10000),
      
      // Build configuration
      BUILD_TARGET: this.getEnvVar('VITE_BUILD_TARGET', 'modern'),
      BUNDLE_ANALYZER: this.getBooleanEnvVar('VITE_BUNDLE_ANALYZER', false),
      SOURCE_MAPS: this.getBooleanEnvVar('VITE_SOURCE_MAPS', this.environment !== 'production')
    }
    
    return config
  }

  /**
   * Load feature flags from environment variables
   * @returns {object} Feature flags object
   */
  loadFeatureFlags() {
    return {
      // Core features
      ENABLE_FILE_UPLOAD: this.getBooleanEnvVar('VITE_FEATURE_FILE_UPLOAD', true),
      ENABLE_SEARCH: this.getBooleanEnvVar('VITE_FEATURE_SEARCH', true),
      ENABLE_FILTERING: this.getBooleanEnvVar('VITE_FEATURE_FILTERING', true),
      ENABLE_NAVIGATION: this.getBooleanEnvVar('VITE_FEATURE_NAVIGATION', true),
      
      // Advanced features
      ENABLE_VIRTUAL_SCROLLING: this.getBooleanEnvVar('VITE_FEATURE_VIRTUAL_SCROLLING', true),
      ENABLE_SYNTAX_HIGHLIGHTING: this.getBooleanEnvVar('VITE_FEATURE_SYNTAX_HIGHLIGHTING', true),
      ENABLE_MESSAGE_CACHING: this.getBooleanEnvVar('VITE_FEATURE_MESSAGE_CACHING', true),
      ENABLE_PERFORMANCE_METRICS: this.getBooleanEnvVar('VITE_FEATURE_PERFORMANCE_METRICS', this.environment !== 'production'),
      
      // UI/UX features
      ENABLE_DARK_MODE: this.getBooleanEnvVar('VITE_FEATURE_DARK_MODE', true),
      ENABLE_KEYBOARD_SHORTCUTS: this.getBooleanEnvVar('VITE_FEATURE_KEYBOARD_SHORTCUTS', true),
      ENABLE_DRAG_DROP: this.getBooleanEnvVar('VITE_FEATURE_DRAG_DROP', true),
      ENABLE_RESPONSIVE_DESIGN: this.getBooleanEnvVar('VITE_FEATURE_RESPONSIVE_DESIGN', true),
      
      // Experimental features
      ENABLE_EXPORT_FUNCTIONALITY: this.getBooleanEnvVar('VITE_FEATURE_EXPORT', false),
      ENABLE_MESSAGE_ANALYTICS: this.getBooleanEnvVar('VITE_FEATURE_MESSAGE_ANALYTICS', false),
      ENABLE_COLLABORATIVE_FEATURES: this.getBooleanEnvVar('VITE_FEATURE_COLLABORATIVE', false),
      
      // Debug and development features
      ENABLE_PERFORMANCE_OVERLAY: this.getBooleanEnvVar('VITE_FEATURE_PERFORMANCE_OVERLAY', this.environment === 'development'),
      ENABLE_STATE_INSPECTOR: this.getBooleanEnvVar('VITE_FEATURE_STATE_INSPECTOR', this.environment === 'development'),
      ENABLE_MOCK_DATA: this.getBooleanEnvVar('VITE_FEATURE_MOCK_DATA', this.environment === 'development')
    }
  }

  /**
   * Get environment variable with fallback
   * @param {string} key - Environment variable key
   * @param {any} defaultValue - Default value if not found
   * @returns {string} Environment variable value or default
   */
  getEnvVar(key, defaultValue = null) {
    let value = defaultValue
    
    // Check Vite environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      if (key in import.meta.env) {
        value = import.meta.env[key]
      }
    }
    
    // Check process environment variables
    if (typeof process !== 'undefined' && process.env) {
      if (key in process.env) {
        value = process.env[key]
      }
    }
    
    return value
  }

  /**
   * Get boolean environment variable
   * @param {string} key - Environment variable key
   * @param {boolean} defaultValue - Default boolean value
   * @returns {boolean} Boolean value
   */
  getBooleanEnvVar(key, defaultValue = false) {
    const value = this.getEnvVar(key, defaultValue.toString())
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const lower = value.toLowerCase()
      return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on'
    }
    return Boolean(value)
  }

  /**
   * Get number environment variable
   * @param {string} key - Environment variable key
   * @param {number} defaultValue - Default number value
   * @returns {number} Number value
   */
  getNumberEnvVar(key, defaultValue = 0) {
    const value = this.getEnvVar(key, defaultValue.toString())
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }

  /**
   * Get array environment variable (comma-separated)
   * @param {string} key - Environment variable key
   * @param {Array} defaultValue - Default array value
   * @returns {Array} Array value
   */
  getArrayEnvVar(key, defaultValue = []) {
    const value = this.getEnvVar(key, null)
    if (!value) return defaultValue
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0)
    }
    return Array.isArray(value) ? value : defaultValue
  }

  /**
   * Validate configuration for required values and consistency
   * @returns {ValidationResult} Validation result
   */
  validateConfiguration() {
    const errors = []
    const warnings = []
    
    try {
      // Validate required configurations
      if (!this.config.APP_NAME || this.config.APP_NAME.trim() === '') {
        warnings.push('APP_NAME is empty or not set')
      }
      
      if (!this.config.APP_VERSION || this.config.APP_VERSION.trim() === '') {
        warnings.push('APP_VERSION is empty or not set')
      }
      
      // Validate file size limits
      if (this.config.MAX_FILE_SIZE <= 0) {
        errors.push('MAX_FILE_SIZE must be greater than 0')
      }
      
      if (this.config.MAX_FILE_SIZE > 100 * 1024 * 1024) { // 100MB
        warnings.push('MAX_FILE_SIZE is very large (>100MB), this may cause performance issues')
      }
      
      // Validate cache configuration
      if (this.config.CACHE_SIZE < 100) {
        warnings.push('CACHE_SIZE is very small (<100), this may impact performance')
      }
      
      if (this.config.CACHE_SIZE > 10000) {
        warnings.push('CACHE_SIZE is very large (>10000), this may impact memory usage')
      }
      
      // Validate timeouts
      if (this.config.UPLOAD_TIMEOUT < 1000) {
        warnings.push('UPLOAD_TIMEOUT is very short (<1s), uploads may fail frequently')
      }
      
      // Validate debounce delay
      if (this.config.DEBOUNCE_DELAY < 100) {
        warnings.push('DEBOUNCE_DELAY is very short (<100ms), this may impact performance')
      }
      
      // Validate environment consistency
      if (this.config.IS_PRODUCTION && this.config.ENABLE_DEBUG_LOGS) {
        warnings.push('Debug logs are enabled in production environment')
      }
      
      if (this.config.IS_DEVELOPMENT && !this.config.SOURCE_MAPS) {
        warnings.push('Source maps are disabled in development environment')
      }
      
      // Validate feature flag consistency
      if (this.featureFlags.ENABLE_PERFORMANCE_METRICS && this.config.IS_PRODUCTION) {
        warnings.push('Performance metrics are enabled in production, this may impact performance')
      }
      
      if (!this.featureFlags.ENABLE_FILE_UPLOAD && !this.featureFlags.ENABLE_MOCK_DATA) {
        errors.push('File upload is disabled but no mock data is available, application may not function')
      }
      
      this.validated = true
      
      const result = {
        valid: errors.length === 0,
        errors,
        warnings,
        summary: {
          totalErrors: errors.length,
          totalWarnings: warnings.length,
          environment: this.environment,
          configurationKeys: Object.keys(this.config).length,
          featureFlagKeys: Object.keys(this.featureFlags).length
        }
      }
      
      logger.debug('Configuration validation completed', {
        component: 'ConfigurationManager',
        valid: result.valid,
        errorCount: errors.length,
        warningCount: warnings.length
      })
      
      if (errors.length > 0) {
        logger.error('Configuration validation failed', {
          component: 'ConfigurationManager',
          errors
        })
      }
      
      if (warnings.length > 0) {
        logger.warn('Configuration validation warnings', {
          component: 'ConfigurationManager',
          warnings
        })
      }
      
      return result
      
    } catch (error) {
      logger.error('Configuration validation error', {
        component: 'ConfigurationManager',
        error
      })
      
      return {
        valid: false,
        errors: [`Configuration validation failed: ${error.message}`],
        warnings: [],
        summary: {
          totalErrors: 1,
          totalWarnings: 0,
          validationError: true
        }
      }
    }
  }

  /**
   * Get configuration value by key with optional default
   * @param {string} key - Configuration key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Configuration value
   */
  get(key, defaultValue = null) {
    if (key in this.config) {
      return this.config[key]
    }
    return defaultValue
  }

  /**
   * Check if a feature flag is enabled
   * @param {string} flag - Feature flag name
   * @returns {boolean} Whether the feature is enabled
   */
  isFeatureEnabled(flag) {
    return Boolean(this.featureFlags[flag])
  }

  /**
   * Get all feature flags
   * @returns {object} All feature flags
   */
  getFeatureFlags() {
    return { ...this.featureFlags }
  }

  /**
   * Get all configuration
   * @returns {object} All configuration
   */
  getConfiguration() {
    return { ...this.config }
  }

  /**
   * Check if running in production environment
   * @returns {boolean} Whether in production
   */
  isProduction() {
    return this.config.IS_PRODUCTION
  }

  /**
   * Check if running in development environment
   * @returns {boolean} Whether in development
   */
  isDevelopment() {
    return this.config.IS_DEVELOPMENT
  }

  /**
   * Check if running in test environment
   * @returns {boolean} Whether in test
   */
  isTest() {
    return this.config.IS_TEST
  }

  /**
   * Get environment name
   * @returns {string} Environment name
   */
  getEnvironment() {
    return this.environment
  }

  /**
   * Get configuration summary for debugging
   * @returns {object} Configuration summary
   */
  getSummary() {
    return {
      environment: this.environment,
      validated: this.validated,
      configurationCount: Object.keys(this.config).length,
      featureFlagCount: Object.keys(this.featureFlags).length,
      isProduction: this.isProduction(),
      isDevelopment: this.isDevelopment(),
      isTest: this.isTest(),
      key_features: {
        debugLogsEnabled: this.config.ENABLE_DEBUG_LOGS,
        performanceMonitoring: this.config.ENABLE_PERFORMANCE_MONITORING,
        contentSecurity: this.config.ENABLE_CONTENT_SECURITY,
        fileUpload: this.featureFlags.ENABLE_FILE_UPLOAD,
        virtualScrolling: this.featureFlags.ENABLE_VIRTUAL_SCROLLING
      }
    }
  }

  /**
   * Override configuration value (useful for testing)
   * @param {string} key - Configuration key
   * @param {any} value - New value
   */
  override(key, value) {
    if (this.isDevelopment() || this.isTest()) {
      this.config[key] = value
      logger.debug('Configuration overridden', {
        component: 'ConfigurationManager',
        key,
        value
      })
    } else {
      logger.warn('Configuration override attempted in production', {
        component: 'ConfigurationManager',
        key
      })
    }
  }

  /**
   * Reset configuration to defaults (useful for testing)
   */
  reset() {
    if (this.isDevelopment() || this.isTest()) {
      this.config = this.loadConfiguration()
      this.featureFlags = this.loadFeatureFlags()
      this.validated = false
      logger.debug('Configuration reset to defaults', {
        component: 'ConfigurationManager'
      })
    }
  }
}

// Create singleton instance
export const configManager = new ConfigurationManager()

// Export default
export default configManager