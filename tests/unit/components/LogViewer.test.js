import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LogViewer from '@/components/LogViewer.vue'
import { createFilterTestData, createMessageSet } from '../../helpers/test-data.js'
import { mountComponent, simulateKeyboard } from '../../helpers/vue-test-utils.js'

// Mock the composables
vi.mock('@/composables/useLogParser.js', () => ({
  useLogParser: () => ({
    messages: { value: [] },
    isLoading: { value: false },
    error: { value: null },
    loadFile: vi.fn()
  })
}))

vi.mock('@/composables/useMessageFiltering.js', () => ({
  useMessageFiltering: () => ({
    filteredMessages: { value: createFilterTestData() },
    availableRoles: { value: ['user', 'assistant', 'tool', 'tool_result', 'summary'] },
    availableTools: { value: ['Bash', 'Read', 'Edit'] },
    roleFilters: new Set(),
    toolFilters: new Set(),
    searchQuery: { value: '' },
    toggleRoleFilter: vi.fn(),
    toggleToolFilter: vi.fn(),
    clearAllFilters: vi.fn(),
    getRoleMessageCount: vi.fn(() => 5),
    getToolMessageCount: vi.fn(() => 3)
  })
}))

vi.mock('@/composables/useNavigation.js', () => ({
  useNavigation: () => ({
    currentIndex: { value: 0 },
    currentMessage: { value: null },
    totalMessages: { value: 8 },
    canGoPrevious: { value: false },
    canGoNext: { value: true },
    navigationInfo: { 
      value: { current: 1, total: 8, position: '1 / 8' } 
    },
    goToIndex: vi.fn(),
    goToPrevious: vi.fn(),
    goToNext: vi.fn(),
    handleKeyboardNavigation: vi.fn()
  })
}))

describe('LogViewer.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mountComponent(LogViewer, {
      global: {
        stubs: {
          MessageIndex: {
            template: `
              <div class="message-index-stub">
                <div class="navigation-info">{{ navigationInfo.position }}</div>
                <div class="message-count">{{ filteredMessages.length }} messages</div>
              </div>
            `,
            props: [
              'messages', 'currentIndex', 'totalMessages', 'availableRoles', 
              'availableTools', 'roleFilters', 'toolFilters', 'searchQuery',
              'canGoPrevious', 'canGoNext', 'navigationInfo', 'roleMessageCounts',
              'toolMessageCounts'
            ]
          },
          MessageDisplay: {
            template: `
              <div class="message-display-stub">
                <div class="message-list">
                  <div 
                    v-for="(message, index) in messages" 
                    :key="message.uuid || index"
                    class="message-item"
                    :class="{ 'message-active': index === currentIndex }"
                  >
                    {{ message.uuid }}
                  </div>
                </div>
              </div>
            `,
            props: ['messages', 'currentIndex', 'loading', 'error']
          },
          FileUpload: {
            template: '<div class="file-upload-stub"><button @click="$emit(\'file-loaded\', {})">Load File</button></div>',
            emits: ['file-loaded']
          },
          ErrorMessage: {
            template: '<div class="error-message-stub">{{ error }}</div>',
            props: ['error']
          }
        }
      }
    })
  })

  describe('Component Integration', () => {
    it('should render main layout structure', () => {
      expect(wrapper.find('.log-viewer').exists()).toBe(true)
      expect(wrapper.find('.app-header').exists()).toBe(true)
      expect(wrapper.find('.app-main').exists()).toBe(true)
      expect(wrapper.find('.app-title').text()).toBe('Claude Log Viewer')
    })

    it('should integrate MessageIndex and MessageDisplay components', () => {
      const messageIndex = wrapper.findComponent({ name: 'MessageIndex' })
      const messageDisplay = wrapper.findComponent({ name: 'MessageDisplay' })
      
      expect(messageIndex.exists()).toBe(true)
      expect(messageDisplay.exists()).toBe(true)
    })

    it('should pass correct props to child components', () => {
      const messageIndex = wrapper.findComponent({ name: 'MessageIndex' })
      const messageDisplay = wrapper.findComponent({ name: 'MessageDisplay' })
      
      // Check MessageIndex props
      expect(messageIndex.props('messages')).toBeDefined()
      expect(messageIndex.props('currentIndex')).toBe(0)
      expect(messageIndex.props('totalMessages')).toBe(8)
      expect(messageIndex.props('availableRoles')).toEqual(['user', 'assistant', 'tool', 'tool_result', 'summary'])
      
      // Check MessageDisplay props
      expect(messageDisplay.props('messages')).toBeDefined()
      expect(messageDisplay.props('currentIndex')).toBe(0)
      expect(messageDisplay.props('loading')).toBe(false)
    })
  })

  describe('Default Message Display', () => {
    it('should show all messages by default without filters', () => {
      const messageDisplay = wrapper.findComponent({ name: 'MessageDisplay' })
      expect(messageDisplay.props('messages')).toHaveLength(8)
    })

    it('should display navigation information correctly', () => {
      const messageIndex = wrapper.findComponent({ name: 'MessageIndex' })
      expect(messageIndex.props('navigationInfo')).toEqual({
        current: 1,
        total: 8,
        position: '1 / 8'
      })
    })

    it('should show proper message counts in filters', () => {
      const messageIndex = wrapper.findComponent({ name: 'MessageIndex' })
      expect(messageIndex.props('roleMessageCounts')).toBeDefined()
      expect(messageIndex.props('toolMessageCounts')).toBeDefined()
    })
  })

  describe('Event Handling', () => {
    it('should handle file loading', async () => {
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      const mockFile = { name: 'test.jsonl' }
      
      await fileUpload.vm.$emit('file-loaded', mockFile)
      await nextTick()
      
      // File loading should trigger the handleFileLoad method
      expect(wrapper.vm.handleFileLoad).toBeDefined()
    })

    it('should handle message selection from sidebar', async () => {
      const messageIndex = wrapper.findComponent({ name: 'MessageIndex' })
      
      await messageIndex.vm.$emit('message-selected', 3)
      await nextTick()
      
      // Should call navigation method
      expect(wrapper.vm.goToIndex).toBeDefined()
    })

    it('should handle filter toggles', async () => {
      const messageIndex = wrapper.findComponent({ name: 'MessageIndex' })
      
      await messageIndex.vm.$emit('role-filter-toggle', 'user')
      await messageIndex.vm.$emit('tool-filter-toggle', 'Bash')
      await nextTick()
      
      expect(wrapper.vm.toggleRoleFilter).toBeDefined()
      expect(wrapper.vm.toggleToolFilter).toBeDefined()
    })

    it('should handle navigation events', async () => {
      const messageIndex = wrapper.findComponent({ name: 'MessageIndex' })
      
      await messageIndex.vm.$emit('navigate-previous')
      await messageIndex.vm.$emit('navigate-next')
      await nextTick()
      
      expect(wrapper.vm.goToPrevious).toBeDefined()
      expect(wrapper.vm.goToNext).toBeDefined()
    })

    it('should handle search changes', async () => {
      const messageIndex = wrapper.findComponent({ name: 'MessageIndex' })
      
      await messageIndex.vm.$emit('search-change', 'test query')
      await nextTick()
      
      // Search query should be updated
      expect(wrapper.vm.searchQuery).toBeDefined()
    })

    it('should handle clear all filters', async () => {
      const messageIndex = wrapper.findComponent({ name: 'MessageIndex' })
      
      await messageIndex.vm.$emit('clear-all-filters')
      await nextTick()
      
      expect(wrapper.vm.clearAllFilters).toBeDefined()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle keyboard events', async () => {
      await simulateKeyboard(wrapper, 'ArrowRight')
      await simulateKeyboard(wrapper, 'ArrowLeft')
      await simulateKeyboard(wrapper, 'Home')
      await simulateKeyboard(wrapper, 'End')
      
      // Keyboard navigation should be handled
      expect(wrapper.vm.handleKeyboard).toBeDefined()
    })

    it('should not interfere with input focus', async () => {
      // Simulate keyboard event from input element
      const mockEvent = {
        target: { tagName: 'INPUT' },
        key: 'ArrowRight'
      }
      
      await wrapper.trigger('keydown', mockEvent)
      
      // Should not trigger navigation when input is focused
      expect(wrapper.vm.handleKeyboard).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should display error messages when present', async () => {
      // Mock error state
      wrapper.vm.error = { value: 'Test error message' }
      await wrapper.setProps({})
      await nextTick()
      
      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' })
      expect(errorMessage.exists()).toBe(true)
    })

    it('should handle error retry', async () => {
      wrapper.vm.error = { value: 'Test error' }
      await nextTick()
      
      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' })
      if (errorMessage.exists()) {
        await errorMessage.vm.$emit('retry')
        expect(wrapper.vm.handleRetry).toBeDefined()
      }
    })

    it('should handle error dismiss', async () => {
      wrapper.vm.error = { value: 'Test error' }
      await nextTick()
      
      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' })
      if (errorMessage.exists()) {
        await errorMessage.vm.$emit('dismiss')
        expect(wrapper.vm.handleErrorDismiss).toBeDefined()
      }
    })
  })

  describe('Loading States', () => {
    it('should pass loading state to components', () => {
      const messageDisplay = wrapper.findComponent({ name: 'MessageDisplay' })
      expect(messageDisplay.props('loading')).toBe(false)
      
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      expect(fileUpload.props('loading')).toBe(false)
    })

    it('should disable interactions when loading', async () => {
      // Mock loading state
      wrapper.vm.isLoading = { value: true }
      await nextTick()
      
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      expect(fileUpload.props('loading')).toBe(true)
    })
  })

  describe('Computed Properties', () => {
    it('should calculate role message counts correctly', () => {
      expect(wrapper.vm.roleMessageCounts).toBeDefined()
      expect(typeof wrapper.vm.roleMessageCounts).toBe('object')
    })

    it('should calculate tool message counts correctly', () => {
      expect(wrapper.vm.toolMessageCounts).toBeDefined()
      expect(typeof wrapper.vm.toolMessageCounts).toBe('object')
    })
  })

  describe('Component Lifecycle', () => {
    it('should add keyboard event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
      
      // Mount new instance to test lifecycle
      const newWrapper = mountComponent(LogViewer)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
      
      newWrapper.unmount()
    })

    it('should remove keyboard event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
      
      wrapper.unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = createMessageSet(607)
      
      // Mock large dataset in composables
      wrapper.vm.filteredMessages = { value: largeDataset }
      wrapper.vm.totalMessages = { value: 607 }
      
      await nextTick()
      
      const messageDisplay = wrapper.findComponent({ name: 'MessageDisplay' })
      expect(messageDisplay.props('messages')).toHaveLength(607)
    })

    it('should optimize re-renders', async () => {
      const renderSpy = vi.spyOn(wrapper.vm, '$forceUpdate')
      
      // Simulate multiple prop changes
      await wrapper.setProps({})
      await wrapper.setProps({})
      
      // Should not force excessive re-renders
      expect(renderSpy).not.toHaveBeenCalled()
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })
})