import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LogViewer from '@/components/LogViewer.vue'

describe('Log Processing Integration', () => {
  let wrapper
  
  beforeEach(() => {
    wrapper = mount(LogViewer, {
      global: {
        stubs: {
          'MessageIndex': {
            template: '<div class="message-index-stub">{{ messages?.length || 0 }} messages</div>',
            props: ['messages', 'currentIndex', 'totalMessages', 'availableRoles', 'availableTools', 'roleFilters', 'toolFilters', 'searchQuery', 'canGoPrevious', 'canGoNext', 'navigationInfo']
          },
          'MessageDisplay': {
            template: '<div class="message-display-stub">{{ message?.uuid || "No message" }}</div>',
            props: ['message', 'loading', 'error']
          },
          'ErrorMessage': {
            template: '<div class="error-stub">{{ error }}</div>',
            props: ['error']
          }
        }
      }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('complete file processing workflow', () => {
    it('should process valid JSONL file from upload to display', async () => {
      const jsonlContent = `{"uuid": "1", "type": "user", "message": {"content": "Hello"}}
{"uuid": "2", "type": "assistant", "message": {"content": "Hi there"}}
{"uuid": "3", "type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Bash", "input": {"command": "ls"}}]}}`
      
      const file = createMockFile(jsonlContent, 'test.jsonl')
      
      // Find FileUpload component and emit file-loaded event
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      await fileUpload.vm.$emit('file-loaded', file)
      await nextTick()
      await waitForNextTick() // Allow parsing to complete
      
      // Check that messages were processed
      const messageIndex = wrapper.find('.message-index-stub')
      expect(messageIndex.text()).toContain('3 messages')
      
      // Check that first message is displayed
      const messageDisplay = wrapper.find('.message-display-stub')
      expect(messageDisplay.text()).toContain('1')
      
      // Verify no errors
      expect(wrapper.find('.error-stub').exists()).toBe(false)
    })

    it('should handle parsing errors gracefully', async () => {
      const invalidJsonl = `{"uuid": "1", "type": "user"}
invalid json line
{"uuid": "2", "type": "assistant"}`
      
      const file = createMockFile(invalidJsonl, 'test.jsonl')
      
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      await fileUpload.vm.$emit('file-loaded', file)
      await nextTick()
      await waitForNextTick()
      
      // Should still process valid lines
      const messageIndex = wrapper.find('.message-index-stub')
      expect(messageIndex.text()).toContain('2 messages')
      
      // Should not show error to user (parsing errors are logged)
      expect(wrapper.find('.error-stub').exists()).toBe(false)
    })

    it('should show loading state during file processing', async () => {
      const file = createMockFile('{"uuid": "1"}', 'test.jsonl')
      
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      fileUpload.vm.$emit('file-loaded', file)
      
      // Check loading state immediately
      expect(fileUpload.props('loading')).toBe(true)
      
      await nextTick()
      await waitForNextTick()
      
      // Loading should be false after processing
      expect(fileUpload.props('loading')).toBe(false)
    })

    it('should reset navigation when new file is loaded', async () => {
      // Load first file
      const firstFile = createMockFile('{"uuid": "1"}\n{"uuid": "2"}', 'first.jsonl')
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      
      await fileUpload.vm.$emit('file-loaded', firstFile)
      await nextTick()
      await waitForNextTick()
      
      // Navigate to second message
      const messageIndex = wrapper.find('.message-index-stub')
      await messageIndex.vm.$emit('navigate-next')
      await nextTick()
      
      // Verify we're at second message
      const messageDisplay = wrapper.find('.message-display-stub')
      expect(messageDisplay.text()).toContain('2')
      
      // Load second file
      const secondFile = createMockFile('{"uuid": "3"}\n{"uuid": "4"}', 'second.jsonl')
      await fileUpload.vm.$emit('file-loaded', secondFile)
      await nextTick()
      await waitForNextTick()
      
      // Should be back at first message
      expect(messageDisplay.text()).toContain('3')
    })
  })

  describe('filtering and navigation integration', () => {
    beforeEach(async () => {
      const jsonlContent = `{"uuid": "1", "type": "user", "message": {"content": "Hello"}}
{"uuid": "2", "type": "assistant", "message": {"content": "Response"}}
{"uuid": "3", "type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Bash"}]}}
{"uuid": "4", "toolUseResult": {"content": "Output"}}`
      
      const file = createMockFile(jsonlContent, 'test.jsonl')
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      
      await fileUpload.vm.$emit('file-loaded', file)
      await nextTick()
      await waitForNextTick()
    })

    it('should update navigation when filters are applied', async () => {
      const messageIndex = wrapper.find('.message-index-stub')
      
      // Apply role filter for 'assistant'
      await messageIndex.vm.$emit('role-filter-toggle', 'assistant')
      await nextTick()
      
      // Should show only assistant messages (2 messages)
      expect(messageIndex.text()).toContain('2 messages')
      
      // Navigation should work within filtered results
      await messageIndex.vm.$emit('navigate-next')
      await nextTick()
      
      const messageDisplay = wrapper.find('.message-display-stub')
      expect(messageDisplay.text()).not.toContain('1') // User message should be filtered out
    })

    it('should handle search filtering with navigation', async () => {
      const messageIndex = wrapper.find('.message-index-stub')
      
      // Apply search filter
      await messageIndex.vm.$emit('search-change', 'Hello')
      await nextTick()
      
      // Should show only matching message
      expect(messageIndex.text()).toContain('1 messages')
      
      // Should display the matching message
      const messageDisplay = wrapper.find('.message-display-stub')
      expect(messageDisplay.text()).toContain('1')
    })

    it('should combine multiple filters correctly', async () => {
      const messageIndex = wrapper.find('.message-index-stub')
      
      // Apply role filter and tool filter
      await messageIndex.vm.$emit('role-filter-toggle', 'tool')
      await messageIndex.vm.$emit('tool-filter-toggle', 'Bash')
      await nextTick()
      
      // Should show only tool messages with Bash
      expect(messageIndex.text()).toContain('1 messages')
      
      const messageDisplay = wrapper.find('.message-display-stub')
      expect(messageDisplay.text()).toContain('3')
    })

    it('should handle empty filter results', async () => {
      const messageIndex = wrapper.find('.message-index-stub')
      
      // Apply filter that matches nothing
      await messageIndex.vm.$emit('search-change', 'nonexistent')
      await nextTick()
      
      expect(messageIndex.text()).toContain('0 messages')
      
      const messageDisplay = wrapper.find('.message-display-stub')
      expect(messageDisplay.text()).toContain('No message')
    })
  })

  describe('keyboard navigation integration', () => {
    beforeEach(async () => {
      const jsonlContent = `{"uuid": "1", "type": "user"}
{"uuid": "2", "type": "assistant"}
{"uuid": "3", "type": "tool_result"}`
      
      const file = createMockFile(jsonlContent, 'test.jsonl')
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      
      await fileUpload.vm.$emit('file-loaded', file)
      await nextTick()
      await waitForNextTick()
    })

    it('should handle keyboard navigation events', async () => {
      // Simulate arrow right key press
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      Object.defineProperty(keyEvent, 'target', { value: { tagName: 'DIV' } })
      
      await wrapper.trigger('keydown', keyEvent)
      await nextTick()
      
      const messageDisplay = wrapper.find('.message-display-stub')
      expect(messageDisplay.text()).toContain('2')
    })

    it('should ignore keyboard events on input elements', async () => {
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      Object.defineProperty(keyEvent, 'target', { value: { tagName: 'INPUT' } })
      
      await wrapper.trigger('keydown', keyEvent)
      await nextTick()
      
      // Should still be on first message
      const messageDisplay = wrapper.find('.message-display-stub')
      expect(messageDisplay.text()).toContain('1')
    })

    it('should handle Home and End keys', async () => {
      // Navigate to middle
      const messageIndex = wrapper.find('.message-index-stub')
      await messageIndex.vm.$emit('navigate-next')
      await nextTick()
      
      // Press End key
      const endEvent = new KeyboardEvent('keydown', { key: 'End' })
      Object.defineProperty(endEvent, 'target', { value: { tagName: 'DIV' } })
      
      await wrapper.trigger('keydown', endEvent)
      await nextTick()
      
      const messageDisplay = wrapper.find('.message-display-stub')
      expect(messageDisplay.text()).toContain('3')
      
      // Press Home key
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' })
      Object.defineProperty(homeEvent, 'target', { value: { tagName: 'DIV' } })
      
      await wrapper.trigger('keydown', homeEvent)
      await nextTick()
      
      expect(messageDisplay.text()).toContain('1')
    })
  })

  describe('error handling integration', () => {
    it('should display file read errors', async () => {
      const file = createMockFile('content', 'error.jsonl') // This triggers error in mock
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      
      await fileUpload.vm.$emit('file-loaded', file)
      await nextTick()
      await waitForNextTick()
      
      const errorMessage = wrapper.find('.error-stub')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('Failed to read file')
    })

    it('should handle retry functionality', async () => {
      // Simulate error state
      const file = createMockFile('content', 'error.jsonl')
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      
      await fileUpload.vm.$emit('file-loaded', file)
      await nextTick()
      await waitForNextTick()
      
      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' })
      expect(errorMessage.exists()).toBe(true)
      
      // Emit retry event
      await errorMessage.vm.$emit('retry')
      await nextTick()
      
      // Error should be cleared
      expect(wrapper.find('.error-stub').exists()).toBe(false)
    })

    it('should handle error dismissal', async () => {
      const file = createMockFile('content', 'error.jsonl')
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      
      await fileUpload.vm.$emit('file-loaded', file)
      await nextTick()
      await waitForNextTick()
      
      const errorMessage = wrapper.findComponent({ name: 'ErrorMessage' })
      await errorMessage.vm.$emit('dismiss')
      await nextTick()
      
      expect(wrapper.find('.error-stub').exists()).toBe(false)
    })
  })

  describe('performance integration', () => {
    it('should handle large files efficiently', async () => {
      // Create a large JSONL file (1000 messages)
      const messages = Array.from({ length: 1000 }, (_, i) => 
        JSON.stringify({ uuid: `${i + 1}`, type: 'user', message: { content: `Message ${i + 1}` } })
      )
      const largeJsonl = messages.join('\n')
      
      const file = createMockFile(largeJsonl, 'large.jsonl')
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      
      const startTime = performance.now()
      
      await fileUpload.vm.$emit('file-loaded', file)
      await nextTick()
      await waitForNextTick()
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      
      // Should process within reasonable time (adjust threshold as needed)
      expect(processingTime).toBeLessThan(1000) // 1 second
      
      const messageIndex = wrapper.find('.message-index-stub')
      expect(messageIndex.text()).toContain('1000 messages')
    })

    it('should maintain responsiveness during navigation', async () => {
      const jsonlContent = Array.from({ length: 100 }, (_, i) => 
        JSON.stringify({ uuid: `${i + 1}`, type: 'user' })
      ).join('\n')
      
      const file = createMockFile(jsonlContent, 'test.jsonl')
      const fileUpload = wrapper.findComponent({ name: 'FileUpload' })
      
      await fileUpload.vm.$emit('file-loaded', file)
      await nextTick()
      await waitForNextTick()
      
      // Rapid navigation should be responsive
      const messageIndex = wrapper.find('.message-index-stub')
      
      const startTime = performance.now()
      for (let i = 0; i < 10; i++) {
        await messageIndex.vm.$emit('navigate-next')
        await nextTick()
      }
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100) // 100ms for 10 navigations
    })
  })
})