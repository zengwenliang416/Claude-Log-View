import { getMessageRole, getMessageToolNames } from '@/utils/messageTypes.js'

/**
 * FilteringEngine - Centralized filtering logic to eliminate code duplication
 * 
 * This class provides a single source of truth for message filtering decisions,
 * eliminating duplication between filteredMessages and index mapping computations.
 * It processes messages in a single pass to optimize performance.
 */
export class FilteringEngine {
  constructor(contentCache) {
    this.contentCache = contentCache
    this.performanceMetrics = {
      filterCount: 0,
      totalTime: 0,
      averageTime: 0
    }
  }

  /**
   * Determines if a message should be included based on current filters
   * @param {Object} message - Message to evaluate
   * @param {Object} filters - Current filter state
   * @returns {boolean} True if message should be included
   */
  shouldIncludeMessage(message, filters) {
    if (!message) return false

    try {
      // Role filtering
      if (filters.roles && filters.roles.size > 0) {
        const role = getMessageRole(message)
        if (!filters.roles.has(role)) {
          return false
        }
      }

      // Tool filtering
      if (filters.tools && filters.tools.size > 0) {
        const tools = getMessageToolNames(message)
        if (!tools.some(tool => filters.tools.has(tool))) {
          return false
        }
      }

      // Search filtering (with caching for performance)
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim()
        if (!this.contentCache.messageMatchesSearch(message, query)) {
          return false
        }
      }

      return true
    } catch (error) {
      console.warn('Error in shouldIncludeMessage:', error)
      return false // Exclude message on error to maintain stability
    }
  }

  /**
   * Processes messages to generate filtered results and index mappings in single pass
   * @param {Array} messages - Original messages array
   * @param {Object} filters - Current filter state
   * @returns {Object} Filtering results with messages and mappings
   */
  processMessages(messages, filters) {
    const startTime = performance.now()
    
    try {
      // Initialize results
      const result = {
        filteredMessages: [],
        filteredToOriginalMap: new Map(),
        originalToFilteredMap: new Map(),
        stats: {
          originalCount: 0,
          filteredCount: 0,
          filteringTime: 0
        }
      }

      // Handle empty or invalid input
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        result.stats.filteringTime = performance.now() - startTime
        return result
      }

      result.stats.originalCount = messages.length
      let filteredIndex = 0

      // Single pass through messages to build both filtered array and mappings
      for (let originalIndex = 0; originalIndex < messages.length; originalIndex++) {
        const message = messages[originalIndex]

        if (this.shouldIncludeMessage(message, filters)) {
          // Add to filtered results
          result.filteredMessages.push(message)
          
          // Build index mappings
          result.filteredToOriginalMap.set(filteredIndex, originalIndex)
          result.originalToFilteredMap.set(originalIndex, filteredIndex)
          
          filteredIndex++
        }
      }

      // Update statistics
      result.stats.filteredCount = filteredIndex
      result.stats.filteringTime = performance.now() - startTime

      // Update performance metrics
      this.updatePerformanceMetrics(result.stats.filteringTime)

      return result
    } catch (error) {
      console.error('Error in processMessages:', error)
      
      // Return empty results on error
      return {
        filteredMessages: [],
        filteredToOriginalMap: new Map(),
        originalToFilteredMap: new Map(),
        stats: {
          originalCount: messages?.length || 0,
          filteredCount: 0,
          filteringTime: performance.now() - startTime,
          error: error.message
        }
      }
    }
  }

  /**
   * Creates a filter state object from individual filter components
   * @param {Set} roleFilters - Active role filters
   * @param {Set} toolFilters - Active tool filters  
   * @param {string} searchQuery - Current search query
   * @returns {Object} Combined filter state
   */
  createFilterState(roleFilters, toolFilters, searchQuery) {
    return {
      roles: roleFilters,
      tools: toolFilters,
      searchQuery: searchQuery
    }
  }

  /**
   * Checks if any filters are currently active
   * @param {Object} filters - Filter state to check
   * @returns {boolean} True if any filters are active
   */
  hasActiveFilters(filters) {
    return (filters.roles && filters.roles.size > 0) ||
           (filters.tools && filters.tools.size > 0) ||
           (filters.searchQuery && filters.searchQuery.trim())
  }

  /**
   * Updates internal performance metrics
   * @param {number} filteringTime - Time taken for last filtering operation
   */
  updatePerformanceMetrics(filteringTime) {
    this.performanceMetrics.filterCount++
    this.performanceMetrics.totalTime += filteringTime
    this.performanceMetrics.averageTime = 
      this.performanceMetrics.totalTime / this.performanceMetrics.filterCount
  }

  /**
   * Gets current performance metrics
   * @returns {Object} Performance statistics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheStats: this.contentCache?.getStats() || null
    }
  }

  /**
   * Resets performance metrics
   */
  resetMetrics() {
    this.performanceMetrics = {
      filterCount: 0,
      totalTime: 0,
      averageTime: 0
    }
  }

  /**
   * Validates filter state for consistency
   * @param {Object} filters - Filter state to validate
   * @returns {Object} Validation result with any fixes applied
   */
  validateAndFixFilters(filters) {
    const validatedFilters = {
      roles: filters.roles instanceof Set ? filters.roles : new Set(),
      tools: filters.tools instanceof Set ? filters.tools : new Set(),
      searchQuery: typeof filters.searchQuery === 'string' ? filters.searchQuery : ''
    }

    return {
      filters: validatedFilters,
      wasFixed: filters.roles !== validatedFilters.roles ||
                filters.tools !== validatedFilters.tools ||
                filters.searchQuery !== validatedFilters.searchQuery
    }
  }

  /**
   * Pre-warms the content cache with a batch of messages
   * @param {Array} messages - Messages to pre-cache
   */
  preWarmCache(messages) {
    if (this.contentCache && this.contentCache.preWarmCache) {
      this.contentCache.preWarmCache(messages)
    }
  }

  /**
   * Optimizes internal caches and performance structures
   * @returns {Object} Optimization results
   */
  optimize() {
    const results = {
      metricsReset: false,
      cacheOptimized: false,
      cacheEntriesRemoved: 0
    }

    // Reset metrics if they're getting too large
    if (this.performanceMetrics.filterCount > 10000) {
      this.resetMetrics()
      results.metricsReset = true
    }

    // Optimize content cache
    if (this.contentCache && this.contentCache.optimize) {
      results.cacheEntriesRemoved = this.contentCache.optimize()
      results.cacheOptimized = true
    }

    return results
  }
}

/**
 * Utility functions for filtering operations
 */
export const filteringUtils = {
  /**
   * Creates a debounced version of a filtering function
   * @param {Function} filterFn - Function to debounce
   * @param {number} delay - Debounce delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounceFilter(filterFn, delay = 300) {
    let timeoutId = null
    
    return function(...args) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        filterFn.apply(this, args)
        timeoutId = null
      }, delay)
    }
  },

  /**
   * Creates a filter state snapshot for comparison
   * @param {Object} filters - Current filter state
   * @returns {string} Serialized filter state
   */
  createFilterSnapshot(filters) {
    return JSON.stringify({
      roles: Array.from(filters.roles || []).sort(),
      tools: Array.from(filters.tools || []).sort(),
      searchQuery: filters.searchQuery || ''
    })
  },

  /**
   * Compares two filter states for equality
   * @param {Object} filters1 - First filter state
   * @param {Object} filters2 - Second filter state
   * @returns {boolean} True if filter states are equal
   */
  filtersAreEqual(filters1, filters2) {
    return this.createFilterSnapshot(filters1) === this.createFilterSnapshot(filters2)
  },

  /**
   * Validates message structure for filtering compatibility
   * @param {Object} message - Message to validate
   * @returns {boolean} True if message has required structure
   */
  isValidMessage(message) {
    return message &&
           typeof message === 'object' &&
           (message.message || message.summary || message.uuid)
  },

  /**
   * Sanitizes search query for safe processing
   * @param {string} query - Raw search query
   * @returns {string} Sanitized query
   */
  sanitizeSearchQuery(query) {
    if (typeof query !== 'string') return ''
    
    return query
      .trim()
      .slice(0, 1000) // Limit length to prevent performance issues
      .replace(/[<>]/g, '') // Remove potential HTML/XML tags
  }
}