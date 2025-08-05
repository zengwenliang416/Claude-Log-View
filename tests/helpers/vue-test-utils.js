/**
 * Vue Test Utils helpers and custom matchers
 */
import { mount, shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'

/**
 * Enhanced mount function with common global configurations
 */
export const mountComponent = (component, options = {}) => {
  const defaultOptions = {
    global: {
      stubs: {
        // Common stubs to prevent complex child component rendering
        'LoadingSpinner': {
          template: '<div class="loading-spinner-stub">Loading...</div>'
        },
        'ErrorMessage': {
          template: '<div class="error-message-stub">{{ error }}</div>',
          props: ['error']
        },
        'MessageDisplay': {
          template: '<div class="message-display-stub">{{ message?.uuid || "No message" }}</div>',
          props: ['message', 'loading', 'error']
        }
      },
      mocks: {
        // Common mocks
        $router: {
          push: vi.fn(),
          replace: vi.fn(),
          go: vi.fn()
        },
        $route: {
          params: {},
          query: {},
          path: '/'
        }
      }
    }
  }

  // Deep merge options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    global: {
      ...defaultOptions.global,
      ...options.global,
      stubs: {
        ...defaultOptions.global.stubs,
        ...options.global?.stubs
      },
      mocks: {
        ...defaultOptions.global.mocks,
        ...options.global?.mocks
      }
    }
  }

  return mount(component, mergedOptions)
}

/**
 * Shallow mount with default configuration
 */
export const shallowMountComponent = (component, options = {}) => {
  return shallowMount(component, {
    global: {
      stubs: ['router-link', 'router-view'],
      ...options.global
    },
    ...options
  })
}

/**
 * Wait for Vue's reactivity to settle
 */
export const flushPromises = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 0)
  })
}

/**
 * Wait for multiple Vue ticks
 */
export const waitForTicks = async (count = 1) => {
  for (let i = 0; i < count; i++) {
    await nextTick()
  }
}

/**
 * Simulate file input change event
 */
export const simulateFileUpload = async (wrapper, files) => {
  const input = wrapper.find('input[type="file"]')
  
  // Create mock file list
  const fileList = Array.isArray(files) ? files : [files]
  
  Object.defineProperty(input.element, 'files', {
    value: fileList,
    writable: false
  })
  
  await input.trigger('change')
  await nextTick()
}

/**
 * Simulate keyboard events with proper event object
 */
export const simulateKeyboard = async (wrapper, key, options = {}) => {
  const event = new KeyboardEvent('keydown', {
    key,
    code: `Key${key}`,
    ...options
  })
  
  // Mock target if not provided
  if (!event.target) {
    Object.defineProperty(event, 'target', {
      value: { tagName: 'DIV' },
      writable: false
    })
  }
  
  await wrapper.trigger('keydown', event)
  await nextTick()
}

/**
 * Simulate drag and drop events
 */
export const simulateDragDrop = async (wrapper, files, targetSelector = '.drop-zone') => {
  const target = wrapper.find(targetSelector)
  
  const dataTransfer = {
    files: Array.isArray(files) ? files : [files],
    items: files.map(file => ({
      kind: 'file',
      getAsFile: () => file
    }))
  }
  
  await target.trigger('dragenter', { dataTransfer })
  await target.trigger('dragover', { dataTransfer })
  await target.trigger('drop', { dataTransfer })
  await nextTick()
}

/**
 * Find component by name recursively
 */
export const findComponentByName = (wrapper, name) => {
  const component = wrapper.findComponent({ name })
  if (component.exists()) {
    return component
  }
  
  // Look in child components
  const allComponents = wrapper.findAllComponents('*')
  for (const comp of allComponents) {
    if (comp.vm?.$options?.name === name) {
      return comp
    }
  }
  
  return null
}

/**
 * Wait for a condition to be true
 */
export const waitFor = async (condition, timeout = 1000, interval = 10) => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  throw new Error(`Condition not met within ${timeout}ms`)
}

/**
 * Get all emitted events of a specific type
 */
export const getEmittedEvents = (wrapper, eventName) => {
  const emitted = wrapper.emitted()
  return emitted[eventName] || []
}

/**
 * Assert that an event was emitted with specific payload
 */
export const expectEventEmitted = (wrapper, eventName, payload) => {
  const events = getEmittedEvents(wrapper, eventName)
  expect(events.length).toBeGreaterThan(0)
  
  if (payload !== undefined) {
    const lastEvent = events[events.length - 1]
    expect(lastEvent[0]).toEqual(payload)
  }
}

/**
 * Mock composable with return values
 */
export const mockComposable = (composableModule, mockImplementation) => {
  if (typeof mockImplementation === 'function') {
    vi.mocked(composableModule).mockImplementation(mockImplementation)
  } else {
    vi.mocked(composableModule).mockReturnValue(mockImplementation)
  }
}

/**
 * Create a reactive ref mock
 */
export const createRefMock = (initialValue) => {
  const mockRef = {
    value: initialValue,
    _isRef: true
  }
  
  return new Proxy(mockRef, {
    get(target, prop) {
      if (prop === 'value') {
        return target.value
      }
      return target[prop]
    },
    set(target, prop, value) {
      if (prop === 'value') {
        target.value = value
        return true
      }
      target[prop] = value
      return true
    }
  })
}

/**
 * Create a computed mock
 */
export const createComputedMock = (getter) => {
  return {
    value: getter(),
    _isRef: true,
    _isComputed: true
  }
}

/**
 * Test helper for checking CSS classes
 */
export const expectToHaveClass = (element, className) => {
  expect(element.classes()).toContain(className)
}

export const expectNotToHaveClass = (element, className) => {
  expect(element.classes()).not.toContain(className)
}

/**
 * Test helper for checking visibility
 */
export const expectToBeVisible = (element) => {
  expect(element.exists()).toBe(true)
  expect(element.isVisible()).toBe(true)
}

export const expectToBeHidden = (element) => {
  expect(element.exists()).toBe(false) || expect(element.isVisible()).toBe(false)
}

/**
 * Mock intersection observer for component testing
 */
export const mockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })
  
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: mockIntersectionObserver,
  })
  
  return mockIntersectionObserver
}

/**
 * Mock resize observer for component testing
 */
export const mockResizeObserver = () => {
  const mockResizeObserver = vi.fn()
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })
  
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    configurable: true,
    value: mockResizeObserver,
  })
  
  return mockResizeObserver
}

/**
 * Create a mock Vue component for testing
 */
export const createMockComponent = (name, props = [], template = '<div></div>') => {
  return {
    name,
    props,
    template
  }
}

/**
 * Helper to test async operations
 */
export const testAsyncOperation = async (operation, assertion) => {
  const promise = operation()
  
  // Test that operation is pending
  expect(promise).toBeInstanceOf(Promise)
  
  const result = await promise
  
  // Test the result
  if (assertion) {
    assertion(result)
  }
  
  return result
}