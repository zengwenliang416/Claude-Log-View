<template>
  <div class="error-message" :class="typeClass" v-if="visible">
    <div class="error-content">
      <div class="error-header">
        <div class="error-icon">
          {{ getErrorIcon() }}
        </div>
        <div class="error-title">
          {{ getErrorTitle() }}
        </div>
        <button class="close-button" @click="handleDismiss" title="Dismiss error">
          ✕
        </button>
      </div>
      
      <div class="error-body">
        <p class="error-text">{{ error }}</p>
        
        <div class="error-details" v-if="details">
          <button 
            class="toggle-details" 
            @click="showDetails = !showDetails"
          >
            {{ showDetails ? 'Hide' : 'Show' }} Details
          </button>
          
          <div class="details-content" v-if="showDetails">
            <pre class="details-text">{{ details }}</pre>
          </div>
        </div>
      </div>
      
      <div class="error-actions" v-if="showActions">
        <button 
          class="action-button retry-button" 
          @click="handleRetry"
          v-if="canRetry"
        >
          🔄 Retry
        </button>
        
        <button 
          class="action-button report-button" 
          @click="handleReport"
          v-if="canReport"
        >
          📋 Report Issue
        </button>
        
        <button 
          class="action-button dismiss-button" 
          @click="handleDismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ErrorMessage',
  props: {
    error: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'error',
      validator: (value) => ['error', 'warning', 'info'].includes(value)
    },
    details: {
      type: String,
      default: ''
    },
    canRetry: {
      type: Boolean,
      default: true
    },
    canReport: {
      type: Boolean,
      default: false
    },
    showActions: {
      type: Boolean,
      default: true
    },
    autoHide: {
      type: Boolean,
      default: false
    },
    autoHideDelay: {
      type: Number,
      default: 5000
    }
  },
  emits: ['retry', 'report', 'dismiss'],
  setup(props, { emit }) {
    const visible = ref(true)
    const showDetails = ref(false)
    
    const typeClass = computed(() => `error-${props.type}`)
    
    const getErrorIcon = () => {
      switch (props.type) {
        case 'warning':
          return '⚠️'
        case 'info':
          return 'ℹ️'
        default:
          return '❌'
      }
    }
    
    const getErrorTitle = () => {
      switch (props.type) {
        case 'warning':
          return 'Warning'
        case 'info':
          return 'Information'
        default:
          return 'Error'
      }
    }
    
    const handleRetry = () => {
      emit('retry')
    }
    
    const handleReport = () => {
      // Could implement actual reporting logic here
      const reportData = {
        error: props.error,
        details: props.details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      console.log('Error report:', reportData)
      emit('report', reportData)
    }
    
    const handleDismiss = () => {
      visible.value = false
      setTimeout(() => {
        emit('dismiss')
      }, 300) // Wait for animation to complete
    }
    
    // Auto-hide functionality
    if (props.autoHide && props.autoHideDelay > 0) {
      setTimeout(() => {
        if (visible.value) {
          handleDismiss()
        }
      }, props.autoHideDelay)
    }
    
    return {
      visible,
      showDetails,
      typeClass,
      getErrorIcon,
      getErrorTitle,
      handleRetry,
      handleReport,
      handleDismiss
    }
  }
}
</script>

<style scoped>
.error-message {
  position: fixed;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  max-width: 500px;
  min-width: 300px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-modal);
  animation: slideIn 0.3s ease-out;
}

.error-message:not(.visible) {
  animation: slideOut 0.3s ease-in;
}

.error-content {
  padding: var(--spacing-lg);
}

.error-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.error-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.error-title {
  flex: 1;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all var(--transition-fast);
}

.close-button:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.error-body {
  margin-bottom: var(--spacing-md);
}

.error-text {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  line-height: 1.5;
}

.error-details {
  margin-top: var(--spacing-md);
}

.toggle-details {
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: 0;
  text-decoration: underline;
  transition: color var(--transition-fast);
}

.toggle-details:hover {
  color: var(--accent-hover);
}

.details-content {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.details-text {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.error-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.action-button {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background-color: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-button:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.retry-button:hover {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
}

.report-button:hover {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.dismiss-button:hover {
  background-color: var(--text-muted);
  border-color: var(--text-muted);
  color: white;
}

/* Error type variants */
.error-error {
  border-left: 4px solid var(--error-color);
}

.error-warning {
  border-left: 4px solid var(--warning-color);
}

.error-info {
  border-left: 4px solid var(--accent-color);
}

/* Animations */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .error-message {
    top: var(--spacing-md);
    right: var(--spacing-md);
    left: var(--spacing-md);
    max-width: none;
    min-width: auto;
  }
  
  .error-content {
    padding: var(--spacing-md);
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .error-message {
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    left: var(--spacing-sm);
  }
  
  .error-content {
    padding: var(--spacing-sm);
  }
  
  .error-header {
    margin-bottom: var(--spacing-sm);
  }
  
  .error-body {
    margin-bottom: var(--spacing-sm);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .error-message {
    animation: none;
  }
}
</style>