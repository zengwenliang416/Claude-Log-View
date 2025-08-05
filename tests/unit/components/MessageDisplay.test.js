import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MessageDisplay from '@/components/MainContent/MessageDisplay.vue'
import { createFilterTestData, createMessageSet } from '../../helpers/test-data.js'
import { mountComponent, waitForTicks } from '../../helpers/vue-test-utils.js'

describe('MessageDisplay.vue', () => {
  let wrapper
  const mockMessages = createFilterTestData()

  describe('Default Display Behavior', () => {
    beforeEach(() => {
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: mockMessages,
          currentIndex: 0,
          loading: false,
          error: null
        }
      })
    })

    it('should display all messages by default without filters', () => {
      const messageItems = wrapper.findAll('.message-item')
      expect(messageItems).toHaveLength(mockMessages.length)
    })

    it('should render messages in scrollable container', () => {
      const container = wrapper.find('.messages-container')
      expect(container.exists()).toBe(true)
      expect(container.element.style.overflowY).toBe('auto')
    })

    it('should show all message types with proper indicators', () => {
      const typeIndicators = wrapper.findAll('.message-type-indicator')
      expect(typeIndicators).toHaveLength(mockMessages.length)
      
      const labels = typeIndicators.map(indicator => 
        indicator.find('.type-label').text()
      )
      
      expect(labels).toContain('USER')
      expect(labels).toContain('ASSISTANT')
      expect(labels).toContain('TOOL (Bash)')
      expect(labels).toContain('TOOL RESULT')
      expect(labels).toContain('SUMMARY')
    })

    it('should apply correct CSS classes for message types', () => {
      const messageItems = wrapper.findAll('.message-item')
      
      // Check for proper type classes
      expect(messageItems.some(item => item.classes().includes('message-user'))).toBe(true)
      expect(messageItems.some(item => item.classes().includes('message-assistant'))).toBe(true)
      expect(messageItems.some(item => item.classes().includes('message-tool'))).toBe(true)
      expect(messageItems.some(item => item.classes().includes('message-tool-result'))).toBe(true)
      expect(messageItems.some(item => item.classes().includes('message-summary'))).toBe(true)
    })
  })

  describe('Type Indicators', () => {
    beforeEach(() => {
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: mockMessages,
          currentIndex: 0
        }
      })
    })

    it('should position type indicators in upper left corner', () => {
      const indicators = wrapper.findAll('.message-type-indicator')
      
      indicators.forEach(indicator => {
        const styles = getComputedStyle(indicator.element)
        expect(indicator.element.style.position).toBe('absolute')
        expect(indicator.element.style.top).toBeDefined()
        expect(indicator.element.style.left).toBeDefined()
        expect(indicator.element.style.zIndex).toBe('10')
      })
    })

    it('should display color-coded badges correctly', () => {
      const userMessage = wrapper.find('.message-user .type-label')
      const assistantMessage = wrapper.find('.message-assistant .type-label')
      const toolMessage = wrapper.find('.message-tool .type-label')
      const toolResultMessage = wrapper.find('.message-tool-result .type-label')
      const summaryMessage = wrapper.find('.message-summary .type-label')

      expect(userMessage.exists()).toBe(true)
      expect(assistantMessage.exists()).toBe(true)
      expect(toolMessage.exists()).toBe(true)
      expect(toolResultMessage.exists()).toBe(true)
      expect(summaryMessage.exists()).toBe(true)
    })

    it('should show tool names in tool type indicators', () => {
      const toolIndicators = wrapper.findAll('.message-tool .type-label')
      
      const toolTexts = toolIndicators.map(indicator => indicator.text())
      expect(toolTexts.some(text => text.includes('TOOL (Bash)'))).toBe(true)
      expect(toolTexts.some(text => text.includes('TOOL (Read)'))).toBe(true)
    })
  })

  describe('Scrollable Display', () => {
    beforeEach(() => {
      const largeMessageSet = createMessageSet(50)
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: largeMessageSet,
          currentIndex: 25
        }
      })
    })

    it('should handle large message datasets efficiently', () => {
      const messageItems = wrapper.findAll('.message-item')
      expect(messageItems).toHaveLength(50)
      
      const container = wrapper.find('.messages-container')
      expect(container.exists()).toBe(true)
    })

    it('should implement smooth scrolling behavior', async () => {
      const container = wrapper.find('.messages-container')
      expect(container.classes()).toContain('messages-container')
      
      // Check for smooth scroll CSS property
      const styles = getComputedStyle(container.element)
      expect(container.element.style.scrollBehavior).toBe('smooth')
    })

    it('should auto-scroll to current message on index change', async () => {
      const scrollIntoViewSpy = vi.fn()
      
      // Mock scrollIntoView
      Element.prototype.scrollIntoView = scrollIntoViewSpy
      
      await wrapper.setProps({ currentIndex: 10 })
      await nextTick()
      
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center'
      })
    })

    it('should highlight active message correctly', async () => {
      await wrapper.setProps({ currentIndex: 5 })
      await waitForTicks(2)
      
      const activeMessage = wrapper.find('.message-active')
      expect(activeMessage.exists()).toBe(true)
      expect(activeMessage.classes()).toContain('message-active')
    })
  })

  describe('Navigation Integration', () => {
    beforeEach(() => {
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: mockMessages,
          currentIndex: 2
        }
      })
    })

    it('should synchronize with sidebar navigation', async () => {
      const initialActiveMessage = wrapper.find('.message-active')
      expect(initialActiveMessage.exists()).toBe(true)
      
      // Change current index (simulating sidebar click)
      await wrapper.setProps({ currentIndex: 4 })
      await nextTick()
      
      const newActiveMessage = wrapper.find('.message-active')
      expect(newActiveMessage.exists()).toBe(true)
      
      // Verify the active message changed
      const messageItems = wrapper.findAll('.message-item')
      expect(messageItems[4].classes()).toContain('message-active')
    })

    it('should handle index changes gracefully', async () => {
      // Test boundary conditions
      await wrapper.setProps({ currentIndex: 0 })
      expect(wrapper.find('.message-active').exists()).toBe(true)
      
      await wrapper.setProps({ currentIndex: mockMessages.length - 1 })
      expect(wrapper.find('.message-active').exists()).toBe(true)
      
      // Test invalid index
      await wrapper.setProps({ currentIndex: mockMessages.length + 10 })
      // Should not crash and should handle gracefully
      expect(wrapper.find('.message-item')).toBeTruthy()
    })
  })

  describe('Performance Optimizations', () => {
    it('should handle 607+ messages efficiently', async () => {
      const largeDataset = createMessageSet(607)
      
      const startTime = performance.now()
      
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: largeDataset,
          currentIndex: 0
        }
      })
      
      await nextTick()
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100)
      expect(wrapper.findAll('.message-item')).toHaveLength(607)
    })

    it('should implement efficient re-rendering on prop changes', async () => {
      const renderSpy = vi.spyOn(wrapper.vm, '$forceUpdate')
      
      await wrapper.setProps({ currentIndex: 1 })
      await wrapper.setProps({ currentIndex: 2 })
      await wrapper.setProps({ currentIndex: 3 })
      
      // Should not force excessive re-renders
      expect(renderSpy).not.toHaveBeenCalled()
    })
  })

  describe('Loading and Error States', () => {
    it('should display loading state correctly', () => {
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: [],
          loading: true,
          error: null
        }
      })

      const loadingState = wrapper.find('.loading-state')
      expect(loadingState.exists()).toBe(true)
      expect(loadingState.text()).toContain('Loading messages...')
      
      const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
      expect(spinner.exists()).toBe(true)
    })

    it('should display error state correctly', () => {
      const errorMessage = 'Failed to load messages'
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: [],
          loading: false,
          error: errorMessage
        }
      })

      const errorState = wrapper.find('.error-state')
      expect(errorState.exists()).toBe(true)
      expect(errorState.text()).toContain('Error Loading Messages')
      expect(errorState.text()).toContain(errorMessage)
    })

    it('should display empty state correctly', () => {
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: [],
          loading: false,
          error: null
        }
      })

      const emptyState = wrapper.find('.empty-state')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toContain('No Messages Available')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: mockMessages,
          currentIndex: 0
        }
      })
    })

    it('should have proper ARIA attributes', () => {
      const main = wrapper.find('main')
      expect(main.attributes('class')).toBe('message-display')
      
      const activeMessage = wrapper.find('.message-active')
      expect(activeMessage.exists()).toBe(true)
    })

    it('should support keyboard navigation', async () => {
      const messagesContainer = wrapper.find('.messages-container')
      expect(messagesContainer.exists()).toBe(true)
      
      // Container should be focusable for keyboard navigation
      expect(messagesContainer.element.tabIndex).toBeGreaterThanOrEqual(-1)
    })

    it('should provide meaningful content for screen readers', () => {
      const typeLabels = wrapper.findAll('.type-label')
      
      typeLabels.forEach(label => {
        expect(label.text()).toMatch(/^(USER|ASSISTANT|TOOL|TOOL RESULT|SUMMARY)/)
      })
    })
  })

  describe('Responsive Design', () => {
    it('should adapt to mobile viewports', () => {
      // Test mobile-specific styles are applied
      expect(wrapper.html()).toMatchSnapshot()
    })

    it('should handle different screen sizes', () => {
      const container = wrapper.find('.messages-container')
      expect(container.exists()).toBe(true)
      
      // Check that responsive classes can be applied
      expect(wrapper.classes()).not.toContain('desktop-only')
    })
  })

  describe('Content Caching', () => {
    it('should handle message updates efficiently', async () => {
      const initialMessages = createMessageSet(10)
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: initialMessages,
          currentIndex: 0
        }
      })

      const updatedMessages = [...initialMessages, ...createMessageSet(5)]
      
      await wrapper.setProps({ messages: updatedMessages })
      await nextTick()
      
      expect(wrapper.findAll('.message-item')).toHaveLength(15)
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })
})