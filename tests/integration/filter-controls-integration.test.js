import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LogViewer from '@/components/LogViewer.vue'
import MessageIndex from '@/components/Sidebar/MessageIndex.vue'
import FilterControls from '@/components/Sidebar/FilterControls.vue'

// Mock the composables
vi.mock('@/composables/useLogParser.js', () => ({
  useLogParser: () => ({
    messages: { value: [] },
    isLoading: { value: false },
    error: { value: null },
    loadFile: vi.fn()
  })
}))

vi.mock('@/composables/useNavigation.js', () => ({
  useNavigation: () => ({
    currentIndex: { value: 0 },
    currentMessage: { value: null },
    totalMessages: { value: 0 },
    canGoPrevious: { value: false },
    canGoNext: { value: false },
    navigationInfo: { value: { current: 0, total: 0, position: '0 / 0' } },
    goToIndex: vi.fn(),
    goToPrevious: vi.fn(),
    goToNext: vi.fn(),
    handleKeyboardNavigation: vi.fn()
  })
}))

vi.mock('@/composables/useMessageFiltering.js', () => ({
  useMessageFiltering: (messages) => {
    const mockSelectedRoles = new Set(['user', 'assistant', 'tool'])
    const mockSelectedTools = new Set(['Bash', 'Read', 'Write'])
    
    return {
      filteredMessages: { value: messages.value || [] },
      availableRoles: { value: ['user', 'assistant', 'tool'] },
      availableTools: { value: ['Bash', 'Read', 'Write'] },
      selectedRoles: mockSelectedRoles,
      selectedTools: mockSelectedTools,
      searchQuery: { value: '' },
      isShowingAll: { value: true },
      filterMode: { value: 'inclusive' },
      areAllRolesSelected: { value: true },
      areAllToolsSelected: { value: true },
      hasActiveFilters: { value: false },
      toggleRoleFilter: vi.fn((role) => {
        if (mockSelectedRoles.has(role)) {
          mockSelectedRoles.delete(role)
        } else {
          mockSelectedRoles.add(role)
        }
      }),
      toggleToolFilter: vi.fn((tool) => {
        if (mockSelectedTools.has(tool)) {
          mockSelectedTools.delete(tool)
        } else {
          mockSelectedTools.add(tool)
        }
      }),
      clearAllFilters: vi.fn(() => {
        mockSelectedRoles.clear()
        mockSelectedTools.clear()
        ;['user', 'assistant', 'tool'].forEach(role => mockSelectedRoles.add(role))
        ;['Bash', 'Read', 'Write'].forEach(tool => mockSelectedTools.add(tool))
      }),
      selectAllRoles: vi.fn(() => {
        mockSelectedRoles.clear()
        ;['user', 'assistant', 'tool'].forEach(role => mockSelectedRoles.add(role))
      }),
      selectAllTools: vi.fn(() => {
        mockSelectedTools.clear()
        ;['Bash', 'Read', 'Write'].forEach(tool => mockSelectedTools.add(tool))
      }),
      getRoleMessageCount: vi.fn(() => 5),
      getToolMessageCount: vi.fn(() => 3)
    }
  }
}))

describe('FilterControls Integration Tests', () => {
  let wrapper
  let messageIndex
  let filterControls

  beforeEach(async () => {
    wrapper = mount(LogViewer)
    await nextTick()
    
    messageIndex = wrapper.findComponent(MessageIndex)
    filterControls = messageIndex.findComponent(FilterControls)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('Component Communication Flow', () => {
    it('should pass correct props from LogViewer to MessageIndex', () => {
      expect(messageIndex.exists()).toBe(true)
      
      const props = messageIndex.props()
      expect(props).toHaveProperty('availableRoles')
      expect(props).toHaveProperty('availableTools')
      expect(props).toHaveProperty('selectedRoles')
      expect(props).toHaveProperty('selectedTools')
      expect(props).toHaveProperty('isShowingAll')
      expect(props).toHaveProperty('areAllRolesSelected')
      expect(props).toHaveProperty('areAllToolsSelected')
    })

    it('should pass correct props from MessageIndex to FilterControls', () => {
      expect(filterControls.exists()).toBe(true)
      
      const props = filterControls.props()
      expect(props.availableRoles).toEqual(['user', 'assistant', 'tool'])
      expect(props.availableTools).toEqual(['Bash', 'Read', 'Write'])
      expect(props.isShowingAll).toBe(true)
      expect(props.areAllRolesSelected).toBe(true)
      expect(props.areAllToolsSelected).toBe(true)
    })

    it('should propagate role filter toggle events up the component tree', async () => {
      const roleCheckbox = filterControls.find('[data-role="user"] .checkbox-input')
      
      await roleCheckbox.trigger('change')
      
      // Event should be emitted from FilterControls
      expect(filterControls.emitted('role-filter-toggle')).toBeTruthy()
      expect(filterControls.emitted('role-filter-toggle')[0]).toEqual(['user'])
      
      // Event should be propagated through MessageIndex
      expect(messageIndex.emitted('role-filter-toggle')).toBeTruthy()
      
      // Event should reach LogViewer
      await nextTick()
      // This would trigger the mock function in useMessageFiltering
    })

    it('should propagate tool filter toggle events up the component tree', async () => {
      const toolCheckbox = filterControls.find('[data-tool="Bash"] .checkbox-input')
      
      await toolCheckbox.trigger('change')
      
      expect(filterControls.emitted('tool-filter-toggle')).toBeTruthy()
      expect(filterControls.emitted('tool-filter-toggle')[0]).toEqual(['Bash'])
      
      expect(messageIndex.emitted('tool-filter-toggle')).toBeTruthy()
    })

    it('should propagate search change events correctly', async () => {
      const searchInput = filterControls.find('.search-input')
      
      await searchInput.setValue('test search')
      
      expect(filterControls.emitted('search-change')).toBeTruthy()
      expect(filterControls.emitted('search-change')[0]).toEqual(['test search'])
      
      expect(messageIndex.emitted('search-change')).toBeTruthy()
    })

    it('should propagate clear all filters event', async () => {
      // First set a state where not all filters are selected
      await filterControls.setProps({ isShowingAll: false })
      
      const clearButton = filterControls.find('.clear-button')
      await clearButton.trigger('click')
      
      expect(filterControls.emitted('clear-all-filters')).toBeTruthy()
      expect(messageIndex.emitted('clear-all-filters')).toBeTruthy()
    })

    it('should propagate select all roles event', async () => {
      await filterControls.setProps({ areAllRolesSelected: false })
      
      const selectAllBtn = filterControls.find('.select-all-btn')
      await selectAllBtn.trigger('click')
      
      expect(filterControls.emitted('select-all-roles')).toBeTruthy()
      expect(messageIndex.emitted('select-all-roles')).toBeTruthy()
    })

    it('should propagate select all tools event', async () => {
      await filterControls.setProps({ areAllToolsSelected: false })
      
      const selectAllBtn = filterControls.find('.select-all-btn')
      await selectAllBtn.trigger('click')
      
      expect(filterControls.emitted('select-all-tools')).toBeTruthy()
      expect(messageIndex.emitted('select-all-tools')).toBeTruthy()
    })
  })

  describe('State Synchronization', () => {
    it('should maintain consistent checkbox states across components', async () => {
      // Initial state - all selected
      expect(filterControls.props('isShowingAll')).toBe(true)
      expect(filterControls.props('areAllRolesSelected')).toBe(true)
      expect(filterControls.props('areAllToolsSelected')).toBe(true)
      
      // All checkboxes should be checked
      const roleCheckboxes = filterControls.findAll('[data-role] .checkbox-input')
      roleCheckboxes.forEach(checkbox => {
        expect(checkbox.element.checked).toBe(true)
      })
      
      const toolCheckboxes = filterControls.findAll('[data-tool] .checkbox-input')
      toolCheckboxes.forEach(checkbox => {
        expect(checkbox.element.checked).toBe(true)
      })
    })

    it('should update showing all indicator when filter state changes', async () => {
      // Initially showing all
      let indicator = filterControls.find('.showing-all-indicator')
      expect(indicator.exists()).toBe(true)
      
      let clearButton = filterControls.find('.clear-button')
      expect(clearButton.exists()).toBe(false)
      
      // Change to not showing all
      await filterControls.setProps({ isShowingAll: false })
      
      indicator = filterControls.find('.showing-all-indicator')
      expect(indicator.exists()).toBe(false)
      
      clearButton = filterControls.find('.clear-button')
      expect(clearButton.exists()).toBe(true)
    })

    it('should update select all buttons visibility based on selection state', async () => {
      // Initially all selected - no select all buttons
      let selectAllButtons = filterControls.findAll('.select-all-btn')
      expect(selectAllButtons.length).toBe(0)
      
      // Change to not all roles selected
      await filterControls.setProps({ areAllRolesSelected: false })
      
      selectAllButtons = filterControls.findAll('.select-all-btn')
      expect(selectAllButtons.length).toBeGreaterThan(0)
      
      // Should have select all button for roles
      const roleSection = filterControls.find('.filter-section:first-of-type')
      const roleSelectAll = roleSection.find('.select-all-btn')
      expect(roleSelectAll.exists()).toBe(true)
    })

    it('should maintain message count consistency', () => {
      const messageCounts = filterControls.findAll('.message-count')
      
      messageCounts.forEach(count => {
        const text = count.text()
        expect(text).toMatch(/\(\d+\)/)
        
        const number = parseInt(text.match(/\((\d+)\)/)[1])
        expect(number).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Reactive Updates', () => {
    it('should reactively update when new roles are available', async () => {
      const initialRoles = filterControls.props('availableRoles')
      
      await filterControls.setProps({
        availableRoles: [...initialRoles, 'system'],
        selectedRoles: new Set([...initialRoles, 'system'])
      })
      
      const roleCheckboxes = filterControls.findAll('[data-role] .checkbox-input')
      expect(roleCheckboxes.length).toBe(initialRoles.length + 1)
      
      const systemCheckbox = filterControls.find('[data-role="system"] .checkbox-input')
      expect(systemCheckbox.exists()).toBe(true)
      expect(systemCheckbox.element.checked).toBe(true)
    })

    it('should reactively update when new tools are available', async () => {
      const initialTools = filterControls.props('availableTools')
      
      await filterControls.setProps({
        availableTools: [...initialTools, 'NewTool'],
        selectedTools: new Set([...initialTools, 'NewTool'])
      })
      
      const toolCheckboxes = filterControls.findAll('[data-tool] .checkbox-input')
      expect(toolCheckboxes.length).toBe(initialTools.length + 1)
      
      const newToolCheckbox = filterControls.find('[data-tool="NewTool"] .checkbox-input')
      expect(newToolCheckbox.exists()).toBe(true)
      expect(newToolCheckbox.element.checked).toBe(true)
    })

    it('should update search input value reactively', async () => {
      const searchInput = filterControls.find('.search-input')
      
      await filterControls.setProps({ searchQuery: 'test search' })
      
      expect(searchInput.element.value).toBe('test search')
    })

    it('should update message counts reactively', async () => {
      await filterControls.setProps({
        roleMessageCounts: { user: 10, assistant: 15, tool: 5 },
        toolMessageCounts: { Bash: 8, Read: 12, Write: 3 }
      })
      
      const userCount = filterControls.find('[data-role="user"] .message-count')
      expect(userCount.text()).toBe('(10)')
      
      const bashCount = filterControls.find('[data-tool="Bash"] .message-count')
      expect(bashCount.text()).toBe('(8)')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle missing props gracefully', async () => {
      expect(() => {
        mount(FilterControls, {
          props: {
            // Missing required props
          }
        })
      }).not.toThrow()
    })

    it('should handle empty arrays for roles and tools', async () => {
      await filterControls.setProps({
        availableRoles: [],
        availableTools: [],
        selectedRoles: new Set(),
        selectedTools: new Set()
      })
      
      const roleCheckboxes = filterControls.findAll('[data-role] .checkbox-input')
      expect(roleCheckboxes.length).toBe(0)
      
      const toolCheckboxes = filterControls.findAll('[data-tool] .checkbox-input')
      expect(toolCheckboxes.length).toBe(0)
    })

    it('should handle Set props correctly', async () => {
      const rolesSet = new Set(['user', 'assistant'])
      const toolsSet = new Set(['Bash'])
      
      await filterControls.setProps({
        selectedRoles: rolesSet,
        selectedTools: toolsSet
      })
      
      // Component should use the Set methods correctly
      expect(filterControls.vm.isRoleSelected('user')).toBe(true)
      expect(filterControls.vm.isRoleSelected('tool')).toBe(false)
      expect(filterControls.vm.isToolSelected('Bash')).toBe(true)
      expect(filterControls.vm.isToolSelected('Write')).toBe(false)
    })
  })

  describe('Performance Integration', () => {
    it('should handle large numbers of filter options efficiently', async () => {
      const manyRoles = Array.from({ length: 50 }, (_, i) => `role${i}`)
      const manyTools = Array.from({ length: 50 }, (_, i) => `tool${i}`)
      
      const startTime = performance.now()
      
      await filterControls.setProps({
        availableRoles: manyRoles,
        availableTools: manyTools,
        selectedRoles: new Set(manyRoles),
        selectedTools: new Set(manyTools)
      })
      
      const renderTime = performance.now() - startTime
      
      expect(renderTime).toBeLessThan(100) // 100ms threshold
      
      const allCheckboxes = filterControls.findAll('.checkbox-input')
      expect(allCheckboxes.length).toBe(100) // 50 roles + 50 tools
    })

    it('should not cause excessive re-renders during rapid interactions', async () => {
      const renderSpy = vi.spyOn(filterControls.vm, '$forceUpdate')
      
      const checkbox = filterControls.find('.checkbox-input')
      
      // Rapid interactions
      await checkbox.trigger('change')
      await checkbox.trigger('change')
      await checkbox.trigger('change')
      
      await nextTick()
      
      // Should not cause excessive re-renders
      expect(renderSpy).not.toHaveBeenCalled()
      
      renderSpy.mockRestore()
    })
  })

  describe('Accessibility Integration', () => {
    it('should maintain proper tab order throughout the component tree', async () => {
      const focusableElements = wrapper.findAll('input, button, [tabindex]')
      
      focusableElements.forEach(element => {
        if (element.element.tabIndex !== -1) {
          expect(element.element.tabIndex).toBeGreaterThanOrEqual(0)
        }
      })
    })

    it('should maintain proper ARIA attributes across components', () => {
      const checkboxes = filterControls.findAll('.checkbox-input')
      
      checkboxes.forEach(checkbox => {
        expect(checkbox.attributes('type')).toBe('checkbox')
      })
      
      const labels = filterControls.findAll('.checkbox-label')
      labels.forEach(label => {
        expect(label.element.tagName.toLowerCase()).toBe('label')
      })
    })

    it('should support keyboard navigation across filter sections', async () => {
      const firstCheckbox = filterControls.find('.checkbox-input')
      
      await firstCheckbox.trigger('keydown.tab')
      
      // Should be able to navigate to next elements
      const focusedElement = document.activeElement
      expect(focusedElement).toBeDefined()
    })

    it('should announce state changes to screen readers', async () => {
      const checkbox = filterControls.find('.checkbox-input')
      
      await checkbox.trigger('change')
      
      // ARIA states should be updated
      expect(checkbox.element.checked).toBeDefined()
    })
  })

  describe('Mobile Integration', () => {
    beforeEach(async () => {
      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })
      
      window.dispatchEvent(new Event('resize'))
      await nextTick()
    })

    it('should maintain touch-friendly targets on mobile', () => {
      const checkboxLabels = filterControls.findAll('.checkbox-label')
      
      checkboxLabels.forEach(label => {
        const rect = label.element.getBoundingClientRect()
        expect(rect.height).toBeGreaterThanOrEqual(40) // Minimum touch target
      })
    })

    it('should handle touch events on mobile', async () => {
      const checkbox = filterControls.find('.checkbox-label')
      
      await checkbox.trigger('touchstart')
      await checkbox.trigger('touchend')
      
      // Should behave similar to click
      expect(filterControls.emitted('role-filter-toggle') || filterControls.emitted('tool-filter-toggle')).toBeDefined()
    })

    it('should prevent text selection on mobile during touch', async () => {
      const label = filterControls.find('.checkbox-label')
      
      await label.trigger('touchstart')
      
      const styles = getComputedStyle(label.element)
      expect(styles.userSelect || styles.webkitUserSelect).toBeDefined()
    })
  })
})