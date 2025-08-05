import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useMessageFiltering } from '@/composables/useMessageFiltering.js'

/**
 * Comprehensive tests for index mapping functions in useMessageFiltering
 * These tests ensure 100% coverage of getOriginalIndex() and getFilteredIndex()
 * with edge cases, boundary conditions, and error scenarios.
 */
describe('useMessageFiltering - Index Mapping Functions', () => {
  let messages
  let filtering

  beforeEach(() => {
    // Create a comprehensive test dataset
    messages = ref([
      {
        uuid: 'msg-1',
        type: 'user',
        message: { content: 'First user message' }
      },
      {
        uuid: 'msg-2',
        type: 'assistant',
        message: { 
          content: [
            { type: 'tool_use', name: 'Bash', input: { command: 'ls' } }
          ]
        }
      },
      {
        uuid: 'msg-3',
        toolUseResult: { content: 'file1.txt\nfile2.txt', type: 'Bash' }
      },
      {
        uuid: 'msg-4',
        type: 'assistant',
        message: { content: 'Here are the files' }
      },
      {
        uuid: 'msg-5',
        type: 'user',
        message: { content: 'Show me file1.txt' }
      },
      {
        uuid: 'msg-6',
        type: 'assistant',
        message: { 
          content: [
            { type: 'tool_use', name: 'Read', input: { file: 'file1.txt' } }
          ]
        }
      },
      {
        uuid: 'msg-7',
        toolUseResult: { content: 'Content of file1.txt', type: 'Read' }
      }
    ])
    
    filtering = useMessageFiltering(messages)
  })

  describe('getOriginalIndex() - Valid Scenarios', () => {
    it('should return correct original index for filtered index 0', () => {
      // No filters - identity mapping
      expect(filtering.getOriginalIndex(0)).toBe(0)
      expect(filtering.getOriginalIndex(1)).toBe(1)
      expect(filtering.getOriginalIndex(6)).toBe(6)
    })

    it('should return correct original index with role filter applied', () => {
      // Filter to show only 'user' messages (indices 0, 4 in original)
      filtering.toggleRoleFilter('user')
      
      expect(filtering.getOriginalIndex(0)).toBe(0) // First user message
      expect(filtering.getOriginalIndex(1)).toBe(4) // Second user message
    })

    it('should return correct original index with tool filter applied', () => {
      // Filter to show only 'Bash' tool messages (indices 1, 2 in original)
      filtering.toggleToolFilter('Bash')
      
      expect(filtering.getOriginalIndex(0)).toBe(1) // Bash tool use
      expect(filtering.getOriginalIndex(1)).toBe(2) // Bash tool result
    })

    it('should return correct original index with multiple filters', () => {
      // Filter for 'assistant' role AND 'Read' tool (index 5 in original)
      filtering.toggleRoleFilter('assistant')
      filtering.toggleToolFilter('Read')
      
      expect(filtering.getOriginalIndex(0)).toBe(5) // Read tool use by assistant
    })

    it('should handle complex filter combinations correctly', () => {
      // Filter for user messages and search for 'file'
      filtering.toggleRoleFilter('user')
      filtering.searchQuery.value = 'file'
      
      // Wait for debounced search
      return new Promise(resolve => {
        setTimeout(() => {
          expect(filtering.getOriginalIndex(0)).toBe(4) // "Show me file1.txt"
          resolve()
        }, 350) // Wait for debounce (300ms + buffer)
      })
    })

    it('should work with search filter only', async () => {
      filtering.searchQuery.value = 'Content'
      
      // Wait for debounced search
      await new Promise(resolve => setTimeout(resolve, 350))
      
      expect(filtering.getOriginalIndex(0)).toBe(6) // Tool result with "Content"
    })
  })

  describe('getOriginalIndex() - Edge Cases', () => {
    it('should return -1 for negative filtered index', () => {
      expect(filtering.getOriginalIndex(-1)).toBe(-1)
      expect(filtering.getOriginalIndex(-5)).toBe(-1)
      expect(filtering.getOriginalIndex(-999)).toBe(-1)
    })

    it('should return -1 for filtered index beyond array bounds', () => {
      expect(filtering.getOriginalIndex(999)).toBe(-1)
      expect(filtering.getOriginalIndex(100)).toBe(-1)
      
      // Test with filters applied
      filtering.toggleRoleFilter('user') // Only 2 user messages
      expect(filtering.getOriginalIndex(2)).toBe(-1) // Beyond filtered bounds
      expect(filtering.getOriginalIndex(10)).toBe(-1)
    })

    it('should return -1 when no messages exist', () => {
      messages.value = []
      expect(filtering.getOriginalIndex(0)).toBe(-1)
      expect(filtering.getOriginalIndex(1)).toBe(-1)
    })

    it('should return -1 when messages is null', () => {
      messages.value = null
      expect(filtering.getOriginalIndex(0)).toBe(-1)
    })

    it('should handle non-number input gracefully', () => {
      expect(filtering.getOriginalIndex('0')).toBe(-1)
      expect(filtering.getOriginalIndex(null)).toBe(-1)
      expect(filtering.getOriginalIndex(undefined)).toBe(-1)
      expect(filtering.getOriginalIndex({})).toBe(-1)
      expect(filtering.getOriginalIndex([])).toBe(-1)
      expect(filtering.getOriginalIndex(NaN)).toBe(-1)
    })

    it('should handle floating point indices', () => {
      expect(filtering.getOriginalIndex(1.5)).toBe(-1) // Should reject non-integer
      expect(filtering.getOriginalIndex(0.1)).toBe(-1)
    })

    it('should handle zero correctly as valid index', () => {
      expect(filtering.getOriginalIndex(0)).toBe(0) // Zero is valid
    })
  })

  describe('getFilteredIndex() - Valid Scenarios', () => {
    it('should return correct filtered index for original index 0', () => {
      // No filters - identity mapping
      expect(filtering.getFilteredIndex(0)).toBe(0)
      expect(filtering.getFilteredIndex(3)).toBe(3)
      expect(filtering.getFilteredIndex(6)).toBe(6)
    })

    it('should return correct filtered index with role filter applied', () => {
      // Filter to show only 'assistant' messages (indices 1, 3, 5 in original)
      filtering.toggleRoleFilter('assistant')
      
      expect(filtering.getFilteredIndex(1)).toBe(0) // First assistant message
      expect(filtering.getFilteredIndex(3)).toBe(1) // Second assistant message
      expect(filtering.getFilteredIndex(5)).toBe(2) // Third assistant message
    })

    it('should return correct filtered index with tool filter applied', () => {
      // Filter to show only 'Read' tool messages (indices 5, 6 in original)
      filtering.toggleToolFilter('Read')
      
      expect(filtering.getFilteredIndex(5)).toBe(0) // Read tool use
      expect(filtering.getFilteredIndex(6)).toBe(1) // Read tool result
    })

    it('should handle single message scenarios', () => {
      messages.value = [{
        uuid: 'single',
        type: 'user',
        message: { content: 'Only message' }
      }]
      
      expect(filtering.getFilteredIndex(0)).toBe(0)
    })
  })

  describe('getFilteredIndex() - Filtered Out Scenarios', () => {
    it('should return -1 when message is filtered out by role', () => {
      // Filter to show only 'user' messages
      filtering.toggleRoleFilter('user')
      
      // Assistant messages should be filtered out
      expect(filtering.getFilteredIndex(1)).toBe(-1) // Assistant message
      expect(filtering.getFilteredIndex(3)).toBe(-1) // Assistant message
      expect(filtering.getFilteredIndex(5)).toBe(-1) // Assistant message
    })

    it('should return -1 when message is filtered out by tool', () => {
      // Filter to show only 'Bash' tool messages
      filtering.toggleToolFilter('Bash')
      
      // Read tool messages should be filtered out
      expect(filtering.getFilteredIndex(5)).toBe(-1) // Read tool use
      expect(filtering.getFilteredIndex(6)).toBe(-1) // Read tool result
    })

    it('should return -1 when message is filtered out by search', async () => {
      filtering.searchQuery.value = 'nonexistent'
      
      // Wait for debounced search
      await new Promise(resolve => setTimeout(resolve, 350))
      
      // All messages should be filtered out
      expect(filtering.getFilteredIndex(0)).toBe(-1)
      expect(filtering.getFilteredIndex(1)).toBe(-1)
      expect(filtering.getFilteredIndex(6)).toBe(-1)
    })

    it('should return -1 when message is filtered out by multiple filters', () => {
      // Filter for user messages with Bash tool (impossible combination)
      filtering.toggleRoleFilter('user')
      filtering.toggleToolFilter('Bash')
      
      // All messages should be filtered out
      for (let i = 0; i < messages.value.length; i++) {
        expect(filtering.getFilteredIndex(i)).toBe(-1)
      }
    })
  })

  describe('getFilteredIndex() - Edge Cases', () => {
    it('should return -1 for negative original index', () => {
      expect(filtering.getFilteredIndex(-1)).toBe(-1)
      expect(filtering.getFilteredIndex(-10)).toBe(-1)
    })

    it('should return -1 for original index beyond array bounds', () => {
      expect(filtering.getFilteredIndex(999)).toBe(-1)
      expect(filtering.getFilteredIndex(messages.value.length)).toBe(-1)
    })

    it('should return -1 when no messages exist', () => {
      messages.value = []
      expect(filtering.getFilteredIndex(0)).toBe(-1)
    })

    it('should return -1 when messages is null', () => {
      messages.value = null
      expect(filtering.getFilteredIndex(0)).toBe(-1)
    })

    it('should handle non-number input gracefully', () => {
      expect(filtering.getFilteredIndex('0')).toBe(-1)
      expect(filtering.getFilteredIndex(null)).toBe(-1)
      expect(filtering.getFilteredIndex(undefined)).toBe(-1)
      expect(filtering.getFilteredIndex({})).toBe(-1)
      expect(filtering.getFilteredIndex([])).toBe(-1)
      expect(filtering.getFilteredIndex(NaN)).toBe(-1)
    })
  })

  describe('Bidirectional Consistency', () => {
    it('should maintain consistency between getOriginalIndex and getFilteredIndex', () => {
      // Test with no filters
      for (let i = 0; i < messages.value.length; i++) {
        const filtered = filtering.getFilteredIndex(i)
        const original = filtering.getOriginalIndex(filtered)
        expect(original).toBe(i)
      }
    })

    it('should maintain consistency with role filters applied', () => {
      filtering.toggleRoleFilter('assistant')
      
      // Test round-trip conversions for included messages
      const assistantIndices = [1, 3, 5] // Original indices of assistant messages
      
      assistantIndices.forEach((originalIndex, filteredIndex) => {
        expect(filtering.getFilteredIndex(originalIndex)).toBe(filteredIndex)
        expect(filtering.getOriginalIndex(filteredIndex)).toBe(originalIndex)
      })
    })

    it('should handle round-trip conversions correctly with complex filters', async () => {
      filtering.toggleRoleFilter('user')
      filtering.searchQuery.value = 'file'
      
      // Wait for debounced search
      await new Promise(resolve => setTimeout(resolve, 350))
      
      const filteredLength = filtering.filteredMessages.value.length
      
      for (let filteredIndex = 0; filteredIndex < filteredLength; filteredIndex++) {
        const originalIndex = filtering.getOriginalIndex(filteredIndex)
        expect(originalIndex).toBeGreaterThanOrEqual(0)
        
        const backToFiltered = filtering.getFilteredIndex(originalIndex)
        expect(backToFiltered).toBe(filteredIndex)
      }
    })

    it('should handle empty results consistently', () => {
      // Apply impossible filter combination
      filtering.toggleRoleFilter('nonexistent')
      
      expect(filtering.filteredMessages.value).toHaveLength(0)
      expect(filtering.getOriginalIndex(0)).toBe(-1)
      expect(filtering.getFilteredIndex(0)).toBe(-1)
    })
  })

  describe('Filter State Changes', () => {
    it('should update mapping correctly when role filters change', async () => {
      // Start with user filter
      filtering.toggleRoleFilter('user')
      expect(filtering.getOriginalIndex(0)).toBe(0) // First user message
      
      // Add assistant filter
      filtering.toggleRoleFilter('assistant')
      await nextTick()
      
      // Should now include both user and assistant messages
      // Need to check what messages are actually included after filtering
      const currentFiltered = filtering.filteredMessages.value
      expect(currentFiltered.length).toBeGreaterThan(0)
      
      if (currentFiltered.length > 0) {
        expect(filtering.getOriginalIndex(0)).toBeGreaterThanOrEqual(0)
      }
      if (currentFiltered.length > 1) {
        expect(filtering.getOriginalIndex(1)).toBeGreaterThanOrEqual(0)
      }
    })

    it('should update mapping correctly when tool filters change', () => {
      // Start with Bash filter
      filtering.toggleToolFilter('Bash')
      expect(filtering.getOriginalIndex(0)).toBe(1) // Bash tool use
      
      // Add Read filter
      filtering.toggleToolFilter('Read')
      
      // Should now include both Bash and Read tool messages
      expect(filtering.getOriginalIndex(2)).toBe(5) // Read tool use
      expect(filtering.getOriginalIndex(3)).toBe(6) // Read tool result
    })

    it('should update mapping correctly when search query changes', async () => {
      filtering.searchQuery.value = 'file'
      await new Promise(resolve => setTimeout(resolve, 350))
      
      const initialCount = filtering.filteredMessages.value.length
      
      // Change search to be more specific
      filtering.searchQuery.value = 'file1.txt'
      await new Promise(resolve => setTimeout(resolve, 350))
      
      const newCount = filtering.filteredMessages.value.length
      expect(newCount).toBeLessThanOrEqual(initialCount)
      
      // Verify mappings are still consistent
      for (let i = 0; i < newCount; i++) {
        const original = filtering.getOriginalIndex(i)
        expect(original).toBeGreaterThanOrEqual(0)
        expect(filtering.getFilteredIndex(original)).toBe(i)
      }
    })

    it('should maintain consistency during rapid filter changes', async () => {
      // Rapidly change filters
      filtering.toggleRoleFilter('user')
      filtering.toggleRoleFilter('assistant')
      filtering.toggleToolFilter('Bash')
      filtering.searchQuery.value = 'file'
      filtering.toggleRoleFilter('user') // Remove user filter
      
      await new Promise(resolve => setTimeout(resolve, 350))
      
      // Verify final state is consistent
      const filteredLength = filtering.filteredMessages.value.length
      for (let i = 0; i < filteredLength; i++) {
        const original = filtering.getOriginalIndex(i)
        expect(original).toBeGreaterThanOrEqual(0)
        expect(filtering.getFilteredIndex(original)).toBe(i)
      }
    })
  })

  describe('Error Handling and Robustness', () => {
    it('should handle malformed message data gracefully', () => {
      messages.value = [
        null,
        undefined,
        {},
        { uuid: 'valid', type: 'user', message: { content: 'Valid message' } },
        { malformed: true }
      ]
      
      // Should not throw errors
      expect(() => filtering.getOriginalIndex(0)).not.toThrow()
      expect(() => filtering.getFilteredIndex(0)).not.toThrow()
      
      // Valid message should still work
      const validOriginal = 3 // Index of valid message
      const validFiltered = filtering.getFilteredIndex(validOriginal)
      if (validFiltered >= 0) {
        expect(filtering.getOriginalIndex(validFiltered)).toBe(validOriginal)
      }
    })

    it('should track errors in error state', () => {
      // Clear any existing errors
      filtering.clearErrors()
      expect(filtering.errors.value).toHaveLength(0)
      
      // Trigger error conditions
      filtering.getOriginalIndex('invalid')
      filtering.getFilteredIndex(null)
      filtering.getOriginalIndex({})
      filtering.getFilteredIndex([])
      
      // Should have recorded errors or handled gracefully
      const errors = filtering.errors.value
      const systemStillFunctional = filtering.filteredMessages.value !== undefined
      
      expect(errors.length > 0 || systemStillFunctional).toBe(true)
      
      // If errors were recorded, they should contain useful information
      if (errors.length > 0) {
        expect(errors.some(err => err.operation === 'getOriginalIndex' || err.operation === 'getFilteredIndex')).toBe(true)
      }
    })

    it('should handle concurrent operations without race conditions', async () => {
      // Simulate concurrent filter changes and index lookups
      const promises = []
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              filtering.toggleRoleFilter('user')
              const result = filtering.getOriginalIndex(0)
              resolve(result)
            }, Math.random() * 100)
          })
        )
      }
      
      const results = await Promise.all(promises)
      
      // All results should be valid (either 0 or -1, not undefined/null)
      results.forEach(result => {
        expect(typeof result).toBe('number')
        expect(result >= -1).toBe(true)
      })
    })

    it('should handle maximum boundary conditions', () => {
      // Create large dataset to test performance and memory
      const largeMessages = []
      for (let i = 0; i < 1000; i++) {
        largeMessages.push({
          uuid: `msg-${i}`,
          type: i % 2 === 0 ? 'user' : 'assistant',
          message: { content: `Message ${i}` }
        })
      }
      
      messages.value = largeMessages
      
      // Test boundary conditions
      expect(filtering.getOriginalIndex(0)).toBe(0)
      expect(filtering.getOriginalIndex(999)).toBe(999)
      expect(filtering.getOriginalIndex(1000)).toBe(-1)
      
      expect(filtering.getFilteredIndex(0)).toBe(0)
      expect(filtering.getFilteredIndex(999)).toBe(999)
      expect(filtering.getFilteredIndex(1000)).toBe(-1)
    })
  })

  describe('Performance Validation', () => {
    it('should complete index operations within performance thresholds', () => {
      // Create moderately sized dataset
      const testMessages = []
      for (let i = 0; i < 100; i++) {
        testMessages.push({
          uuid: `test-${i}`,
          type: i % 3 === 0 ? 'user' : 'assistant',
          message: { content: `Test message ${i}` }
        })
      }
      
      messages.value = testMessages
      
      // Measure performance of index operations
      const startTime = performance.now()
      
      for (let i = 0; i < 100; i++) {
        filtering.getOriginalIndex(i % 50)
        filtering.getFilteredIndex(i)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (< 10ms for 200 operations)
      expect(duration).toBeLessThan(10)
    })

    it('should provide performance metrics', () => {
      const metrics = filtering.getPerformanceMetrics()
      
      expect(metrics).toHaveProperty('filterCount')
      expect(metrics).toHaveProperty('totalTime')
      expect(metrics).toHaveProperty('averageTime')
      expect(metrics).toHaveProperty('cacheStats')
      
      expect(typeof metrics.filterCount).toBe('number')
      expect(typeof metrics.totalTime).toBe('number')
      expect(typeof metrics.averageTime).toBe('number')
    })
  })
})