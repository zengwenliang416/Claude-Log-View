<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#ef4444"/>
        </svg>
      </div>
      
      <h3 class="error-title">Something went wrong</h3>
      
      <p class="error-message">{{ userFriendlyMessage }}</p>
      
      <div class="error-actions">
        <button @click="retry" class="retry-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12a8 8 0 018-8V2.5L14.5 5 12 7.5V6a6 6 0 106 6h-2a4 4 0 11-4-4z" fill="currentColor"/>
          </svg>
          Try Again
        </button>
        
        <button @click="reset" class="reset-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" fill="currentColor"/>
          </svg>
          Reset
        </button>
        
        <button v-if="showDetails" @click="toggleDetails" class="details-button">
          {{ detailsVisible ? 'Hide' : 'Show' }} Details
        </button>
      </div>
      
      <div v-if="detailsVisible && errorDetails" class="error-details">
        <h4>Technical Details</h4>
        <div class="error-stack">
          <pre>{{ errorDetails }}</pre>
        </div>
        <div class="error-context" v-if="errorContext">
          <h5>Context</h5>
          <pre>{{ JSON.stringify(errorContext, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
  
  <slot v-else />
</template>

<script>
import { ref, computed } from 'vue'

/**
 * ErrorBoundary component for catching and handling component errors gracefully
 * Provides user-friendly error messages and recovery options
 */
export default {
  name: 'ErrorBoundary',
  props: {
    /**
     * Whether to show technical details to users
     */
    showDetails: {
      type: Boolean,
      default: false
    },
    
    /**
     * Custom fallback message for specific error types
     */
    fallbackMessage: {
      type: String,
      default: ''
    },
    
    /**
     * Whether to automatically retry after errors
     */
    autoRetry: {
      type: Boolean,
      default: false
    },
    
    /**
     * Auto retry delay in milliseconds
     */
    retryDelay: {
      type: Number,
      default: 2000
    },
    
    /**
     * Maximum number of auto retry attempts
     */
    maxRetries: {
      type: Number,
      default: 3
    }
  },
  
  emits: ['error', 'retry', 'reset', 'recover'],
  
  setup(props, { emit }) {
    // Error state
    const hasError = ref(false)
    const errorMessage = ref('')
    const errorStack = ref('')
    const errorContext = ref(null)
    const errorType = ref('')
    const retryCount = ref(0)
    
    // UI state
    const detailsVisible = ref(false)
    
    // Auto retry timer
    let retryTimer = null
    
    /**
     * Computed user-friendly error message
     */
    const userFriendlyMessage = computed(() => {
      if (props.fallbackMessage) {
        return props.fallbackMessage
      }
      
      // Provide context-appropriate messages based on error type
      switch (errorType.value) {
        case 'filtering_error':
          return 'There was a problem filtering the messages. Please try clearing your filters or refreshing the page.'
        case 'navigation_error':
          return 'There was a problem with message navigation. Please try resetting your position.'
        case 'parsing_error':
          return 'There was a problem reading the log file. Please check the file format and try again.'
        case 'performance_error':
          return 'The operation is taking too long. Please try with a smaller dataset or refresh the page.'
        case 'validation_error':
          return 'There was a problem with the data format. Please check your input and try again.'
        default:
          return errorMessage.value || 'An unexpected error occurred. Please try refreshing the page.'
      }
    })
    
    /**
     * Computed error details for technical users
     */
    const errorDetails = computed(() => {
      if (!props.showDetails) return null
      
      const details = []
      if (errorMessage.value) details.push(`Error: ${errorMessage.value}`)
      if (errorType.value) details.push(`Type: ${errorType.value}`)
      if (errorStack.value) details.push(`Stack: ${errorStack.value}`)
      
      return details.join('\n\n')
    })
    
    /**
     * Classifies error type based on error message and context
     */
    const classifyError = (error, context) => {
      const message = error.message?.toLowerCase() || ''
      const contextStr = JSON.stringify(context || {}).toLowerCase()
      
      if (message.includes('filter') || contextStr.includes('filter')) {
        return 'filtering_error'
      }
      if (message.includes('navigation') || contextStr.includes('navigation')) {
        return 'navigation_error'
      }
      if (message.includes('parse') || message.includes('json')) {
        return 'parsing_error'
      }
      if (message.includes('timeout') || message.includes('performance')) {
        return 'performance_error'
      }
      if (message.includes('validation') || message.includes('invalid')) {
        return 'validation_error'
      }
      
      return 'unknown_error'
    }
    
    /**
     * Handles captured errors
     */
    const handleError = (error, instance, info) => {
      hasError.value = true
      errorMessage.value = error.message || 'Unknown error'
      errorStack.value = error.stack || ''
      errorContext.value = {
        componentInfo: info,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      errorType.value = classifyError(error, { instance, info })
      
      // Log error for debugging
      console.error('Error caught by ErrorBoundary:', {
        error,
        message: errorMessage.value,
        type: errorType.value,
        context: errorContext.value,
        componentInfo: info
      })
      
      // Emit error event
      emit('error', {
        error,
        type: errorType.value,
        context: errorContext.value,
        canRecover: true
      })
      
      // Auto retry if enabled
      if (props.autoRetry && retryCount.value < props.maxRetries) {
        scheduleAutoRetry()
      }
      
      return false // Prevent error propagation
    }
    
    /**
     * Schedules automatic retry
     */
    const scheduleAutoRetry = () => {
      if (retryTimer) clearTimeout(retryTimer)
      
      retryTimer = setTimeout(() => {
        retryCount.value++
        retry()
      }, props.retryDelay)
    }
    
    /**
     * Retry the failed operation
     */
    const retry = () => {
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      
      hasError.value = false
      errorMessage.value = ''
      errorStack.value = ''
      errorContext.value = null
      errorType.value = ''
      detailsVisible.value = false
      
      emit('retry', {
        retryCount: retryCount.value,
        errorType: errorType.value
      })
    }
    
    /**
     * Reset the component completely
     */
    const reset = () => {
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      
      hasError.value = false
      errorMessage.value = ''
      errorStack.value = ''
      errorContext.value = null
      errorType.value = ''
      retryCount.value = 0
      detailsVisible.value = false
      
      emit('reset', {
        hadError: true
      })
    }
    
    /**
     * Toggle error details visibility
     */
    const toggleDetails = () => {
      detailsVisible.value = !detailsVisible.value
    }
    
    return {
      // State
      hasError,
      detailsVisible,
      
      // Computed
      userFriendlyMessage,
      errorDetails,
      
      // Methods
      handleError,
      retry,
      reset,
      toggleDetails
    }
  },
  
  errorCaptured(error, instance, info) {
    return this.handleError(error, instance, info)
  }
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin: 1rem 0;
}

.error-content {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.error-icon {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
}

.error-title {
  color: #dc2626;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.error-message {
  color: #7f1d1d;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 2rem 0;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.retry-button,
.reset-button,
.details-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button {
  background: #dc2626;
  color: white;
}

.retry-button:hover {
  background: #b91c1c;
  transform: translateY(-1px);
}

.reset-button {
  background: #6b7280;
  color: white;
}

.reset-button:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

.details-button {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.details-button:hover {
  background: #e5e7eb;
}

.error-details {
  text-align: left;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.error-details h4,
.error-details h5 {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.error-details h5 {
  margin-top: 1rem;
  font-size: 0.75rem;
}

.error-stack,
.error-context {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.75rem;
  margin: 0.5rem 0;
}

.error-stack pre,
.error-context pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .error-boundary {
    background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
    border-color: #dc2626;
  }
  
  .error-title {
    color: #fca5a5;
  }
  
  .error-message {
    color: #fecaca;
  }
  
  .details-button {
    background: #374151;
    color: #d1d5db;
    border-color: #4b5563;
  }
  
  .details-button:hover {
    background: #4b5563;
  }
  
  .error-details {
    background: #1f2937;
    border-color: #374151;
  }
  
  .error-details h4,
  .error-details h5 {
    color: #d1d5db;
  }
  
  .error-stack,
  .error-context {
    background: #111827;
    border-color: #374151;
  }
  
  .error-stack pre,
  .error-context pre {
    color: #d1d5db;
  }
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .error-boundary {
    padding: 1rem;
    margin: 0.5rem 0;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .retry-button,
  .reset-button,
  .details-button {
    width: 100%;
    justify-content: center;
  }
}
</style>