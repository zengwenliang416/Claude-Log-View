<template>
  <component
    :is="as"
    :class="buttonClass"
    :disabled="disabled || loading"
    v-bind="$attrs"
    @click="handleClick"
  >
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <LoadingSpinner :size="spinnerSize" />
    </div>
    <span :class="{ 'opacity-0': loading }">
      <slot name="icon" />
      <slot />
    </span>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'ghost', 'outline', 'destructive'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  as: {
    type: String,
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const buttonClass = computed(() => {
  const baseClasses = [
    'relative inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-[0.98]'
  ]

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg min-h-[36px]',
    md: 'px-4 py-2 text-sm rounded-xl min-h-[40px]',
    lg: 'px-6 py-3 text-base rounded-xl min-h-[44px]',
    xl: 'px-8 py-4 text-lg rounded-2xl min-h-[52px]'
  }

  // Variant classes with glassmorphism effects
  const variantClasses = {
    primary: [
      'bg-primary-600 hover:bg-primary-700 active:bg-primary-800',
      'text-white shadow-lg hover:shadow-xl',
      'focus-visible:ring-primary-500/50 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
      'disabled:hover:bg-primary-600'
    ],
    secondary: [
      'glass-surface hover:bg-white/15 dark:hover:bg-gray-800/15',
      'text-gray-900 dark:text-gray-100',
      'hover:shadow-md focus-visible:ring-gray-500/50',
      'focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900'
    ],
    ghost: [
      'hover:bg-gray-100 dark:hover:bg-gray-800',
      'text-gray-700 dark:text-gray-300',
      'focus-visible:ring-gray-500/50',
      'focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900'
    ],
    outline: [
      'border-2 border-gray-300 dark:border-gray-600',
      'hover:border-gray-400 dark:hover:border-gray-500',
      'hover:bg-gray-50 dark:hover:bg-gray-800/50',
      'text-gray-700 dark:text-gray-300',
      'focus-visible:ring-gray-500/50',
      'focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900'
    ],
    destructive: [
      'bg-red-600 hover:bg-red-700 active:bg-red-800',
      'text-white shadow-lg hover:shadow-xl',
      'focus-visible:ring-red-500/50 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
      'disabled:hover:bg-red-600'
    ]
  }

  return [
    ...baseClasses,
    sizeClasses[props.size],
    ...variantClasses[props.variant]
  ].flat()
})

const spinnerSize = computed(() => {
  const sizes = {
    sm: 'sm',
    md: 'sm',
    lg: 'md',
    xl: 'md'
  }
  return sizes[props.size]
})

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>