import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock window.FileReader
global.FileReader = class MockFileReader {
  constructor() {
    this.result = null
    this.error = null
    this.readyState = 0
    this.onload = null
    this.onerror = null
    this.onabort = null
    this.onloadstart = null
    this.onloadend = null
    this.onprogress = null
  }

  readAsText(file) {
    setTimeout(() => {
      this.readyState = 2
      if (this.onloadstart) this.onloadstart()
      
      if (file.name === 'error.jsonl') {
        this.error = new Error('File read error')
        if (this.onerror) this.onerror({ target: this })
      } else {
        this.result = file._content || '{"test": "data"}'
        if (this.onload) this.onload({ target: this })
      }
      
      if (this.onloadend) this.onloadend()
    }, 0)
  }

  abort() {
    this.readyState = 0
    if (this.onabort) this.onabort()
  }
}

// Mock File constructor for testing
global.File = class MockFile {
  constructor(content, name, options = {}) {
    this.name = name
    this.size = content.length
    this.type = options.type || 'application/json'
    this.lastModified = options.lastModified || Date.now()
    this._content = content
  }
}

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
}

// Mock highlight.js
vi.mock('highlight.js', () => ({
  default: {
    highlight: vi.fn((language, code) => ({
      value: `<span class="hljs">${code}</span>`
    })),
    highlightAuto: vi.fn((code) => ({
      value: `<span class="hljs-auto">${code}</span>`,
      language: 'javascript'
    })),
    configure: vi.fn(),
    registerLanguage: vi.fn()
  }
}))

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

// Global test utilities
global.createMockFile = (content, name = 'test.jsonl', options = {}) => {
  return new File(content, name, options)
}

global.createMockJsonlContent = (messages) => {
  return messages.map(msg => JSON.stringify(msg)).join('\n')
}

global.waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock intersection observer for component testing
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}