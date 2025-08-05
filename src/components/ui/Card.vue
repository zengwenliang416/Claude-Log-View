<template>
  <div :class="cardClass" v-bind="$attrs">
    <!-- Card Header -->
    <header v-if="$slots.header || title" :class="headerClass">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ subtitle }}
        </p>
      </slot>
    </header>
    
    <!-- Card Content -->
    <div v-if="$slots.default" :class="contentClass">
      <slot />
    </div>
    
    <!-- Card Footer -->
    <footer v-if="$slots.footer" :class="footerClass">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  subtitle: String,
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'elevated', 'outlined', 'filled'].includes(value)
  },
  padding: {
    type: String,
    default: 'md',
    validator: (value) => ['none', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  rounded: {
    type: String,
    default: 'lg',
    validator: (value) => ['none', 'sm', 'md', 'lg', 'xl', '2xl'].includes(value)
  },
  interactive: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const cardClass = computed(() => {
  const baseClasses = [
    'relative overflow-hidden transition-all duration-300 ease-out'
  ]

  // Rounded variants
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  }

  // Variant styles
  const variantClasses = {
    default: [
      'glass-surface',
      'hover:bg-white/15 dark:hover:bg-gray-800/15'
    ],
    elevated: [
      'glass-card',
      'hover:shadow-2xl hover:scale-[1.02]'
    ],
    outlined: [
      'bg-white/5 dark:bg-gray-900/5',
      'border-2 border-gray-200 dark:border-gray-700',
      'hover:border-gray-300 dark:hover:border-gray-600',
      'hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
    ],
    filled: [
      'bg-white dark:bg-gray-800',
      'shadow-md hover:shadow-lg',
      'border border-gray-200 dark:border-gray-700'
    ]
  }

  // Interactive states
  const interactiveClasses = props.interactive ? [
    'cursor-pointer',
    'hover:scale-[1.02]',
    'active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2',
    'focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900'
  ] : []

  // Selected state
  const selectedClasses = props.selected ? [
    'ring-2 ring-primary-500/50',
    'bg-primary-50/50 dark:bg-primary-900/20',
    'border-primary-200 dark:border-primary-800'
  ] : []

  return [
    ...baseClasses,
    roundedClasses[props.rounded],
    ...variantClasses[props.variant],
    ...interactiveClasses,
    ...selectedClasses
  ].flat().filter(Boolean)
})

const headerClass = computed(() => {
  const paddingClasses = {
    none: '',
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
    xl: 'px-8 py-6'
  }

  return [
    'border-b border-gray-200/50 dark:border-gray-700/50',
    paddingClasses[props.padding]
  ].filter(Boolean)
})

const contentClass = computed(() => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  }

  return [
    'flex-1',
    paddingClasses[props.padding]
  ].filter(Boolean)
})

const footerClass = computed(() => {
  const paddingClasses = {
    none: '',
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
    xl: 'px-8 py-6'
  }

  return [
    'border-t border-gray-200/50 dark:border-gray-700/50',
    paddingClasses[props.padding]
  ].filter(Boolean)
})
</script>