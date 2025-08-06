<template>
  <div class="file-upload">
    <input
      ref="fileInput"
      type="file"
      accept=".jsonl,.json"
      @change="handleFileSelect"
      class="file-input"
    />
    
    <!-- Modern Upload Button -->
    <Button
      variant="primary"
      size="md"
      :loading="loading"
      :disabled="loading"
      @click="triggerFileSelect"
      class="upload-button"
    >
      <template #icon>
        <UploadIcon :size="16" v-if="!loading" />
      </template>
      <span class="button-text">
        {{ loading ? 'Loading...' : 'Load Chat Log' }}
      </span>
    </Button>
    
    <!-- Modern Drag and Drop Overlay -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="showDropZone"
        class="drop-zone"
        :class="{ 
          'drop-zone--active': isDragActive && !dragError,
          'drop-zone--error': dragError 
        }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <!-- Glassmorphism backdrop -->
        <div class="drop-backdrop"></div>
        
        <!-- Drop content -->
        <div class="drop-content">
          <div class="drop-icon-container">
            <div class="drop-icon-bg">
              <FileTextIcon 
                v-if="!dragError" 
                :size="48" 
                :class="[
                  'drop-icon',
                  { 'text-primary-500': isDragActive && !dragError }
                ]"
              />
              <AlertCircleIcon 
                v-else 
                :size="48" 
                class="drop-icon text-red-500"
              />
            </div>
          </div>
          
          <div class="drop-text-container">
            <h3 class="drop-title">
              {{ dragError ? 'Invalid File' : 'Drop your chat log here' }}
            </h3>
            <p class="drop-description">
              {{ dragError || 'Supports .jsonl and .json files up to 50MB' }}
            </p>
          </div>
          
          <!-- Progress bar for loading -->
          <div v-if="uploadProgress > 0" class="upload-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: uploadProgress + '%' }"
              ></div>
            </div>
            <span class="progress-text">{{ uploadProgress }}%</span>
          </div>
        </div>
      </div>
    </Transition>
    
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { Button, Card } from '@/components/ui'
import { 
  UploadIcon, 
  FileTextIcon, 
  AlertCircleIcon, 
  XIcon 
} from 'lucide-vue-next'
import FileSecurityValidator from '@/utils/FileSecurityValidator.js'
import { logger } from '@/utils/logger.js'
import { configManager } from '@/utils/ConfigurationManager.js'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['file-loaded'])

// Reactive state
const fileInput = ref(null)
const isDragActive = ref(false)
const dragError = ref('')
const lastLoadedFile = ref(null)
const showDropZone = ref(false)
const uploadProgress = ref(0)

// Initialize security validator with configuration
const securityValidator = new FileSecurityValidator({
  maxFileSize: configManager.get('MAX_FILE_SIZE', 50 * 1024 * 1024),
  allowedExtensions: configManager.get('ALLOWED_FILE_TYPES', ['.jsonl', '.json']),
  strictMode: configManager.get('STRICT_FILE_VALIDATION', configManager.isProduction()),
  enableContentSanitization: configManager.get('SANITIZE_CONTENT', true),
  timeoutMs: configManager.get('UPLOAD_TIMEOUT', 30000)
})

// Methods
const triggerFileSelect = () => {
  if (!props.loading && fileInput.value) {
    fileInput.value.click()
  }
}

const clearFile = () => {
  lastLoadedFile.value = null
  uploadProgress.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
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
  const extension = securityValidator.getFileExtension(file.name)
  return extension && securityValidator.allowedExtensions.has(extension.toLowerCase())
}

const processFile = async (file) => {
  logger.debug('Processing file upload', {
    component: 'FileUpload',
    fileName: file.name,
    fileSize: securityValidator.formatBytes(file.size),
    mimeType: file.type
  })
  
  try {
    // Show upload progress
    uploadProgress.value = 10
    
    // Comprehensive security validation
    const validationResult = await securityValidator.validateFile(file)
    uploadProgress.value = 50
    
    if (!validationResult.valid) {
      const errorMessage = securityValidator.getUserFriendlyErrorMessage(validationResult)
      
      // Debug logging to console
      console.log('=== FILE VALIDATION FAILED ===')
      console.log('Error Message:', errorMessage)
      console.log('Validation Result:', validationResult)
      console.log('Validation Errors:', validationResult.errors)
      console.log('==============================')
      
      logger.warn('File validation failed', {
        component: 'FileUpload',
        fileName: file.name,
        errorMessage,
        errors: validationResult.errors,
        validationSummary: securityValidator.getValidationSummary(validationResult)
      })
      
      // Show user-friendly error
      dragError.value = errorMessage
      uploadProgress.value = 0
      
      // Clear error after 5 seconds
      setTimeout(() => {
        dragError.value = ''
      }, 5000)
      
      return
    }
    
    // Log warnings if present
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      logger.warn('File validation warnings', {
        component: 'FileUpload',
        fileName: file.name,
        warnings: validationResult.warnings.map(w => w.message)
      })
    }
    
    uploadProgress.value = 80
    
    // Store file metadata
    lastLoadedFile.value = {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      validationSummary: securityValidator.getValidationSummary(validationResult)
    }
    
    uploadProgress.value = 100
    
    logger.info('File validation successful', {
      component: 'FileUpload',
      fileName: file.name,
      validationSummary: securityValidator.getValidationSummary(validationResult)
    })
    
    // Emit validated file
    emit('file-loaded', file)
    
    // Reset file input and progress
    if (fileInput.value) {
      fileInput.value.value = ''
    }
    
    // Reset progress after a delay
    setTimeout(() => {
      uploadProgress.value = 0
    }, 1000)
    
  } catch (error) {
    logger.error('File processing failed', {
      component: 'FileUpload',
      fileName: file.name,
      error
    })
    
    dragError.value = 'File processing failed due to system error'
    uploadProgress.value = 0
    
    setTimeout(() => {
      dragError.value = ''
    }, 5000)
  }
}
    
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = (now - date) / (1000 * 60 * 60)
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString([], { weekday: 'short' })
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
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

// Add window drag events with cleanup
if (typeof window !== 'undefined') {
  window.addEventListener('dragenter', handleWindowDragEnter)
  window.addEventListener('dragleave', handleWindowDragLeave)
}

// Cleanup function to prevent memory leaks
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('dragenter', handleWindowDragEnter)
    window.removeEventListener('dragleave', handleWindowDragLeave)
  }
})
</script>

<style scoped>
.file-upload {
  @apply relative;
}

.file-input {
  @apply sr-only;
}

/* Modern drag and drop overlay */
.drop-zone {
  @apply fixed inset-0 z-50;
  @apply flex items-center justify-center;
  @apply transition-all duration-300 ease-out;
}

.drop-backdrop {
  @apply absolute inset-0;
  @apply bg-black/20 dark:bg-black/40;
  @apply backdrop-blur-md backdrop-saturate-150;
}

.drop-content {
  @apply relative z-10 mx-4;
  @apply max-w-md w-full;
  @apply text-center p-8;
  /* Glass card styles */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  @apply border-2 border-dashed border-gray-300 dark:border-gray-600;
  @apply transition-all duration-300 ease-out;
  /* Scale-in animation */
  animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
  0% { 
    transform: scale(0.95); 
    opacity: 0; 
  }
  100% { 
    transform: scale(1); 
    opacity: 1; 
  }
}

.drop-zone--active .drop-content {
  @apply border-primary-500 bg-primary-50/90 dark:bg-primary-900/20;
  @apply scale-105 shadow-2xl shadow-primary-500/25;
}

.drop-zone--error .drop-content {
  @apply border-red-500 bg-red-50/90 dark:bg-red-900/20;
  @apply shake;
}

.drop-icon-container {
  @apply flex justify-center mb-6;
}

.drop-icon-bg {
  @apply w-20 h-20 rounded-2xl;
  @apply glass-surface;
  @apply flex items-center justify-center;
  @apply transition-all duration-300;
}

.drop-zone--active .drop-icon-bg {
  @apply bg-primary-100 dark:bg-primary-900/30;
  @apply scale-110;
}

.drop-zone--error .drop-icon-bg {
  @apply bg-red-100 dark:bg-red-900/30;
}

.drop-icon {
  @apply text-gray-500 dark:text-gray-400;
  @apply transition-colors duration-300;
}

.drop-text-container {
  @apply space-y-2;
}

.drop-title {
  @apply text-xl font-semibold text-gray-900 dark:text-gray-100;
  @apply font-semibold tracking-tight;
}

.drop-zone--error .drop-title {
  @apply text-red-600 dark:text-red-400;
}

.drop-description {
  @apply text-sm text-gray-600 dark:text-gray-400;
  @apply font-medium;
}

.drop-zone--error .drop-description {
  @apply text-red-600 dark:text-red-400;
}

/* Upload progress */
.upload-progress {
  @apply mt-6 space-y-2;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-primary-600 rounded-full;
  @apply transition-all duration-300 ease-out;
  @apply animate-pulse;
}

.progress-text {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

/* Enhanced file info */
.file-info {
  @apply mt-3;
}

.file-details {
  @apply flex items-center gap-3;
}

.file-icon {
  @apply flex-shrink-0;
}

.file-metadata {
  @apply flex-1 min-w-0;
}

.file-name {
  @apply text-sm font-medium text-gray-900 dark:text-gray-100;
  @apply truncate;
}

.file-stats {
  @apply flex items-center gap-2 mt-1;
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.file-separator {
  @apply text-gray-300 dark:text-gray-600;
}

/* Button text responsive behavior */
@media (max-width: 640px) {
  .button-text {
    @apply hidden;
  }
}

@media (max-width: 480px) {
  .drop-content {
    @apply mx-2 p-6;
  }
  
  .drop-icon-bg {
    @apply w-16 h-16;
  }
  
  .drop-title {
    @apply text-lg;
  }
  
  .drop-description {
    @apply text-xs;
  }
}

/* Animation keyframes */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.shake {
  animation: shake 0.5s ease-in-out;
}
</style>