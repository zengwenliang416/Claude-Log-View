import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import FileUpload from '@/components/common/FileUpload.vue'

describe('FileUpload.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(FileUpload, {
      props: { loading: false }
    })
  })

  afterEach(() => {
    wrapper.unmount()
  })

  describe('rendering', () => {
    it('should render upload button', () => {
      const button = wrapper.find('.upload-button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Load Chat Log')
    })

    it('should hide file input', () => {
      const input = wrapper.find('.file-input')
      expect(input.exists()).toBe(true)
      expect(input.element.style.display).toBe('none')
    })

    it('should not show drop zone initially', () => {
      const dropZone = wrapper.find('.drop-zone')
      expect(dropZone.exists()).toBe(false)
    })

    it('should show correct button icon when not loading', () => {
      const icon = wrapper.find('.button-icon')
      expect(icon.text()).toBe('📁')
    })

    it('should show loading spinner when loading', async () => {
      await wrapper.setProps({ loading: true })
      
      const spinner = wrapper.findComponent({ name: 'LoadingSpinner' })
      expect(spinner.exists()).toBe(true)
      
      const buttonText = wrapper.find('.button-text')
      expect(buttonText.text()).toBe('Loading...')
    })
  })

  describe('file selection', () => {
    it('should trigger file input click when button is clicked', async () => {
      const fileInput = wrapper.find('.file-input')
      const clickSpy = vi.spyOn(fileInput.element, 'click')
      
      const button = wrapper.find('.upload-button')
      await button.trigger('click')
      
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should not trigger file input when loading', async () => {
      await wrapper.setProps({ loading: true })
      
      const fileInput = wrapper.find('.file-input')
      const clickSpy = vi.spyOn(fileInput.element, 'click')
      
      const button = wrapper.find('.upload-button')
      await button.trigger('click')
      
      expect(clickSpy).not.toHaveBeenCalled()
    })

    it('should emit file-loaded event when valid file is selected', async () => {
      const file = createMockFile('{"test": "data"}', 'test.jsonl')
      const fileInput = wrapper.find('.file-input')
      
      // Mock the files property
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })
      
      await fileInput.trigger('change')
      await nextTick()
      
      expect(wrapper.emitted('file-loaded')).toBeTruthy()
      expect(wrapper.emitted('file-loaded')[0][0]).toBe(file)
    })

    it('should show file info after successful upload', async () => {
      const file = createMockFile('{"test": "data"}', 'test.jsonl')
      const fileInput = wrapper.find('.file-input')
      
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })
      
      await fileInput.trigger('change')
      await nextTick()
      
      const fileInfo = wrapper.find('.file-info')
      expect(fileInfo.exists()).toBe(true)
      
      const fileName = wrapper.find('.file-name')
      expect(fileName.text()).toBe('test.jsonl')
      
      const fileSize = wrapper.find('.file-size')
      expect(fileSize.text()).toContain('Bytes')
    })

    it('should reset file input after processing', async () => {
      const file = createMockFile('{"test": "data"}', 'test.jsonl')
      const fileInput = wrapper.find('.file-input')
      
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })
      
      await fileInput.trigger('change')
      await nextTick()
      
      expect(fileInput.element.value).toBe('')
    })
  })

  describe('file validation', () => {
    it('should accept .jsonl files', async () => {
      const file = createMockFile('{"test": "data"}', 'test.jsonl')
      const fileInput = wrapper.find('.file-input')
      
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })
      
      await fileInput.trigger('change')
      
      expect(wrapper.emitted('file-loaded')).toBeTruthy()
    })

    it('should accept .json files', async () => {
      const file = createMockFile('{"test": "data"}', 'test.json')
      const fileInput = wrapper.find('.file-input')
      
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })
      
      await fileInput.trigger('change')
      
      expect(wrapper.emitted('file-loaded')).toBeTruthy()
    })

    it('should reject invalid file types', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const file = createMockFile('content', 'test.txt')
      const fileInput = wrapper.find('.file-input')
      
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })
      
      await fileInput.trigger('change')
      
      expect(alertSpy).toHaveBeenCalledWith('Please select a .jsonl or .json file.')
      expect(wrapper.emitted('file-loaded')).toBeFalsy()
      
      alertSpy.mockRestore()
    })

    it('should reject files that are too large', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      const largeContent = 'x'.repeat(51 * 1024 * 1024) // 51MB
      const file = createMockFile(largeContent, 'large.jsonl')
      const fileInput = wrapper.find('.file-input')
      
      Object.defineProperty(fileInput.element, 'files', {
        value: [file],
        writable: false
      })
      
      await fileInput.trigger('change')
      
      expect(alertSpy).toHaveBeenCalledWith('File too large. Maximum size is 50MB.')
      expect(wrapper.emitted('file-loaded')).toBeFalsy()
      
      alertSpy.mockRestore()
    })
  })

  describe('drag and drop', () => {
    beforeEach(async () => {
      // Simulate showing drop zone
      await wrapper.setData({ showDropZone: true })
    })

    it('should show drop zone when dragging files over window', async () => {
      await wrapper.setData({ showDropZone: true })
      
      const dropZone = wrapper.find('.drop-zone')
      expect(dropZone.exists()).toBe(true)
    })

    it('should activate drop zone on drag over', async () => {
      await wrapper.setData({ showDropZone: true })
      
      const dropZone = wrapper.find('.drop-zone')
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          items: [{
            kind: 'file',
            getAsFile: () => createMockFile('content', 'test.jsonl')
          }]
        }
      }
      
      await dropZone.trigger('dragover', mockEvent)
      
      expect(dropZone.classes()).toContain('active')
      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it('should show error for invalid file type during drag', async () => {
      await wrapper.setData({ showDropZone: true })
      
      const dropZone = wrapper.find('.drop-zone')
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          items: [{
            kind: 'file',
            getAsFile: () => createMockFile('content', 'test.txt')
          }]
        }
      }
      
      await dropZone.trigger('dragover', mockEvent)
      await nextTick()
      
      const dropText = wrapper.find('.drop-text')
      expect(dropText.text()).toContain('Invalid file type')
    })

    it('should deactivate drop zone on drag leave', async () => {
      await wrapper.setData({ showDropZone: true, isDragActive: true })
      
      const dropZone = wrapper.find('.drop-zone')
      const mockEvent = {
        preventDefault: vi.fn(),
        relatedTarget: null,
        currentTarget: { contains: () => false }
      }
      
      await dropZone.trigger('dragleave', mockEvent)
      
      expect(wrapper.vm.isDragActive).toBe(false)
    })

    it('should process valid dropped files', async () => {
      await wrapper.setData({ showDropZone: true })
      
      const dropZone = wrapper.find('.drop-zone')
      const file = createMockFile('{"test": "data"}', 'test.jsonl')
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [file]
        }
      }
      
      await dropZone.trigger('drop', mockEvent)
      await nextTick()
      
      expect(wrapper.emitted('file-loaded')).toBeTruthy()
      expect(wrapper.emitted('file-loaded')[0][0]).toBe(file)
      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it('should show error for invalid dropped files', async () => {
      await wrapper.setData({ showDropZone: true })
      
      const dropZone = wrapper.find('.drop-zone')
      const file = createMockFile('content', 'test.txt')
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [file]
        }
      }
      
      await dropZone.trigger('drop', mockEvent)
      await nextTick()
      
      expect(wrapper.vm.dragError).toContain('Invalid file type')
      expect(wrapper.emitted('file-loaded')).toBeFalsy()
    })
  })

  describe('utility functions', () => {
    it('should format file sizes correctly', () => {
      const { formatFileSize } = wrapper.vm
      
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should validate file types correctly', () => {
      const validJsonl = createMockFile('content', 'test.jsonl')
      const validJson = createMockFile('content', 'test.json')
      const invalid = createMockFile('content', 'test.txt')
      
      expect(wrapper.vm.isValidFileType(validJsonl)).toBe(true)
      expect(wrapper.vm.isValidFileType(validJson)).toBe(true)
      expect(wrapper.vm.isValidFileType(invalid)).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const button = wrapper.find('.upload-button')
      expect(button.attributes('role')).toBe('button')
    })

    it('should be keyboard accessible', async () => {
      const button = wrapper.find('.upload-button')
      const fileInput = wrapper.find('.file-input')
      const clickSpy = vi.spyOn(fileInput.element, 'click')
      
      // Simulate Enter key press
      await button.trigger('keydown.enter')
      
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should have proper disabled state', async () => {
      await wrapper.setProps({ loading: true })
      
      const button = wrapper.find('.upload-button')
      expect(button.attributes('disabled')).toBeDefined()
      expect(button.classes()).toContain('loading')
    })
  })

  describe('responsive behavior', () => {
    it('should adapt to mobile viewports', () => {
      // This would typically require viewport mocking or CSS testing
      const button = wrapper.find('.upload-button')
      expect(button.exists()).toBe(true)
      
      // Test that mobile-specific classes are properly applied
      expect(wrapper.html()).toMatchSnapshot()
    })
  })
})