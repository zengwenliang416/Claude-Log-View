import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import LogViewer from '@/components/LogViewer.vue'

// Mock all dependencies
vi.mock('@/composables/useLogParser.js', () => ({
  useLogParser: vi.fn(() => ({
    messages: { value: [] },
    isLoading: { value: false },
    error: { value: null },
    fileInfo: { value: null },
    loadFile: vi.fn()
  }))
}))

vi.mock('@/composables/useMessageFiltering.js', () => ({
  useMessageFiltering: vi.fn(() => ({
    filteredMessages: { value: [] },
    availableRoles: { value: [] },
    availableTools: { value: [] },
    selectedRoles: { value: new Set() },
    selectedTools: { value: new Set() },
    searchQuery: { value: '' },
    isShowingAll: { value: true },
    filterMode: { value: 'include' },
    areAllRolesSelected: { value: true },
    areAllToolsSelected: { value: true },
    toggleRoleFilter: vi.fn(),
    toggleToolFilter: vi.fn(),
    clearAllFilters: vi.fn(),
    selectAllRoles: vi.fn(),
    selectAllTools: vi.fn(),
    getRoleMessageCount: vi.fn(() => 0),
    getToolMessageCount: vi.fn(() => 0)
  }))
}))

vi.mock('@/composables/useNavigation.js', () => ({
  useNavigation: vi.fn(() => ({
    currentIndex: { value: 0 },
    currentMessage: { value: null },
    totalMessages: { value: 0 },
    canGoPrevious: { value: false },
    canGoNext: { value: false },
    navigationInfo: { 
      value: { current: 0, total: 0, position: '0 / 0' } 
    },
    goToIndex: vi.fn(),
    goToPrevious: vi.fn(),
    goToNext: vi.fn(),
    goToFirst: vi.fn(),
    handleKeyboardNavigation: vi.fn()
  }))
}))

describe('LogViewer.vue - Simple Tests', () => {
  it('should create component without errors', () => {
    expect(() => {
      const wrapper = shallowMount(LogViewer, {
        global: {
          stubs: {
            MessageIndex: true,
            MessageDisplay: true,
            FileUpload: true,
            ErrorMessage: true,
            ThemeToggle: true,
            MessageSquareIcon: true
          }
        }
      })
      wrapper.unmount()
    }).not.toThrow()
  })

  it('should render basic structure', () => {
    const wrapper = shallowMount(LogViewer, {
      global: {
        stubs: {
          MessageIndex: true,
          MessageDisplay: true,
          FileUpload: true,
          ErrorMessage: true,
          ThemeToggle: true,
          MessageSquareIcon: true
        }
      }
    })

    expect(wrapper.find('.log-viewer').exists()).toBe(true)
    expect(wrapper.find('.app-header').exists()).toBe(true)
    expect(wrapper.find('.app-main').exists()).toBe(true)
  })
})