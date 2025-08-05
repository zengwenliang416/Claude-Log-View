import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'
import { useMessageFiltering } from '@/composables/useMessageFiltering.js'
import { createFilterTestData, createMessageSet } from '../../helpers/test-data.js'

// Mock the FilteringEngine and MessageContentCache
vi.mock('@/utils/FilteringEngine.js', () => ({
  FilteringEngine: class MockFilteringEngine {
    constructor() {
      this.performanceMetrics = { cacheHits: 0, cacheMisses: 0, avgFilterTime: 0 }
    }
    
    preWarmCache() {}
    
    createFilterState(roleFilters, toolFilters, searchQuery) {
      return {
        roles: Array.from(roleFilters),
        tools: Array.from(toolFilters),
        search: searchQuery
      }
    }
    
    hasActiveFilters(filters) {
      return filters.roles.length > 0 || filters.tools.length > 0 || filters.search.length > 0
    }
    
    processMessages(messages, filters) {
      const filteredToOriginalMap = new Map()
      const originalToFilteredMap = new Map()
      
      // If no filters, return identity mappings
      if (!this.hasActiveFilters(filters)) {
        for (let i = 0; i < messages.length; i++) {
          filteredToOriginalMap.set(i, i)
          originalToFilteredMap.set(i, i)
        }
        return {
          filteredMessages: messages,
          filteredToOriginalMap,
          originalToFilteredMap,
          stats: { originalCount: messages.length, filteredCount: messages.length, filteringTime: 0 }
        }
      }
      
      // Apply basic filtering for testing
      const filtered = messages.filter((message, index) => {
        let matches = true
        
        if (filters.roles.length > 0) {
          matches = matches && filters.roles.includes(message._role)
        }
        
        if (filters.tools.length > 0) {
          const messageTools = message._tools || []
          matches = matches && filters.tools.some(tool => messageTools.includes(tool))
        }
        
        if (filters.search.length > 0) {
          const content = JSON.stringify(message).toLowerCase()
          matches = matches && content.includes(filters.search.toLowerCase())
        }
        
        return matches
      })
      
      // Build mappings
      filtered.forEach((message, filteredIndex) => {
        const originalIndex = messages.indexOf(message)
        filteredToOriginalMap.set(filteredIndex, originalIndex)
        originalToFilteredMap.set(originalIndex, filteredIndex)
      })
      
      return {
        filteredMessages: filtered,
        filteredToOriginalMap,
        originalToFilteredMap,
        stats: { 
          originalCount: messages.length, 
          filteredCount: filtered.length, 
          filteringTime: 10 
        }
      }
    }
    
    getPerformanceMetrics() {
      return this.performanceMetrics
    }
    
    optimize() {
      return { cacheCleared: true, metricsReset: true }
    }
  },
  
  filteringUtils: {
    debounceFilter: (fn, delay) => fn
  }
}))

vi.mock('@/utils/MessageContentCache.js', () => ({
  messageContentCache: {
    clear: vi.fn()
  }
}))

describe('useMessageFiltering - Default State Behavior', () => {
  let filtering
  let testMessages

  beforeEach(() => {
    testMessages = ref(createFilterTestData())
    filtering = useMessageFiltering(testMessages)
    vi.clearAllMocks()
  })

  describe('Default Filtering State', () => {
    it('should show all messages by default when no filters are active', () => {
      expect(filtering.filteredMessages.value).toHaveLength(testMessages.value.length)
      expect(filtering.filteredMessages.value).toEqual(testMessages.value)
    })

    it('should have no active filters by default', () => {
      expect(filtering.hasActiveFilters.value).toBe(false)
      expect(Array.from(filtering.roleFilters)).toHaveLength(0)
      expect(Array.from(filtering.toolFilters)).toHaveLength(0)
      expect(filtering.searchQuery.value).toBe('')
    })

    it('should create identity mappings when no filters are active', () => {
      const messageCount = testMessages.value.length
      
      // Check filtered-to-original mapping
      for (let i = 0; i < messageCount; i++) {
        expect(filtering.filteredToOriginalIndexMap.value.get(i)).toBe(i)
      }
      
      // Check original-to-filtered mapping
      for (let i = 0; i < messageCount; i++) {
        expect(filtering.originalToFilteredIndexMap.value.get(i)).toBe(i)
      }
    })

    it('should return correct statistics for unfiltered state', () => {
      const stats = filtering.getFilteringStats()
      
      expect(stats.originalCount).toBe(testMessages.value.length)
      expect(stats.filteredCount).toBe(testMessages.value.length)
      expect(stats.filteringTime).toBe(0) // No filtering time when no filters
    })
  })

  describe('Available Filter Options', () => {
    it('should extract all available roles from messages', () => {
      const expectedRoles = ['user', 'assistant', 'tool', 'tool_result', 'summary']
      const availableRoles = filtering.availableRoles.value
      
      expectedRoles.forEach(role => {
        expect(availableRoles).toContain(role)
      })
    })

    it('should extract all available tools from messages', () => {
      const expectedTools = ['Bash', 'Read']
      const availableTools = filtering.availableTools.value
      
      expectedTools.forEach(tool => {
        expect(availableTools).toContain(tool)
      })
    })

    it('should sort available roles and tools alphabetically', () => {
      const roles = filtering.availableRoles.value
      const tools = filtering.availableTools.value
      
      expect(roles).toEqual([...roles].sort())
      expect(tools).toEqual([...tools].sort())
    })

    it('should handle empty message array gracefully', () => {
      testMessages.value = []
      
      expect(filtering.availableRoles.value).toEqual([])
      expect(filtering.availableTools.value).toEqual([])
      expect(filtering.filteredMessages.value).toEqual([])
    })
  })

  describe('Message Count Calculations', () => {
    it('should calculate correct role message counts', () => {
      const userCount = filtering.getRoleMessageCount('user')
      const assistantCount = filtering.getRoleMessageCount('assistant')
      
      expect(userCount).toBeGreaterThan(0)
      expect(assistantCount).toBeGreaterThan(0)
      
      // Verify counts match actual messages
      const actualUserCount = testMessages.value.filter(msg => msg._role === 'user').length
      const actualAssistantCount = testMessages.value.filter(msg => msg._role === 'assistant').length
      
      expect(userCount).toBe(actualUserCount)
      expect(assistantCount).toBe(actualAssistantCount)
    })

    it('should calculate correct tool message counts', () => {
      const bashCount = filtering.getToolMessageCount('Bash')
      const readCount = filtering.getToolMessageCount('Read')
      
      expect(bashCount).toBeGreaterThan(0)
      expect(readCount).toBeGreaterThan(0)
      
      // Verify counts match actual messages
      const actualBashCount = testMessages.value.filter(msg => 
        msg._tools && msg._tools.includes('Bash')
      ).length
      
      expect(bashCount).toBe(actualBashCount)
    })

    it('should return zero for non-existent roles and tools', () => {
      expect(filtering.getRoleMessageCount('nonexistent')).toBe(0)
      expect(filtering.getToolMessageCount('NonexistentTool')).toBe(0)
    })
  })

  describe('Filter State Management', () => {
    it('should toggle role filters correctly', () => {
      expect(filtering.roleFilters.has('user')).toBe(false)
      
      filtering.toggleRoleFilter('user')
      expect(filtering.roleFilters.has('user')).toBe(true)
      
      filtering.toggleRoleFilter('user')
      expect(filtering.roleFilters.has('user')).toBe(false)
    })

    it('should toggle tool filters correctly', () => {
      expect(filtering.toolFilters.has('Bash')).toBe(false)
      
      filtering.toggleToolFilter('Bash')
      expect(filtering.toolFilters.has('Bash')).toBe(true)
      
      filtering.toggleToolFilter('Bash')
      expect(filtering.toolFilters.has('Bash')).toBe(false)
    })

    it('should clear all filters correctly', () => {
      // Set some filters
      filtering.toggleRoleFilter('user')
      filtering.toggleToolFilter('Bash')
      filtering.searchQuery.value = 'test search'
      
      expect(filtering.hasActiveFilters.value).toBe(true)
      
      // Clear all filters
      filtering.clearAllFilters()
      
      expect(filtering.hasActiveFilters.value).toBe(false)
      expect(Array.from(filtering.roleFilters)).toHaveLength(0)
      expect(Array.from(filtering.toolFilters)).toHaveLength(0)
      expect(filtering.searchQuery.value).toBe('')
    })

    it('should set multiple filters at once', () => {
      filtering.setRoleFilters(['user', 'assistant'])
      filtering.setToolFilters(['Bash', 'Read'])
      
      expect(filtering.roleFilters.has('user')).toBe(true)
      expect(filtering.roleFilters.has('assistant')).toBe(true)
      expect(filtering.toolFilters.has('Bash')).toBe(true)
      expect(filtering.toolFilters.has('Read')).toBe(true)
    })
  })

  describe('State Persistence', () => {
    it('should get current filter state', () => {
      filtering.toggleRoleFilter('user')
      filtering.toggleToolFilter('Bash')
      filtering.searchQuery.value = 'test query'
      
      const state = filtering.getFilterState()
      
      expect(state.roles).toContain('user')
      expect(state.tools).toContain('Bash')
      expect(state.search).toBe('test query')
    })

    it('should restore filter state', () => {
      const state = {
        roles: ['user', 'assistant'],
        tools: ['Bash'],
        search: 'restored search'
      }
      
      filtering.restoreFilterState(state)
      
      expect(filtering.roleFilters.has('user')).toBe(true)
      expect(filtering.roleFilters.has('assistant')).toBe(true)
      expect(filtering.toolFilters.has('Bash')).toBe(true)
      expect(filtering.searchQuery.value).toBe('restored search')
    })
  })

  describe('Index Mapping Functions', () => {
    it('should return correct original index for filtered index', () => {
      // In default state (no filters), indices should be identity mapped
      for (let i = 0; i < testMessages.value.length; i++) {
        expect(filtering.getOriginalIndex(i)).toBe(i)
      }
    })

    it('should return correct filtered index for original index', () => {
      // In default state (no filters), indices should be identity mapped
      for (let i = 0; i < testMessages.value.length; i++) {
        expect(filtering.getFilteredIndex(i)).toBe(i)
      }
    })

    it('should handle invalid indices gracefully', () => {
      expect(filtering.getOriginalIndex(-1)).toBe(-1)
      expect(filtering.getOriginalIndex(999)).toBe(-1)
      expect(filtering.getFilteredIndex(-1)).toBe(-1)
      expect(filtering.getFilteredIndex(999)).toBe(-1)
    })

    it('should handle non-numeric indices gracefully', () => {
      expect(filtering.getOriginalIndex('invalid')).toBe(-1)
      expect(filtering.getOriginalIndex(null)).toBe(-1)
      expect(filtering.getOriginalIndex(undefined)).toBe(-1)
      expect(filtering.getFilteredIndex('invalid')).toBe(-1)
    })
  })

  describe('Default State Transitions', () => {
    it('should transition from default to filtered state correctly', () => {
      // Start in default state
      expect(filtering.hasActiveFilters.value).toBe(false)
      expect(filtering.filteredMessages.value).toHaveLength(testMessages.value.length)
      
      // Apply a filter
      filtering.toggleRoleFilter('user')
      
      // Should transition to filtered state
      expect(filtering.hasActiveFilters.value).toBe(true)
      expect(filtering.filteredMessages.value.length).toBeLessThanOrEqual(testMessages.value.length)
    })

    it('should return to default state when filters are cleared', () => {
      // Apply filters
      filtering.toggleRoleFilter('user')
      filtering.toggleToolFilter('Bash')
      filtering.searchQuery.value = 'search'
      
      expect(filtering.hasActiveFilters.value).toBe(true)
      
      // Clear all filters - should return to default state
      filtering.clearAllFilters()
      
      expect(filtering.hasActiveFilters.value).toBe(false)
      expect(filtering.filteredMessages.value).toHaveLength(testMessages.value.length)
      expect(filtering.filteredMessages.value).toEqual(testMessages.value)
    })

    it('should maintain consistent state during rapid filter changes', () => {
      const roles = ['user', 'assistant', 'tool']
      const tools = ['Bash', 'Read']
      
      // Rapidly toggle filters
      for (let i = 0; i < 10; i++) {
        roles.forEach(role => filtering.toggleRoleFilter(role))
        tools.forEach(tool => filtering.toggleToolFilter(tool))
      }
      
      // Should return to default state (all filters toggled even number of times)
      expect(filtering.hasActiveFilters.value).toBe(false)
      expect(filtering.filteredMessages.value).toEqual(testMessages.value)
    })
  })

  describe('Large Dataset Default Behavior', () => {
    it('should handle large datasets efficiently in default state', () => {
      const largeDataset = createMessageSet(1000)
      testMessages.value = largeDataset
      
      const startTime = performance.now()
      
      // Access filtered messages (should use identity mapping)
      const filtered = filtering.filteredMessages.value
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      expect(filtered).toHaveLength(1000)
      expect(processingTime).toBeLessThan(50) // Should be very fast for default state
    })

    it('should create efficient mappings for large datasets', () => {
      const largeDataset = createMessageSet(2000)
      testMessages.value = largeDataset
      
      const startTime = performance.now()
      
      // Test mapping functions
      const originalIndex = filtering.getOriginalIndex(1000)
      const filteredIndex = filtering.getFilteredIndex(1000)
      
      const endTime = performance.now()
      const mappingTime = endTime - startTime
      
      expect(originalIndex).toBe(1000)
      expect(filteredIndex).toBe(1000)
      expect(mappingTime).toBeLessThan(10) // Should be very fast
    })
  })

  describe('Error Handling in Default State', () => {
    it('should handle null messages gracefully', () => {
      testMessages.value = null
      
      expect(filtering.filteredMessages.value).toEqual([])
      expect(filtering.availableRoles.value).toEqual([])
      expect(filtering.availableTools.value).toEqual([])
      expect(filtering.hasActiveFilters.value).toBe(false)
    })

    it('should handle undefined messages gracefully', () => {
      testMessages.value = undefined
      
      expect(filtering.filteredMessages.value).toEqual([])
      expect(filtering.getRoleMessageCount('user')).toBe(0)
      expect(filtering.getToolMessageCount('Bash')).toBe(0)
    })

    it('should handle malformed messages gracefully', () => {
      testMessages.value = [
        { uuid: '1' }, // missing _role and _tools
        { uuid: '2', _role: null },
        { uuid: '3', _tools: null }
      ]
      
      // Should not crash
      expect(filtering.filteredMessages.value).toHaveLength(3)
      expect(filtering.availableRoles.value).toBeDefined()
      expect(filtering.availableTools.value).toBeDefined()
    })
  })
})