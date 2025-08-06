import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import LogViewer from '@/components/LogViewer.vue'
import FileUpload from '@/components/common/FileUpload.vue'

// Mock all composables with minimal implementations
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

describe('Core Functionality Tests', () => {
  it('LogViewer - should render without errors', () => {
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

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.log-viewer').exists()).toBe(true)
    wrapper.unmount()
  })

  it('FileUpload - should render basic structure', () => {
    global.alert = vi.fn()
    
    const wrapper = shallowMount(FileUpload, {
      props: { loading: false },
      global: {
        stubs: {
          UploadIcon: true,
          LoadingSpinner: true
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('Integration - LogViewer renders with FileUpload component', () => {
    const wrapper = shallowMount(LogViewer, {
      global: {
        stubs: {
          MessageIndex: true,
          MessageDisplay: true,
          ErrorMessage: true,
          ThemeToggle: true,
          MessageSquareIcon: true,
          FileUpload: {
            template: '<div data-testid="file-upload-stub">FileUpload Stub</div>'
          }
        }
      }
    })

    // Check if LogViewer renders and contains the FileUpload stub
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('[data-testid="file-upload-stub"]').exists()).toBe(true)
    wrapper.unmount()
  })
})