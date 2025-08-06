import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FileUpload from '@/components/common/FileUpload.vue'

describe('FileUpload.vue - Simple Tests', () => {
  let wrapper

  beforeEach(() => {
    // Mock alert function
    global.alert = vi.fn()
    
    wrapper = mount(FileUpload, {
      props: {
        loading: false
      },
      global: {
        stubs: {
          UploadIcon: true,
          LoadingSpinner: true
        }
      }
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('should render upload button', () => {
    expect(wrapper.find('.upload-button').exists()).toBe(true)
  })

  it('should render file input', () => {
    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
  })

  it('should have correct accept attribute', () => {
    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.attributes('accept')).toBe('.jsonl,.json')
  })
})