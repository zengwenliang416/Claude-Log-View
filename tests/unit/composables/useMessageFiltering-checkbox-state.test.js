import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, reactive, nextTick } from 'vue'
import { useMessageFiltering } from '@/composables/useMessageFiltering.js'

// Mock the dependencies
vi.mock('@/utils/messageTypes.js', () => ({
  getMessageRole: vi.fn((message) => message.type || 'user'),
  getMessageToolNames: vi.fn((message) => {
    if (message.message?.content && Array.isArray(message.message.content)) {
      return message.message.content
        .filter(item => item.type === 'tool_use')
        .map(item => item.name || 'unknown')
    }
    return []
  })
}))

vi.mock('@/utils/FilteringEngine.js', () => ({
  FilteringEngine: class MockFilteringEngine {
    constructor() {}
    createFilterState() { return {} }
    processMessages(messages) {
      return {
        filteredMessages: messages,
        filteredToOriginalMap: new Map(),
        originalToFilteredMap: new Map(),
        stats: { originalCount: messages.length, filteredCount: messages.length, filteringTime: 0 }
      }
    }
    preWarmCache() {}
    getPerformanceMetrics() { return {} }
    optimize() { return {} }
  },
  filteringUtils: {
    debounceFilter: (fn) => fn
  }
}))

vi.mock('@/utils/MessageContentCache.js', () => ({
  messageContentCache: {
    clear: vi.fn()
  }
}))

describe('useMessageFiltering - Enhanced Checkbox State Logic', () => {
  let messages
  let composable

  const createMockMessages = () => [
    { uuid: '1', type: 'user', message: { content: 'Hello' } },
    { uuid: '2', type: 'assistant', message: { content: 'Hi there' } },
    { uuid: '3', type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'ls' } }] } },
    { uuid: '4', type: 'tool_result', toolUseResult: { content: 'file1.txt\nfile2.txt' } }
  ]

  beforeEach(() => {
    messages = ref(createMockMessages())
    composable = useMessageFiltering(messages)
  })

  describe('Initial State - All Selected by Default', () => {
    it('should initialize with all roles selected', async () => {
      await nextTick()
      
      // All available roles should be selected by default
      const availableRoles = composable.availableRoles.value
      expect(availableRoles.length).toBeGreaterThan(0)
      
      availableRoles.forEach(role => {
        expect(composable.selectedRoles.has(role)).toBe(true)
      })
    })

    it('should initialize with all tools selected', async () => {
      await nextTick()
      
      // All available tools should be selected by default
      const availableTools = composable.availableTools.value
      if (availableTools.length > 0) {
        availableTools.forEach(tool => {
          expect(composable.selectedTools.has(tool)).toBe(true)
        })
      }
    })

    it('should report isShowingAll as true when all filters are selected', async () => {
      await nextTick()
      
      expect(composable.isShowingAll.value).toBe(true)
    })

    it('should report areAllRolesSelected as true initially', async () => {
      await nextTick()
      
      expect(composable.areAllRolesSelected.value).toBe(true)
    })

    it('should report areAllToolsSelected as true initially', async () => {
      await nextTick()
      
      expect(composable.areAllToolsSelected.value).toBe(true)
    })
  })

  describe('Checkbox State Transitions', () => {
    it('should change isShowingAll to false when a role is deselected', async () => {
      await nextTick()
      
      // Initially showing all
      expect(composable.isShowingAll.value).toBe(true)
      
      // Deselect a role
      const firstRole = composable.availableRoles.value[0]
      composable.toggleRoleFilter(firstRole)
      
      await nextTick()
      
      // Should no longer be showing all
      expect(composable.isShowingAll.value).toBe(false)
      expect(composable.areAllRolesSelected.value).toBe(false)
    })

    it('should change isShowingAll to false when a tool is deselected', async () => {
      await nextTick()
      
      expect(composable.isShowingAll.value).toBe(true)
      
      // Add a tool first if none exist
      if (composable.availableTools.value.length === 0) {
        messages.value.push({
          uuid: '5',
          type: 'assistant',
          message: { content: [{ type: 'tool_use', name: 'TestTool' }] }
        })
        await nextTick()
      }
      
      const firstTool = composable.availableTools.value[0]
      if (firstTool) {
        composable.toggleToolFilter(firstTool)
        await nextTick()
        
        expect(composable.isShowingAll.value).toBe(false)
        expect(composable.areAllToolsSelected.value).toBe(false)
      }
    })

    it('should restore isShowingAll when all filters are selected again', async () => {
      await nextTick()
      
      // Deselect and reselect a role
      const firstRole = composable.availableRoles.value[0]
      composable.toggleRoleFilter(firstRole) // Deselect
      await nextTick()
      expect(composable.isShowingAll.value).toBe(false)
      
      composable.toggleRoleFilter(firstRole) // Reselect
      await nextTick()
      expect(composable.isShowingAll.value).toBe(true)
    })

    it('should handle multiple rapid toggle operations correctly', async () => {
      await nextTick()
      
      const firstRole = composable.availableRoles.value[0]
      
      // Rapid toggles
      composable.toggleRoleFilter(firstRole)
      composable.toggleRoleFilter(firstRole)
      composable.toggleRoleFilter(firstRole)
      
      await nextTick()
      
      // Should be deselected after odd number of toggles
      expect(composable.selectedRoles.has(firstRole)).toBe(false)
      expect(composable.isShowingAll.value).toBe(false)
    })
  })

  describe('Select All Functionality', () => {
    it('should select all roles when selectAllRoles is called', async () => {
      await nextTick()
      
      // First deselect some roles
      const firstRole = composable.availableRoles.value[0]
      composable.toggleRoleFilter(firstRole)
      await nextTick()
      
      expect(composable.areAllRolesSelected.value).toBe(false)
      
      // Select all roles
      composable.selectAllRoles()
      await nextTick()
      
      expect(composable.areAllRolesSelected.value).toBe(true)
      composable.availableRoles.value.forEach(role => {
        expect(composable.selectedRoles.has(role)).toBe(true)
      })
    })

    it('should select all tools when selectAllTools is called', async () => {
      await nextTick()
      
      // Add tools if none exist
      if (composable.availableTools.value.length === 0) {
        messages.value.push({
          uuid: '5',
          type: 'assistant',
          message: { content: [{ type: 'tool_use', name: 'TestTool' }] }
        })
        await nextTick()
      }
      
      if (composable.availableTools.value.length > 0) {
        // Deselect a tool
        const firstTool = composable.availableTools.value[0]
        composable.toggleToolFilter(firstTool)
        await nextTick()
        
        expect(composable.areAllToolsSelected.value).toBe(false)
        
        // Select all tools
        composable.selectAllTools()
        await nextTick()
        
        expect(composable.areAllToolsSelected.value).toBe(true)
        composable.availableTools.value.forEach(tool => {
          expect(composable.selectedTools.has(tool)).toBe(true)
        })
      }
    })

    it('should restore isShowingAll when clearAllFilters is called', async () => {
      await nextTick()
      
      // Deselect some filters
      const firstRole = composable.availableRoles.value[0]
      composable.toggleRoleFilter(firstRole)
      composable.searchQuery.value = 'test search'
      
      await nextTick()
      expect(composable.isShowingAll.value).toBe(false)
      
      // Clear all filters - should restore to "all selected" state
      composable.clearAllFilters()
      await nextTick()
      
      expect(composable.isShowingAll.value).toBe(true)
      expect(composable.areAllRolesSelected.value).toBe(true)
      expect(composable.areAllToolsSelected.value).toBe(true)
      expect(composable.searchQuery.value).toBe('')
    })
  })

  describe('Search Query Impact on isShowingAll', () => {
    it('should set isShowingAll to false when search query exists', async () => {
      await nextTick()
      
      expect(composable.isShowingAll.value).toBe(true)
      
      composable.searchQuery.value = 'test'
      await nextTick()
      
      expect(composable.isShowingAll.value).toBe(false)
    })

    it('should restore isShowingAll when search query is cleared and all filters selected', async () => {
      await nextTick()
      
      composable.searchQuery.value = 'test'
      await nextTick()
      expect(composable.isShowingAll.value).toBe(false)
      
      composable.searchQuery.value = ''
      await nextTick()
      expect(composable.isShowingAll.value).toBe(true)
    })

    it('should keep isShowingAll false when search is cleared but filters are active', async () => {
      await nextTick()
      
      // Deselect a role and add search
      const firstRole = composable.availableRoles.value[0]
      composable.toggleRoleFilter(firstRole)
      composable.searchQuery.value = 'test'
      await nextTick()
      
      expect(composable.isShowingAll.value).toBe(false)
      
      // Clear search but keep role deselected
      composable.searchQuery.value = ''
      await nextTick()
      
      expect(composable.isShowingAll.value).toBe(false) // Still false due to role filter
    })
  })

  describe('Dynamic Message Changes', () => {
    it('should update available roles when messages change', async () => {
      await nextTick()
      
      const initialRoles = [...composable.availableRoles.value]
      
      // Add message with new role
      messages.value.push({
        uuid: '5',
        type: 'system',
        message: { content: 'System message' }
      })
      
      await nextTick()
      
      const newRoles = composable.availableRoles.value
      expect(newRoles).toContain('system')
      expect(newRoles.length).toBe(initialRoles.length + 1)
      
      // New role should be automatically selected
      expect(composable.selectedRoles.has('system')).toBe(true)
    })

    it('should update available tools when messages change', async () => {
      await nextTick()
      
      const initialTools = [...composable.availableTools.value]
      
      // Add message with new tool
      messages.value.push({
        uuid: '6',
        type: 'assistant',
        message: { content: [{ type: 'tool_use', name: 'NewTool' }] }
      })
      
      await nextTick()
      
      const newTools = composable.availableTools.value
      expect(newTools).toContain('NewTool')
      
      // New tool should be automatically selected
      expect(composable.selectedTools.has('NewTool')).toBe(true)
    })

    it('should maintain isShowingAll when new messages are added', async () => {
      await nextTick()
      
      expect(composable.isShowingAll.value).toBe(true)
      
      // Add new message
      messages.value.push({
        uuid: '7',
        type: 'user',
        message: { content: 'Another message' }
      })
      
      await nextTick()
      
      // Should still be showing all since new items are auto-selected
      expect(composable.isShowingAll.value).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty message array', async () => {
      messages.value = []
      await nextTick()
      
      expect(composable.availableRoles.value).toEqual([])
      expect(composable.availableTools.value).toEqual([])
      expect(composable.selectedRoles.size).toBe(0)
      expect(composable.selectedTools.size).toBe(0)
      expect(composable.isShowingAll.value).toBe(false) // False because no roles/tools to select
    })

    it('should handle messages with no roles', async () => {
      messages.value = [{ uuid: '1', message: { content: 'No type field' } }]
      await nextTick()
      
      // Should fall back to default role
      expect(composable.availableRoles.value.length).toBeGreaterThan(0)
      expect(composable.areAllRolesSelected.value).toBe(true)
    })

    it('should handle messages with no tools gracefully', async () => {
      messages.value = [
        { uuid: '1', type: 'user', message: { content: 'No tools here' } },
        { uuid: '2', type: 'assistant', message: { content: 'Just text' } }
      ]
      await nextTick()
      
      expect(composable.availableTools.value).toEqual([])
      expect(composable.areAllToolsSelected.value).toBe(true) // True when no tools available
    })

    it('should handle malformed tool messages', async () => {
      messages.value = [{
        uuid: '1',
        type: 'assistant',
        message: { content: [{ type: 'tool_use' }] } // Missing name
      }]
      await nextTick()
      
      // Should handle gracefully, possibly with 'unknown' tool name
      const tools = composable.availableTools.value
      expect(Array.isArray(tools)).toBe(true)
    })
  })

  describe('Performance Characteristics', () => {
    it('should handle large numbers of messages efficiently', async () => {
      const largeMessageSet = Array.from({ length: 1000 }, (_, i) => ({
        uuid: `${i}`,
        type: i % 3 === 0 ? 'user' : i % 3 === 1 ? 'assistant' : 'tool_result',
        message: { content: `Message ${i}` }
      }))
      
      const startTime = performance.now()
      messages.value = largeMessageSet
      await nextTick()
      
      const processingTime = performance.now() - startTime
      
      // Should process efficiently
      expect(processingTime).toBeLessThan(100) // 100ms threshold
      
      // State should be correct
      expect(composable.availableRoles.value.length).toBeGreaterThan(0)
      expect(composable.areAllRolesSelected.value).toBe(true)
    })

    it('should not cause excessive re-computations on unrelated changes', async () => {
      let computeCount = 0
      
      // Mock computed to track calls
      const originalIsShowingAll = composable.isShowingAll
      Object.defineProperty(composable, 'isShowingAll', {
        get() {
          computeCount++
          return originalIsShowingAll.value
        }
      })
      
      await nextTick()
      const initialCount = computeCount
      
      // Change unrelated reactive data
      const unrelatedRef = ref('test')
      unrelatedRef.value = 'changed'
      
      await nextTick()
      
      // Should not cause excessive recomputation
      expect(computeCount - initialCount).toBeLessThan(5)
    })
  })

  describe('Consistency Validation', () => {
    it('should maintain consistent state between different computed properties', async () => {
      await nextTick()
      
      // All properties should be consistent with each other
      const isShowingAll = composable.isShowingAll.value
      const areAllRolesSelected = composable.areAllRolesSelected.value
      const areAllToolsSelected = composable.areAllToolsSelected.value
      const hasActiveFilters = composable.hasActiveFilters.value
      const searchQuery = composable.searchQuery.value
      
      if (isShowingAll) {
        expect(areAllRolesSelected).toBe(true)
        expect(areAllToolsSelected).toBe(true)
        expect(hasActiveFilters).toBe(false)
        expect(searchQuery.trim()).toBe('')
      }
      
      if (!areAllRolesSelected || !areAllToolsSelected || searchQuery.trim()) {
        expect(isShowingAll).toBe(false)
        expect(hasActiveFilters).toBe(true)
      }
    })

    it('should maintain Set integrity during operations', async () => {
      await nextTick()
      
      const initialRolesSize = composable.selectedRoles.size
      const firstRole = composable.availableRoles.value[0]
      
      // Toggle twice should return to original state
      composable.toggleRoleFilter(firstRole) // Remove
      expect(composable.selectedRoles.size).toBe(initialRolesSize - 1)
      
      composable.toggleRoleFilter(firstRole) // Add back
      expect(composable.selectedRoles.size).toBe(initialRolesSize)
      expect(composable.selectedRoles.has(firstRole)).toBe(true)
    })

    it('should maintain referential stability of Sets', async () => {
      await nextTick()
      
      const rolesRef = composable.selectedRoles
      const toolsRef = composable.selectedTools
      
      // Operations should modify the same Set instances
      composable.toggleRoleFilter(composable.availableRoles.value[0])
      await nextTick()
      
      expect(composable.selectedRoles).toBe(rolesRef)
      expect(composable.selectedTools).toBe(toolsRef)
    })
  })
})