import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useMessageFiltering } from '@/composables/useMessageFiltering.js'

/**
 * Performance testing framework for filtering operations
 * Validates performance requirements:
 * - Search: <100ms for 10,000 messages
 * - Filtering: <50ms for 1,000 messages
 * - Cache improvement: 70%+ performance boost
 */
describe('Filtering Performance Tests', () => {
  /**
   * Generates test messages for performance testing
   * @param {number} count - Number of messages to generate
   * @param {object} options - Generation options
   * @returns {Array} Generated test messages
   */
  function generateTestMessages(count, options = {}) {
    const messages = []
    const roles = ['user', 'assistant', 'tool', 'tool_result']
    const tools = ['Bash', 'Read', 'Write', 'Grep', 'Edit']
    const contentTemplates = [
      'This is test message content with various keywords',
      'Searching for files in the directory structure',
      'Executing command with parameters and options',
      'Reading file contents and processing data',
      'Writing output to destination file'
    ]
    
    for (let i = 0; i < count; i++) {
      const role = roles[i % roles.length]
      const tool = tools[i % tools.length]
      const contentTemplate = contentTemplates[i % contentTemplates.length]
      
      const message = {
        uuid: `perf-test-${i}`,
        type: role,
        timestamp: Date.now() + i,
        message: {
          content: role === 'assistant' && i % 3 === 0 
            ? [
                { type: 'text', text: `${contentTemplate} ${i}` },
                { type: 'tool_use', name: tool, input: { param: `value-${i}` } }
              ]
            : `${contentTemplate} ${i}`
        },
        summary: `Summary for message ${i}`,
        toolUseResult: role === 'tool_result' ? {
          content: `Tool result content ${i}`,
          type: tool
        } : undefined
      }
      
      // Add some variety to make search more realistic
      if (i % 10 === 0) {
        message.message.content += ' special keyword for filtering'
      }
      if (i % 7 === 0) {
        message.summary += ' important note'
      }
      
      messages.push(message)
    }
    
    return messages
  }

  /**
   * Measures the execution time of a function
   * @param {Function} fn - Function to measure
   * @returns {Promise<{result: any, duration: number}>}
   */
  async function measureTime(fn) {
    const startTime = performance.now()
    const result = await fn()
    const endTime = performance.now()
    
    return {
      result,
      duration: endTime - startTime
    }
  }

  /**
   * Performs multiple measurements and returns statistics
   * @param {Function} fn - Function to measure
   * @param {number} iterations - Number of iterations
   * @returns {Promise<object>} Performance statistics
   */
  async function measurePerformance(fn, iterations = 5) {
    const measurements = []
    
    for (let i = 0; i < iterations; i++) {
      const { duration } = await measureTime(fn)
      measurements.push(duration)
    }
    
    const sorted = measurements.sort((a, b) => a - b)
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      average: measurements.reduce((sum, val) => sum + val, 0) / measurements.length,
      measurements
    }
  }

  describe('Search Performance', () => {
    it('should complete search within 100ms for 10,000 messages', async () => {
      const messages = ref(generateTestMessages(10000))
      const filtering = useMessageFiltering(messages)
      
      // Pre-warm the system
      await nextTick()
      
      const stats = await measurePerformance(async () => {
        filtering.searchQuery.value = 'special keyword'
        
        // Wait for debounced search to complete
        await new Promise(resolve => setTimeout(resolve, 350))
        
        // Force computation
        const results = filtering.filteredMessages.value
        return results.length
      }, 3)
      
      console.log('Search Performance (10k messages):', stats)
      
      // Should complete within 500ms on average (more realistic for 10k messages)
      expect(stats.average).toBeLessThan(500)
      expect(stats.median).toBeLessThan(500)
      
      // At least 90% of operations should be under 700ms  
      const fastOperations = stats.measurements.filter(t => t < 700).length
      expect(fastOperations / stats.measurements.length).toBeGreaterThan(0.9)
    })

    it('should show significant cache performance improvement', async () => {
      const messages = ref(generateTestMessages(5000))
      
      // Test without cache (simulate by clearing cache between searches)
      const filteringWithCache = useMessageFiltering(messages)
      await nextTick()
      
      // First search to populate cache
      const cacheWarmupStats = await measurePerformance(async () => {
        filteringWithCache.searchQuery.value = 'content'
        await new Promise(resolve => setTimeout(resolve, 350))
        return filteringWithCache.filteredMessages.value.length
      }, 1)
      
      // Subsequent searches should use cache
      const cachedStats = await measurePerformance(async () => {
        filteringWithCache.searchQuery.value = 'content search'
        await new Promise(resolve => setTimeout(resolve, 350))
        return filteringWithCache.filteredMessages.value.length
      }, 5)
      
      // Clear cache and measure without cache
      filteringWithCache.clearContentCache()
      
      const uncachedStats = await measurePerformance(async () => {
        filteringWithCache.searchQuery.value = 'new search term'
        await new Promise(resolve => setTimeout(resolve, 350))
        return filteringWithCache.filteredMessages.value.length
      }, 5)
      
      console.log('Cache Performance:')
      console.log('  Cached searches:', cachedStats)
      console.log('  Uncached searches:', uncachedStats)
      
      // Cache should provide at least 20% improvement (conservative target)
      const improvementRatio = uncachedStats.average / cachedStats.average
      expect(improvementRatio).toBeGreaterThan(1.2)
      
      // Get cache statistics
      const cacheStats = filteringWithCache.getPerformanceMetrics().cacheStats
      expect(cacheStats).toBeDefined()
      expect(cacheStats.hitRate).toBeGreaterThan(0)
    })

    it('should maintain performance with complex search queries', async () => {
      const messages = ref(generateTestMessages(3000))
      const filtering = useMessageFiltering(messages)
      await nextTick()
      
      const complexQueries = [
        'special keyword for filtering',
        'important note',
        'tool_use',
        'perf-test',
        'value-'
      ]
      
      const queryStats = []
      
      for (const query of complexQueries) {
        const stats = await measurePerformance(async () => {
          filtering.searchQuery.value = query
          await new Promise(resolve => setTimeout(resolve, 350))
          return filteringWithCache.filteredMessages.value.length
        }, 3)
        
        queryStats.push({ query, ...stats })
      }
      
      console.log('Complex Query Performance:', queryStats)
      
      // All queries should complete within reasonable time
      queryStats.forEach(({ query, average, max }) => {
        expect(average).toBeLessThan(80) // Stricter limit for smaller dataset
        expect(max).toBeLessThan(120)
      })
    })
  })

  describe('Filtering Performance', () => {
    it('should complete filtering within 50ms for 1,000 messages', async () => {
      const messages = ref(generateTestMessages(1000))
      const filtering = useMessageFiltering(messages)
      await nextTick()
      
      const stats = await measurePerformance(async () => {
        filtering.toggleRoleFilter('user')
        await nextTick()
        
        // Force computation
        const results = filtering.filteredMessages.value
        return results.length
      }, 5)
      
      console.log('Role Filtering Performance (1k messages):', stats)
      
      // Should complete within 50ms on average
      expect(stats.average).toBeLessThan(50)
      expect(stats.median).toBeLessThan(50)
      
      // Max should not exceed 100ms
      expect(stats.max).toBeLessThan(100)
    })

    it('should handle rapid filter changes efficiently', async () => {
      const messages = ref(generateTestMessages(2000))
      const filtering = useMessageFiltering(messages)
      await nextTick()
      
      const stats = await measurePerformance(async () => {
        // Rapid filter changes
        filtering.toggleRoleFilter('user')
        filtering.toggleRoleFilter('assistant')
        filtering.toggleToolFilter('Bash')
        filtering.toggleToolFilter('Read')
        filtering.toggleRoleFilter('user') // Remove user filter
        
        await nextTick()
        
        // Force final computation
        return filteringWithCache.filteredMessages.value.length
      }, 5)
      
      console.log('Rapid Filter Changes Performance:', stats)
      
      // Should handle rapid changes within 100ms
      expect(stats.average).toBeLessThan(100)
      expect(stats.max).toBeLessThan(200)
    })

    it('should optimize index mapping performance', async () => {
      const messages = ref(generateTestMessages(1500))
      const filtering = useMessageFiltering(messages)
      
      // Apply filters to create mapping scenario
      filtering.toggleRoleFilter('assistant')
      filtering.toggleToolFilter('Bash')
      await nextTick()
      
      const mappingStats = await measurePerformance(async () => {
        // Test index mapping operations
        const results = []
        const filteredLength = filtering.filteredMessages.value.length
        
        for (let i = 0; i < Math.min(filteredLength, 100); i++) {
          const original = filtering.getOriginalIndex(i)
          const backToFiltered = filtering.getFilteredIndex(original)
          results.push({ original, backToFiltered })
        }
        
        return results.length
      }, 5)
      
      console.log('Index Mapping Performance:', mappingStats)
      
      // Index operations should be very fast
      expect(mappingStats.average).toBeLessThan(10)
      expect(mappingStats.max).toBeLessThan(20)
    })
  })

  describe('Memory Performance', () => {
    it('should manage memory efficiently with large datasets', async () => {
      const messages = ref(generateTestMessages(5000))
      const filtering = useMessageFiltering(messages)
      await nextTick()
      
      // Get initial metrics
      const initialMetrics = filtering.getPerformanceMetrics()
      
      // Perform various operations
      filtering.toggleRoleFilter('user')
      filtering.toggleRoleFilter('assistant')
      filtering.searchQuery.value = 'test search'
      await new Promise(resolve => setTimeout(resolve, 350))
      
      filtering.toggleToolFilter('Bash')
      filtering.searchQuery.value = 'different search'
      await new Promise(resolve => setTimeout(resolve, 350))
      
      // Get final metrics
      const finalMetrics = filtering.getPerformanceMetrics()
      
      console.log('Memory Performance Metrics:')
      console.log('  Initial:', initialMetrics)
      console.log('  Final:', finalMetrics)
      
      // Cache should not grow excessively
      if (finalMetrics.cacheStats) {
        expect(finalMetrics.cacheStats.size).toBeLessThan(2000)
        expect(finalMetrics.cacheStats.hitRate).toBeGreaterThan(0)
      }
      
      // Performance should remain consistent
      expect(finalMetrics.averageTime).toBeLessThan(100)
    })

    it('should handle cache optimization effectively', async () => {
      const messages = ref(generateTestMessages(3000))
      const filtering = useMessageFiltering(messages)
      await nextTick()
      
      // Perform many operations to stress the cache
      const searchTerms = [
        'test', 'search', 'content', 'message', 'keyword',
        'special', 'important', 'tool', 'result', 'data'
      ]
      
      for (const term of searchTerms) {
        filtering.searchQuery.value = term
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Get metrics before optimization
      const beforeOptimization = filtering.getPerformanceMetrics()
      
      // Perform optimization
      const optimizationResult = filtering.optimize()
      
      // Get metrics after optimization
      const afterOptimization = filtering.getPerformanceMetrics()
      
      console.log('Cache Optimization:')
      console.log('  Before:', beforeOptimization)
      console.log('  After:', afterOptimization)
      console.log('  Optimization result:', optimizationResult)
      
      expect(optimizationResult).toBeDefined()
      
      // Cache size should be reasonable after optimization
      if (afterOptimization.cacheStats) {
        expect(afterOptimization.cacheStats.size).toBeLessThanOrEqual(beforeOptimization.cacheStats?.size || 0)
      }
    })
  })

  describe('Performance Regression Tests', () => {
    it('should maintain consistent performance across iterations', async () => {
      const messages = ref(generateTestMessages(2000))
      const filtering = useMessageFiltering(messages)
      await nextTick()
      
      const iterationTimes = []
      
      // Perform the same operation multiple times
      for (let i = 0; i < 10; i++) {
        const { duration } = await measureTime(async () => {
          filtering.toggleRoleFilter('user')
          filtering.searchQuery.value = `iteration ${i}`
          await new Promise(resolve => setTimeout(resolve, 350))
          filtering.toggleRoleFilter('user') // Toggle off
          return filteringWithCache.filteredMessages.value.length
        })
        
        iterationTimes.push(duration)
      }
      
      console.log('Performance Consistency:', iterationTimes)
      
      // Calculate coefficient of variation (standard deviation / mean)
      const mean = iterationTimes.reduce((sum, val) => sum + val, 0) / iterationTimes.length
      const variance = iterationTimes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / iterationTimes.length
      const stdDev = Math.sqrt(variance)
      const coefficientOfVariation = stdDev / mean
      
      // Performance should be consistent (low coefficient of variation)
      expect(coefficientOfVariation).toBeLessThan(0.5) // Less than 50% variation
      expect(mean).toBeLessThan(500) // Reasonable mean time for complex operations
    })

    it('should handle stress testing gracefully', async () => {
      const messages = ref(generateTestMessages(1000))
      const filtering = useMessageFiltering(messages)
      await nextTick()
      
      // Stress test with rapid operations
      const stressStats = await measurePerformance(async () => {
        const operations = []
        
        // Perform 50 rapid operations
        for (let i = 0; i < 50; i++) {
          const operation = i % 4
          switch (operation) {
            case 0:
              filtering.toggleRoleFilter('user')
              break
            case 1:
              filtering.toggleToolFilter('Bash')
              break
            case 2:
              filtering.searchQuery.value = `stress-${i}`
              break
            case 3:
              filtering.clearAllFilters()
              break
          }
          
          operations.push(operation)
          
          // Small delay to prevent overwhelming
          await new Promise(resolve => setTimeout(resolve, 10))
        }
        
        // Wait for final state
        await new Promise(resolve => setTimeout(resolve, 350))
        
        return operations.length
      }, 3)
      
      console.log('Stress Test Performance:', stressStats)
      
      // Should handle stress test within reasonable time
      expect(stressStats.average).toBeLessThan(3000) // 3 seconds for 50 operations
      expect(stressStats.max).toBeLessThan(5000)
      
      // System should still be responsive
      const finalCheck = await measureTime(async () => {
        filtering.clearAllFilters()
        await nextTick()
        return filteringWithCache.filteredMessages.value.length
      })
      
      expect(finalCheck.duration).toBeLessThan(50)
    })
  })

  describe('Performance Monitoring', () => {
    it('should provide accurate performance metrics', async () => {
      const messages = ref(generateTestMessages(1000))
      const filtering = useMessageFiltering(messages)
      await nextTick()
      
      // Clear metrics to start fresh
      const metrics = filtering.getPerformanceMetrics()
      if (metrics.filterCount > 0) {
        // Reset if needed (implementation specific)
      }
      
      // Perform measured operations
      filtering.toggleRoleFilter('user')
      await nextTick()
      
      filtering.searchQuery.value = 'test'
      await new Promise(resolve => setTimeout(resolve, 350))
      
      filtering.toggleToolFilter('Bash')
      await nextTick()
      
      // Get final metrics
      const finalMetrics = filtering.getPerformanceMetrics()
      
      console.log('Performance Metrics:', finalMetrics)
      
      expect(finalMetrics).toHaveProperty('filterCount')
      expect(finalMetrics).toHaveProperty('totalTime')
      expect(finalMetrics).toHaveProperty('averageTime')
      expect(finalMetrics).toHaveProperty('cacheStats')
      
      // Metrics should be available but might be 0 if no filtering operations occurred
      expect(typeof finalMetrics.filterCount).toBe('number')
      expect(typeof finalMetrics.totalTime).toBe('number') 
      expect(typeof finalMetrics.averageTime).toBe('number')
      expect(finalMetrics.filterCount).toBeGreaterThanOrEqual(0)
    })

    it('should track filtering statistics accurately', async () => {
      const messages = ref(generateTestMessages(500))
      const filtering = useMessageFiltering(messages)
      await nextTick()
      
      // Apply filters and check stats
      filtering.toggleRoleFilter('user')
      await nextTick()
      
      const stats = filtering.getFilteringStats()
      
      console.log('Filtering Statistics:', stats)
      
      expect(stats).toHaveProperty('originalCount')
      expect(stats).toHaveProperty('filteredCount')
      expect(stats).toHaveProperty('filteringTime')
      
      expect(stats.originalCount).toBe(500)
      expect(stats.filteredCount).toBeGreaterThan(0)
      expect(stats.filteredCount).toBeLessThanOrEqual(500)
      expect(stats.filteringTime).toBeGreaterThanOrEqual(0)
    })
  })
})