import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MessageDisplay from '@/components/MainContent/MessageDisplay.vue'
import LogViewer from '@/components/LogViewer.vue'
import { 
  createMessageSet, 
  createPerformanceTestData,
  createMemoryTestData,
  createLargeMessage
} from '../helpers/test-data.js'
import { mountComponent, waitForTicks, flushPromises } from '../helpers/vue-test-utils.js'

describe('Scrolling and Performance Tests', () => {
  let wrapper
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Scrolling Performance Benchmarks', () => {
    it('should scroll smoothly with 607+ messages', async () => {
      const largeDataset = createMessageSet(607)
      
      const startTime = performance.now()
      
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: largeDataset,
          currentIndex: 0,
          loading: false,
          error: null
        }
      })
      
      await nextTick()
      
      const mountTime = performance.now() - startTime
      
      // Should mount within reasonable time (< 200ms)
      expect(mountTime).toBeLessThan(200)
      expect(wrapper.findAll('.message-item')).toHaveLength(607)
    })

    it('should handle rapid scroll position changes efficiently', async () => {
      const largeDataset = createMessageSet(1000)
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: largeDataset,
          currentIndex: 0
        }
      })

      const scrollIntoViewMock = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock

      const scrollPositions = [0, 100, 500, 750, 999, 250]
      
      const startTime = performance.now()
      
      // Rapidly change scroll positions
      for (const position of scrollPositions) {
        await wrapper.setProps({ currentIndex: position })
        await nextTick()
      }
      
      const totalTime = performance.now() - startTime
      
      // Should handle rapid changes within 100ms total
      expect(totalTime).toBeLessThan(100)
      expect(scrollIntoViewMock).toHaveBeenCalledTimes(scrollPositions.length)
    })

    it('should maintain smooth scrolling under memory pressure', async () => {
      const memoryIntensiveData = createMemoryTestData(2000, 5)
      
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: memoryIntensiveData,
          currentIndex: 1000
        }
      })

      await flushPromises()

      const scrollIntoViewMock = vi.fn()
      Element.prototype.scrollIntoView = scrollIntoViewMock

      // Test scrolling under memory pressure
      const scrollTests = Array.from({ length: 20 }, (_, i) => i * 100)
      
      const startTime = performance.now()
      
      for (const index of scrollTests) {
        await wrapper.setProps({ currentIndex: index })
        // Minimal wait to simulate real usage
        await new Promise(resolve => setTimeout(resolve, 1))
      }
      
      const totalTime = performance.now() - startTime
      
      // Should complete all scroll operations within 200ms
      expect(totalTime).toBeLessThan(200)
      expect(scrollIntoViewMock).toHaveBeenCalledTimes(scrollTests.length)
    })
  })

  describe('Message Rendering Performance', () => {
    it('should render large messages efficiently', async () => {
      const largeMessages = Array.from({ length: 100 }, (_, i) => 
        createLargeMessage(`large-${i}`, 10000)
      )
      
      const startTime = performance.now()
      
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages: largeMessages,
          currentIndex: 0
        }
      })
      
      await nextTick()
      
      const renderTime = performance.now() - startTime
      
      // Should render large messages within 300ms
      expect(renderTime).toBeLessThan(300)
      expect(wrapper.findAll('.message-item')).toHaveLength(100)
    })

    it('should optimize re-renders on prop changes', async () => {
      const messages = createMessageSet(500)
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages,
          currentIndex: 0
        }
      })

      await nextTick()

      const forceUpdateSpy = vi.spyOn(wrapper.vm, '$forceUpdate')
      
      // Rapidly change current index without forcing re-renders
      for (let i = 0; i < 50; i++) {
        await wrapper.setProps({ currentIndex: i })
      }
      
      await waitForTicks(5)
      
      // Should not force excessive re-renders
      expect(forceUpdateSpy).not.toHaveBeenCalled()
    })

    it('should handle DOM updates efficiently during scrolling', async () => {
      const messages = createMessageSet(800)
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages,
          currentIndex: 0
        }
      })

      // Mock DOM query methods to measure performance
      const querySelectorMock = vi.spyOn(document, 'querySelector')
      const querySelectorAllMock = vi.spyOn(document, 'querySelectorAll')
      
      // Simulate rapid scrolling
      for (let i = 0; i < 20; i++) {
        await wrapper.setProps({ currentIndex: i * 40 })
        await nextTick()
      }
      
      // Should not make excessive DOM queries
      expect(querySelectorMock.mock.calls.length).toBeLessThan(100)
      expect(querySelectorAllMock.mock.calls.length).toBeLessThan(50)
      
      querySelectorMock.mockRestore()
      querySelectorAllMock.mockRestore()
    })
  })

  describe('Filtering Performance', () => {
    it('should filter large datasets quickly', async () => {
      const performanceData = createPerformanceTestData(2000)
      
      // Mock filtering composable for performance testing
      const mockUseMessageFiltering = vi.fn(() => ({
        filteredMessages: { value: performanceData },
        availableRoles: { value: ['user', 'assistant', 'tool', 'tool_result'] },
        availableTools: { value: ['Bash', 'Read', 'Edit', 'Write'] },
        roleFilters: new Set(),
        toolFilters: new Set(),
        searchQuery: { value: '' },
        toggleRoleFilter: vi.fn(),
        toggleToolFilter: vi.fn(),
        clearAllFilters: vi.fn()
      }))

      vi.doMock('@/composables/useMessageFiltering.js', () => ({
        useMessageFiltering: mockUseMessageFiltering
      }))

      const startTime = performance.now()
      
      wrapper = mountComponent(LogViewer)
      await flushPromises()
      
      const filterTime = performance.now() - startTime
      
      // Should handle large filtering operations within 150ms
      expect(filterTime).toBeLessThan(150)
    })

    it('should maintain performance during rapid filter changes', async () => {
      const messages = createPerformanceTestData(1000)
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages,
          currentIndex: 0
        }
      })

      // Simulate rapid prop changes from filtering
      const filterTests = [
        messages.slice(0, 800),
        messages.slice(0, 600),
        messages.slice(0, 400),
        messages.slice(0, 200),
        messages, // back to full dataset
      ]
      
      const startTime = performance.now()
      
      for (const filteredSet of filterTests) {
        await wrapper.setProps({ messages: filteredSet })
        await nextTick()
      }
      
      const totalTime = performance.now() - startTime
      
      // Should handle rapid filter changes within 100ms
      expect(totalTime).toBeLessThan(100)
    })
  })

  describe('Memory Management', () => {
    it('should not leak memory during extended scrolling', async () => {
      const messages = createMessageSet(1000)
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages,
          currentIndex: 0
        }
      })

      // Simulate extended scrolling session
      const scrollSession = async () => {
        for (let i = 0; i < 100; i++) {
          await wrapper.setProps({ currentIndex: Math.floor(Math.random() * 1000) })
          if (i % 10 === 0) {
            await waitForTicks(2)
          }
        }
      }

      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      await scrollSession()
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      
      // Memory increase should be reasonable (< 10MB)
      const memoryIncrease = finalMemory - initialMemory
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should efficiently handle component lifecycle during rapid navigation', async () => {
      const messages = createMessageSet(500)
      
      // Create and destroy multiple instances rapidly
      const instances = []
      
      const startTime = performance.now()
      
      for (let i = 0; i < 10; i++) {
        const instance = mountComponent(MessageDisplay, {
          props: {
            messages: messages.slice(0, i * 50 + 50),
            currentIndex: i * 5
          }
        })
        instances.push(instance)
        await nextTick()
      }
      
      // Cleanup all instances
      instances.forEach(instance => instance.unmount())
      
      const lifecycleTime = performance.now() - startTime
      
      // Should handle rapid lifecycle operations within 200ms
      expect(lifecycleTime).toBeLessThan(200)
    })
  })

  describe('Visual Performance', () => {
    it('should maintain 60fps during smooth scrolling', async () => {
      const messages = createMessageSet(1000)
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages,
          currentIndex: 0
        }
      })

      let frameCount = 0
      let startTime = performance.now()
      
      const countFrames = () => {
        frameCount++
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrames)
        }
      }

      // Start frame counting
      requestAnimationFrame(countFrames)
      
      // Simulate smooth scrolling
      const scrollIntoViewMock = vi.fn(() => {
        // Simulate smooth scroll animation
        return new Promise(resolve => setTimeout(resolve, 16))
      })
      Element.prototype.scrollIntoView = scrollIntoViewMock

      // Trigger multiple scroll operations
      for (let i = 0; i < 10; i++) {
        await wrapper.setProps({ currentIndex: i * 100 })
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Wait for frame counting to complete
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Should maintain reasonable frame rate (> 30fps)
      expect(frameCount).toBeGreaterThan(30)
    })

    it('should handle CSS animations efficiently during scrolling', async () => {
      const messages = createMessageSet(300)
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages,
          currentIndex: 150
        }
      })

      // Mock CSS animation performance
      const animationStartSpy = vi.fn()
      const animationEndSpy = vi.fn()
      
      wrapper.element.addEventListener('animationstart', animationStartSpy)
      wrapper.element.addEventListener('animationend', animationEndSpy)

      // Rapidly change active message (which triggers CSS transitions)
      for (let i = 0; i < 20; i++) {
        await wrapper.setProps({ currentIndex: i + 150 })
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      await waitForTicks(5)
      
      // Should not create excessive animations
      expect(animationStartSpy.mock.calls.length).toBeLessThan(50)
    })
  })

  describe('Stress Testing', () => {
    it('should handle extreme dataset sizes gracefully', async () => {
      const extremeDataset = createMessageSet(5000)
      
      const startTime = performance.now()
      
      try {
        wrapper = mountComponent(MessageDisplay, {
          props: {
            messages: extremeDataset,
            currentIndex: 2500
          }
        })
        
        await flushPromises()
        
        const loadTime = performance.now() - startTime
        
        // Should handle extreme datasets within 1 second
        expect(loadTime).toBeLessThan(1000)
        expect(wrapper.exists()).toBe(true)
        
      } catch (error) {
        // Should not crash with extreme datasets
        expect(error).toBeUndefined()
      }
    })

    it('should recover from performance bottlenecks', async () => {
      const messages = createMessageSet(1000)
      wrapper = mountComponent(MessageDisplay, {
        props: {
          messages,
          currentIndex: 0
        }
      })

      // Simulate performance bottleneck
      const slowOperation = async () => {
        // Intentionally slow operation
        for (let i = 0; i < 100000; i++) {
          Math.random()
        }
      }

      const startTime = performance.now()
      
      // Trigger slow operation during component updates
      const slowPromise = slowOperation()
      
      // Continue normal operations
      for (let i = 0; i < 10; i++) {
        await wrapper.setProps({ currentIndex: i * 100 })
        await nextTick()
      }
      
      await slowPromise
      
      const recoveryTime = performance.now() - startTime
      
      // Should complete within reasonable time despite bottleneck
      expect(recoveryTime).toBeLessThan(500)
      expect(wrapper.exists()).toBe(true)
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })
})