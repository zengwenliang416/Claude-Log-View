<template>
  <div :class="spinnerClass" role="status" aria-label="Loading">
    <svg 
      class="animate-spin" 
      :width="sizeValue" 
      :height="sizeValue" 
      viewBox="0 0 24 24" 
      fill="none"
    >
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round"
        stroke-dasharray="60 40"
        opacity="0.3"
      />
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round"
        stroke-dasharray="15 85"
        stroke-dashoffset="0"
        class="animate-pulse"
      />
    </svg>
    <span class="sr-only">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  label: {
    type: String,
    default: 'Loading...'
  },
  color: {
    type: String,
    default: 'current'
  }
})

const sizeValue = computed(() => {
  const sizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32
  }
  return sizes[props.size]
})

const spinnerClass = computed(() => {
  const baseClasses = ['inline-flex items-center justify-center']
  
  const colorClasses = {
    current: 'text-current',
    primary: 'text-primary-600',
    secondary: 'text-gray-500',
    white: 'text-white'
  }
  
  return [
    ...baseClasses,
    colorClasses[props.color] || colorClasses.current
  ]
})
</script>

<style scoped>
/* Enhanced spinner animation with smooth rotation */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>