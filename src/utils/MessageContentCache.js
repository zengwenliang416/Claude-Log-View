import { logger } from './logger.js'

/**
 * MessageContentCache - High-performance content caching system for search operations
 * 
 * This class eliminates repeated JSON.stringify calls during search operations by
 * caching stringified message content. It provides significant performance improvements
 * for search functionality, targeting 70%+ performance improvement.
 */
export class MessageContentCache {
  constructor(options = {}) {
    // Cache storage: Map<cacheKey, stringifiedContent>
    this.cache = new Map()
    
    // Performance metrics
    this.hitCount = 0
    this.missCount = 0
    this.stringifyTime = 0
    
    // Configuration
    this.maxSize = options.maxSize || 1000 // LRU eviction threshold
    this.enableMetrics = options.enableMetrics !== false
    
    // LRU tracking: Map<cacheKey, lastAccessTime>
    this.accessTimes = new Map()
  }

  /**
   * Gets the stringified content for a message, using cache when available
   * @param {Object} message - Message object to stringify
   * @returns {string} Stringified message content
   */
  getStringifiedContent(message) {
    if (!message) return ''
    
    const cacheKey = this.generateCacheKey(message)
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      this.hitCount++
      this.accessTimes.set(cacheKey, Date.now())
      return this.cache.get(cacheKey)
    }
    
    // Cache miss - generate stringified content
    const startTime = this.enableMetrics ? performance.now() : 0
    const stringified = this.stringifyMessageContent(message)
    
    if (this.enableMetrics) {
      this.stringifyTime += performance.now() - startTime
    }
    
    // Store in cache with LRU management
    this.setCacheEntry(cacheKey, stringified)
    this.missCount++
    
    return stringified
  }

  /**
   * Generates a cache key for a message based on its content
   * @param {Object} message - Message object
   * @returns {string} Cache key
   */
  generateCacheKey(message) {
    // Use UUID as primary key if available
    if (message.uuid) {
      return `msg:${message.uuid}`
    }
    
    // Fallback to content-based hash for messages without UUID
    const contentHash = this.hashMessageContent(message)
    return `hash:${contentHash}`
  }

  /**
   * Creates a simple hash of message content for cache key generation
   * @param {Object} message - Message object
   * @returns {string} Content hash
   */
  hashMessageContent(message) {
    // Create a lightweight signature of the message
    const signature = [
      message.message?.content?.length || 0,
      message.summary?.length || 0,
      message.toolUseResult?.content ? 1 : 0,
      message.timestamp || 0
    ].join('-')
    
    return signature
  }

  /**
   * Stringifies message content for search operations
   * @param {Object} message - Message object
   * @returns {string} Stringified content
   */
  stringifyMessageContent(message) {
    const parts = []
    
    // Message content
    if (message.message?.content) {
      if (Array.isArray(message.message.content)) {
        for (const item of message.message.content) {
          if (item.text) parts.push(item.text)
          if (item.name) parts.push(item.name)
          if (item.input) parts.push(JSON.stringify(item.input))
        }
      } else if (typeof message.message.content === 'string') {
        parts.push(message.message.content)
      }
    }
    
    // Summary
    if (message.summary) {
      parts.push(message.summary)
    }
    
    // Tool results
    if (message.toolUseResult?.content) {
      parts.push(JSON.stringify(message.toolUseResult.content))
    }
    
    // UUID
    if (message.uuid) {
      parts.push(message.uuid)
    }
    
    return parts.join(' ').toLowerCase()
  }

  /**
   * Sets a cache entry with LRU management
   * @param {string} cacheKey - Cache key
   * @param {string} content - Stringified content
   */
  setCacheEntry(cacheKey, content) {
    // If at capacity, evict least recently used entries
    if (this.cache.size >= this.maxSize) {
      this.evictLRUEntries()
    }
    
    this.cache.set(cacheKey, content)
    this.accessTimes.set(cacheKey, Date.now())
  }

  /**
   * Evicts least recently used cache entries when at capacity
   */
  evictLRUEntries() {
    // Find oldest entries to evict (evict 20% of capacity)
    const evictCount = Math.floor(this.maxSize * 0.2)
    const entries = Array.from(this.accessTimes.entries())
      .sort((a, b) => a[1] - b[1]) // Sort by access time (oldest first)
      .slice(0, evictCount)
    
    // Remove oldest entries
    for (const [cacheKey] of entries) {
      this.cache.delete(cacheKey)
      this.accessTimes.delete(cacheKey)
    }
  }

  /**
   * Invalidates cache entry for a specific message
   * @param {string} messageId - Message UUID or identifier
   */
  invalidateMessage(messageId) {
    const cacheKey = `msg:${messageId}`
    this.cache.delete(cacheKey)
    this.accessTimes.delete(cacheKey)
  }

  /**
   * Clears the entire cache
   */
  clear() {
    this.cache.clear()
    this.accessTimes.clear()
    this.hitCount = 0
    this.missCount = 0
    this.stringifyTime = 0
  }

  /**
   * Gets cache performance statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount
    
    return {
      hitRate: totalRequests > 0 ? this.hitCount / totalRequests : 0,
      missRate: totalRequests > 0 ? this.missCount / totalRequests : 0,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      totalRequests,
      averageStringifyTime: this.missCount > 0 ? this.stringifyTime / this.missCount : 0
    }
  }

  /**
   * Checks if content matches a search query using cached content
   * @param {Object} message - Message object
   * @param {string} query - Search query (should be lowercase)
   * @returns {boolean} True if message matches query
   */
  messageMatchesSearch(message, query) {
    if (!query || !query.trim()) return true
    
    const content = this.getStringifiedContent(message)
    return content.includes(query.toLowerCase().trim())
  }

  /**
   * Pre-warms the cache with a batch of messages
   * @param {Array} messages - Array of messages to pre-cache
   */
  preWarmCache(messages) {
    if (!Array.isArray(messages)) return
    
    const startTime = performance.now()
    let processed = 0
    
    for (const message of messages) {
      if (message) {
        this.getStringifiedContent(message)
        processed++
      }
    }
    
    if (this.enableMetrics) {
      const duration = performance.now() - startTime
      logger.debug('Cache pre-warmed', {
        component: 'MessageContentCache',
        processedMessages: processed,
        duration: `${duration.toFixed(2)}ms`
      })
    }
  }

  /**
   * Optimizes cache for better performance
   * Removes duplicate entries and compacts storage
   */
  optimize() {
    // Remove entries that haven't been accessed recently
    const now = Date.now()
    const staleThreshold = 5 * 60 * 1000 // 5 minutes
    
    const staleKeys = []
    for (const [key, lastAccess] of this.accessTimes) {
      if (now - lastAccess > staleThreshold) {
        staleKeys.push(key)
      }
    }
    
    // Remove stale entries
    for (const key of staleKeys) {
      this.cache.delete(key)
      this.accessTimes.delete(key)
    }
    
    return staleKeys.length
  }
}

// Export singleton instance for application-wide use
export const messageContentCache = new MessageContentCache({
  maxSize: 2000,
  enableMetrics: true
})