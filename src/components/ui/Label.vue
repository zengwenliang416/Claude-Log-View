<template>
  <label :for="htmlFor" :class="labelClass">
    <slot />
    <span v-if="required" class="text-red-500 ml-1" aria-label="required">*</span>
  </label>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  htmlFor: String,
  required: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  weight: {
    type: String,
    default: 'medium',
    validator: (value) => ['normal', 'medium', 'semibold', 'bold'].includes(value)
  },
  color: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'muted', 'primary', 'secondary'].includes(value)
  }
})

const labelClass = computed(() => {
  const baseClasses = ['block']

  // Size variants
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // Weight variants
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  // Color variants
  const colorClasses = {
    default: 'text-gray-900 dark:text-gray-100',
    muted: 'text-gray-600 dark:text-gray-400',
    primary: 'text-primary-700 dark:text-primary-300',
    secondary: 'text-gray-700 dark:text-gray-300'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size],
    weightClasses[props.weight],
    colorClasses[props.color]
  ]
})
</script>