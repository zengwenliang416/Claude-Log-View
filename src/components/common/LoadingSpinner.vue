<template>
  <div class="loading-spinner" :class="sizeClass">
    <div class="spinner" :class="{ pulse }">
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
      <div class="spinner-ring"></div>
    </div>
    
    <span v-if="text" class="loading-text">{{ text }}</span>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'LoadingSpinner',
  props: {
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    text: {
      type: String,
      default: ''
    },
    pulse: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const sizeClass = computed(() => `size-${props.size}`)
    
    return {
      sizeClass
    }
  }
}
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.spinner {
  position: relative;
  display: inline-block;
}

.spinner-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top: 2px solid var(--accent-color);
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(1) {
  width: 100%;
  height: 100%;
  animation-duration: 1.2s;
}

.spinner-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  top: 10%;
  left: 10%;
  border-top-color: var(--success-color);
  animation-duration: 1.6s;
  animation-direction: reverse;
}

.spinner-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  top: 20%;
  left: 20%;
  border-top-color: var(--warning-color);
  animation-duration: 2s;
}

.spinner.pulse .spinner-ring {
  animation-name: spin-pulse;
}

.loading-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: center;
}

/* Size variants */
.size-small .spinner {
  width: 20px;
  height: 20px;
}

.size-small .loading-text {
  font-size: var(--font-size-xs);
}

.size-medium .spinner {
  width: 32px;
  height: 32px;
}

.size-large .spinner {
  width: 48px;
  height: 48px;
}

.size-large .loading-text {
  font-size: var(--font-size-base);
}

/* Animations */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spin-pulse {
  0% {
    transform: rotate(0deg) scale(1);
    opacity: 1;
  }
  50% {
    transform: rotate(180deg) scale(0.8);
    opacity: 0.7;
  }
  100% {
    transform: rotate(360deg) scale(1);
    opacity: 1;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .spinner-ring {
    border-width: 3px;
  }
  
  .spinner-ring:nth-child(1) {
    border-top-color: currentColor;
  }
  
  .spinner-ring:nth-child(2) {
    border-top-color: currentColor;
  }
  
  .spinner-ring:nth-child(3) {
    border-top-color: currentColor;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .spinner-ring {
    animation: none;
  }
  
  .spinner::after {
    content: '⏳';
    font-size: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  
  .size-small .spinner::after {
    font-size: 16px;
  }
  
  .size-medium .spinner::after {
    font-size: 24px;
  }
  
  .size-large .spinner::after {
    font-size: 32px;
  }
}
</style>