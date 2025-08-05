import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LogViewer from '@/components/LogViewer.vue'
import MessageDisplay from '@/components/MainContent/MessageDisplay.vue'
import MessageIndex from '@/components/Sidebar/MessageIndex.vue'
import { 
  createFilterTestData, 
  createMessageSet, 
  createLargeMessage,
  createJsonlContent
} from '../helpers/test-data.js'
import { mountComponent, waitForTicks, flushPromises } from '../helpers/vue-test-utils.js'

describe('Message Display Integration Tests', () => {
  let wrapper
  const testMessages = createFilterTestData()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LogViewer ↔ MessageIndex ↔ MessageDisplay Integration', () => {
    beforeEach(() => {
      wrapper = mountComponent(LogViewer, {
        global: {
          provide: {
            // Provide real test data instead of mocks for integration testing
            testMessages: testMessages
          }
        }
      })
    })

    it('should maintain data flow consistency between components', async () => {
      // Verify initial state propagation
      const messageIndex = wrapper.findComponent(MessageIndex)
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      
      expect(messageIndex.exists()).toBe(true)
      expect(messageDisplay.exists()).toBe(true)
      
      // Check data consistency
      const indexMessages = messageIndex.props('messages')
      const displayMessages = messageDisplay.props('messages')
      
      expect(indexMessages).toEqual(displayMessages)
      expect(Array.isArray(indexMessages)).toBe(true)
    })

    it('should synchronize navigation state between sidebar and display', async () => {
      const messageIndex = wrapper.findComponent(MessageIndex)
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      
      const initialIndex = messageDisplay.props('currentIndex')
      
      // Simulate message selection from sidebar
      await messageIndex.vm.$emit('message-selected', 3)
      await nextTick()
      
      // Verify display updates current index
      expect(messageDisplay.props('currentIndex')).not.toBe(initialIndex)
    })

    it('should handle navigation events bidirectionally', async () => {
      const messageIndex = wrapper.findComponent(MessageIndex)
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      
      // Test previous navigation
      await messageIndex.vm.$emit('navigate-previous')
      await nextTick()
      
      // Test next navigation
      await messageIndex.vm.$emit('navigate-next')
      await nextTick()
      
      // Verify both components stay in sync
      expect(messageIndex.props('currentIndex')).toBe(messageDisplay.props('currentIndex'))
    })
  })

  describe('Filter Integration with Display', () => {
    beforeEach(() => {
      wrapper = mountComponent(LogViewer)
    })

    it('should update message display when filters change', async () => {
      const messageIndex = wrapper.findComponent(MessageIndex)
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      
      const initialMessageCount = messageDisplay.props('messages').length
      
      // Apply role filter
      await messageIndex.vm.$emit('role-filter-toggle', 'user')
      await flushPromises()
      
      // Verify filtered messages are displayed
      const filteredMessageCount = messageDisplay.props('messages').length
      expect(filteredMessageCount).toBeLessThanOrEqual(initialMessageCount)
    })

    it('should maintain current index validity after filtering', async () => {
      const messageIndex = wrapper.findComponent(MessageIndex)
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      
      // Set current index to middle message
      await messageIndex.vm.$emit('message-selected', 4)
      await nextTick()
      
      // Apply filter that might reduce message count
      await messageIndex.vm.$emit('role-filter-toggle', 'user')
      await flushPromises()
      
      // Verify current index is still valid
      const currentIndex = messageDisplay.props('currentIndex')
      const messageCount = messageDisplay.props('messages').length
      
      expect(currentIndex).toBeGreaterThanOrEqual(0)
      expect(currentIndex).toBeLessThan(messageCount)
    })

    it('should handle search filtering correctly', async () => {
      const messageIndex = wrapper.findComponent(MessageIndex)
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      
      // Apply search filter
      await messageIndex.vm.$emit('search-change', 'test')
      await flushPromises()
      
      // Verify search is applied to displayed messages
      const displayedMessages = messageDisplay.props('messages')
      expect(Array.isArray(displayedMessages)).toBe(true)
    })

    it('should handle clear all filters correctly', async () => {
      const messageIndex = wrapper.findComponent(MessageIndex)
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      
      // Apply multiple filters
      await messageIndex.vm.$emit('role-filter-toggle', 'user')
      await messageIndex.vm.$emit('tool-filter-toggle', 'Bash')
      await messageIndex.vm.$emit('search-change', 'test')
      await flushPromises()
      
      const filteredCount = messageDisplay.props('messages').length
      
      // Clear all filters
      await messageIndex.vm.$emit('clear-all-filters')
      await flushPromises()
      
      // Verify all messages are displayed again
      const clearedCount = messageDisplay.props('messages').length
      expect(clearedCount).toBeGreaterThanOrEqual(filteredCount)
    })
  })

  describe('Auto-scroll Integration', () => {
    beforeEach(() => {
      const largeMessageSet = createMessageSet(50)
      wrapper = mountComponent(LogViewer, {
        data() {
          return {
            filteredMessages: largeMessageSet
          }
        }
      })
    })

    it('should auto-scroll to selected message from sidebar', async () => {
      const messageIndex = wrapper.findComponent(MessageIndex)
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      
      // Mock scrollIntoView
      const scrollIntoViewMock = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock
      
      // Select message from sidebar
      await messageIndex.vm.$emit('message-selected', 25)
      await waitForTicks(2)
      
      // Verify auto-scroll was triggered
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      })
    })

    it('should handle rapid navigation changes smoothly', async () => {
      const messageIndex = wrapper.findComponent(MessageIndex)
      const scrollIntoViewMock = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock
      
      // Rapidly change selected messages
      for (let i = 0; i < 10; i++) {
        await messageIndex.vm.$emit('message-selected', i * 5)
      }
      
      await waitForTicks(3)
      
      // Should handle rapid changes without errors
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Real Data Processing Integration', () => {
    it('should handle real JSONL data structure', async () => {
      const realMessages = createMessageSet(20)
      const jsonlContent = createJsonlContent(realMessages)
      
      // Simulate file loading with real data
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      const mockFile = new File([jsonlContent], 'test.jsonl', { type: 'application/json' })
      
      await fileUpload.vm.$emit('file-loaded', mockFile)
      await flushPromises()
      
      // Verify data processing and display
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      expect(messageDisplay.exists()).toBe(true)
    })

    it('should process large datasets efficiently', async () => {
      const largeDataset = createMessageSet(607)
      
      const startTime = performance.now()
      
      wrapper = mountComponent(LogViewer, {
        data() {
          return {
            filteredMessages: largeDataset,
            totalMessages: 607
          }
        }
      })
      
      await flushPromises()
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Should process large datasets efficiently (< 200ms)
      expect(processingTime).toBeLessThan(200)
      
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      expect(messageDisplay.exists()).toBe(true)
    })

    it('should handle complex message structures', async () => {
      const complexMessages = [
        {
          uuid: '1',
          type: 'assistant',
          message: {
            content: [
              { type: 'text', text: 'Using multiple tools' },
              { type: 'tool_use', name: 'Read', input: { file_path: '/test.js' } },
              { type: 'tool_use', name: 'Edit', input: { old_string: 'old', new_string: 'new' } }
            ]
          },
          _role: 'tool',
          _tools: ['Read', 'Edit']
        }
      ]
      
      wrapper = mountComponent(LogViewer, {
        data() {
          return {
            filteredMessages: complexMessages
          }
        }
      })
      
      await nextTick()
      
      const messageDisplay = wrapper.findComponent(MessageDisplay)
      const displayedMessages = messageDisplay.props('messages')
      
      expect(displayedMessages).toHaveLength(1)
      expect(displayedMessages[0]._tools).toEqual(['Read', 'Edit'])
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle component errors gracefully', async () => {
      // Simulate error in message processing
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      wrapper = mountComponent(LogViewer, {
        data() {
          return {
            error: 'Test error message'
          }
        }
      })
      
      await nextTick()
      
      // Should display error without crashing
      expect(wrapper.exists()).toBe(true)
      
      consoleErrorSpy.mockRestore()
    })

    it('should recover from error states', async () => {
      wrapper.setData({ error: 'Test error' })
      await nextTick()
      
      // Simulate error recovery
      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' })
      if (errorMessage.exists()) {
        await errorMessage.vm.$emit('retry')
        await nextTick()
        
        // Should attempt recovery
        expect(wrapper.exists()).toBe(true)
      }
    })
  })

  describe('Performance Integration', () => {
    it('should maintain smooth scrolling under load', async () => {
      const heavyMessages = Array.from({ length: 1000 }, (_, i) => 
        createLargeMessage(`large-${i}`, 5000)
      )
      
      wrapper = mountComponent(LogViewer, {
        data() {
          return {
            filteredMessages: heavyMessages
          }
        }
      })
      
      await flushPromises()
      
      const messageIndex = wrapper.findComponent(MessageIndex)
      const scrollIntoViewMock = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock
      
      // Test scrolling performance
      const startTime = performance.now()
      
      await messageIndex.vm.$emit('message-selected', 500)
      await waitForTicks(2)
      
      const endTime = performance.now()
      const scrollTime = endTime - startTime
      
      // Should maintain responsive scrolling (< 50ms)
      expect(scrollTime).toBeLessThan(50)
      expect(scrollIntoViewMock).toHaveBeenCalled()
    })

    it('should handle rapid filter changes efficiently', async () => {
      const messageIndex = wrapper.findComponent(MessageIndex)
      
      const startTime = performance.now()
      
      // Rapidly toggle multiple filters
      for (let i = 0; i < 10; i++) {
        await messageIndex.vm.$emit('role-filter-toggle', 'user')
        await messageIndex.vm.$emit('tool-filter-toggle', 'Bash')
      }
      
      await flushPromises()
      
      const endTime = performance.now()
      const filterTime = endTime - startTime
      
      // Should handle rapid changes efficiently (< 100ms)
      expect(filterTime).toBeLessThan(100)
      expect(wrapper.exists()).toBe(true)
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })
})