<template>
  <div class="file-upload">
    <input
      ref="fileInput"
      type="file"
      accept=".jsonl,.json"
      @change="handleFileSelect"
      class="file-input"
    />
    
    <button
      class="upload-button"
      :class="{ loading }"
      :disabled="loading"
      @click="triggerFileSelect"
    >
      <LoadingSpinner v-if="loading" size="small" />
      <span v-else class="button-icon">📁</span>
      <span class="button-text">
        {{ loading ? 'Loading...' : 'Load Chat Log' }}
      </span>
    </button>
    
    <!-- Drag and Drop Area -->
    <div
      class="drop-zone"
      :class="{ active: isDragActive, error: dragError }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      v-if="showDropZone"
    >
      <div class="drop-content">
        <div class="drop-icon">📎</div>
        <p class="drop-text">
          {{ dragError || 'Drop your .jsonl file here' }}
        </p>
      </div>
    </div>
    
    <!-- File Info -->
    <div class="file-info" v-if="lastLoadedFile">
      <span class="file-name">{{ lastLoadedFile.name }}</span>
      <span class="file-size">{{ formatFileSize(lastLoadedFile.size) }}</span>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

export default {
  name: 'FileUpload',
  components: {
    LoadingSpinner
  },
  props: {
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['file-loaded'],
  setup(props, { emit }) {
    const fileInput = ref(null)
    const isDragActive = ref(false)
    const dragError = ref('')
    const lastLoadedFile = ref(null)
    const showDropZone = ref(false)
    
    const triggerFileSelect = () => {
      if (!props.loading && fileInput.value) {
        fileInput.value.click()
      }
    }
    
    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file) {
        processFile(file)
      }
    }
    
    const handleDragOver = (event) => {
      event.preventDefault()
      isDragActive.value = true
      dragError.value = ''
      
      // Validate file type during drag
      const items = event.dataTransfer.items
      if (items && items.length > 0) {
        const item = items[0]
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file && !isValidFileType(file)) {
            dragError.value = 'Invalid file type. Please use .jsonl or .json files.'
          }
        }
      }
    }
    
    const handleDragLeave = (event) => {
      event.preventDefault()
      if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget)) {
        isDragActive.value = false
        dragError.value = ''
      }
    }
    
    const handleDrop = (event) => {
      event.preventDefault()
      isDragActive.value = false
      dragError.value = ''
      
      const files = event.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        if (isValidFileType(file)) {
          processFile(file)
        } else {
          dragError.value = 'Invalid file type. Please use .jsonl or .json files.'
          setTimeout(() => {
            dragError.value = ''
          }, 3000)
        }
      }
    }
    
    const isValidFileType = (file) => {
      return file.name.endsWith('.jsonl') || file.name.endsWith('.json')
    }
    
    const processFile = (file) => {
      if (!isValidFileType(file)) {
        alert('Please select a .jsonl or .json file.')
        return
      }
      
      // Check file size (limit to 50MB)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        alert(`File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`)
        return
      }
      
      lastLoadedFile.value = {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
      }
      
      emit('file-loaded', file)
      
      // Reset file input
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
    
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    // Show drop zone on drag enter to window
    const handleWindowDragEnter = (event) => {
      if (event.dataTransfer.types.includes('Files')) {
        showDropZone.value = true
      }
    }
    
    const handleWindowDragLeave = (event) => {
      // Hide drop zone when leaving window
      if (event.clientX === 0 && event.clientY === 0) {
        showDropZone.value = false
      }
    }
    
    // Add window drag events
    if (typeof window !== 'undefined') {
      window.addEventListener('dragenter', handleWindowDragEnter)
      window.addEventListener('dragleave', handleWindowDragLeave)
    }
    
    return {
      fileInput,
      isDragActive,
      dragError,
      lastLoadedFile,
      showDropZone,
      triggerFileSelect,
      handleFileSelect,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      formatFileSize
    }
  }
}
</script>

<style scoped>
.file-upload {
  position: relative;
}

.file-input {
  display: none;
}

.upload-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.upload-button:hover:not(:disabled) {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
}

.upload-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.upload-button.loading {
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
}

.button-icon {
  font-size: var(--font-size-base);
}

.button-text {
  white-space: nowrap;
}

.drop-zone {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-normal);
}

.drop-zone.active {
  opacity: 1;
  visibility: visible;
}

.drop-zone.error {
  background-color: rgba(255, 107, 107, 0.1);
}

.drop-content {
  text-align: center;
  padding: var(--spacing-xl);
  background-color: var(--bg-secondary);
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-fast);
}

.drop-zone.active .drop-content {
  border-color: var(--accent-color);
  background-color: var(--bg-tertiary);
}

.drop-zone.error .drop-content {
  border-color: var(--error-color);
  background-color: rgba(255, 107, 107, 0.1);
}

.drop-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.6;
}

.drop-text {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
}

.drop-zone.error .drop-text {
  color: var(--error-color);
}

.file-info {
  display: flex;
  flex-direction: column;
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.file-name {
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.file-size {
  margin-top: 2px;
}

/* Responsive design */
@media (max-width: 768px) {
  .upload-button {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: var(--font-size-xs);
  }
  
  .button-text {
    display: none;
  }
  
  .drop-content {
    padding: var(--spacing-lg);
    margin: var(--spacing-md);
  }
  
  .drop-icon {
    font-size: 2rem;
  }
  
  .drop-text {
    font-size: var(--font-size-base);
  }
}

@media (max-width: 480px) {
  .upload-button {
    padding: var(--spacing-xs);
  }
  
  .button-icon {
    font-size: var(--font-size-sm);
  }
}
</style>