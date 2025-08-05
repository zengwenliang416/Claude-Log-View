<template>
  <div class="relative">
    <!-- Leading Icon -->
    <div 
      v-if="$slots.leading || leadingIcon" 
      class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
    >
      <slot name="leading">
        <component :is="leadingIcon" :size="16" />
      </slot>
    </div>
    
    <!-- Input Element -->
    <input
      :id="id"
      :type="type"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :class="inputClass"
      v-bind="$attrs"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    
    <!-- Floating Label -->
    <label 
      v-if="label && floatingLabel"
      :for="id"
      :class="labelClass"
    >
      {{ label }}
    </label>
    
    <!-- Trailing Icon -->
    <div 
      v-if="$slots.trailing || trailingIcon" 
      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
    >
      <slot name="trailing">
        <component :is="trailingIcon" :size="16" />
      </slot>
    </div>
    
    <!-- Clear Button -->
    <button
      v-if="clearable && modelValue && !disabled && !readonly"
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      @click="clearInput"
    >
      <XIcon :size="16" />
    </button>
  </div>
  
  <!-- Helper Text or Error Message -->
  <div v-if="helperText || error" :class="helperClass">
    {{ error || helperText }}
  </div>
</template>

<script setup>
import { computed, ref, useSlots } from 'vue'
import { XIcon } from 'lucide-vue-next'

const props = defineProps({
  id: String,
  type: {
    type: String,
    default: 'text'
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  placeholder: String,
  label: String,
  floatingLabel: {
    type: Boolean,
    default: false
  },
  helperText: String,
  error: String,
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'filled', 'ghost'].includes(value)
  },
  leadingIcon: [Object, Function],
  trailingIcon: [Object, Function],
  clearable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])
const $slots = useSlots()

const isFocused = ref(false)

const inputClass = computed(() => {
  const baseClasses = [
    'w-full transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
    'focus:ring-offset-white dark:focus:ring-offset-gray-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'placeholder-gray-500 dark:placeholder-gray-400',
    'text-gray-900 dark:text-gray-100'
  ]

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg min-h-[36px]',
    md: 'px-4 py-3 text-sm rounded-xl min-h-[44px]',
    lg: 'px-5 py-4 text-base rounded-xl min-h-[52px]'
  }

  // Variant styles with glassmorphism
  const variantClasses = {
    default: [
      'glass-surface',
      'hover:bg-white/15 dark:hover:bg-gray-800/15',
      'focus:bg-white/20 dark:focus:bg-gray-800/20'
    ],
    filled: [
      'bg-gray-100 dark:bg-gray-800',
      'hover:bg-gray-200 dark:hover:bg-gray-700',
      'focus:bg-white dark:focus:bg-gray-900',
      'border border-transparent focus:border-primary-500'
    ],
    ghost: [
      'bg-transparent border border-gray-300 dark:border-gray-600',
      'hover:border-gray-400 dark:hover:border-gray-500',
      'focus:border-primary-500 focus:ring-0'
    ]
  }

  // Padding adjustments for icons
  const paddingClasses = []
  if (props.leadingIcon || $slots.leading) {
    paddingClasses.push('pl-10')
  }
  if (props.trailingIcon || $slots.trailing || props.clearable) {
    paddingClasses.push('pr-10')
  }

  // Error state
  const errorClasses = props.error ? [
    'ring-2 ring-red-500/50 border-red-500 dark:border-red-400',
    'focus:ring-red-500/50'
  ] : []

  return [
    ...baseClasses,
    sizeClasses[props.size],
    ...variantClasses[props.variant],
    ...paddingClasses,
    ...errorClasses
  ].flat()
})

const labelClass = computed(() => {
  const hasValue = props.modelValue || isFocused.value
  
  return [
    'absolute left-4 transition-all duration-200 ease-out pointer-events-none',
    'text-gray-500 dark:text-gray-400',
    hasValue 
      ? 'top-2 text-xs font-medium' 
      : 'top-1/2 -translate-y-1/2 text-sm',
    props.error ? 'text-red-500 dark:text-red-400' : ''
  ].filter(Boolean)
})

const helperClass = computed(() => [
  'mt-2 text-xs',
  props.error 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-gray-500 dark:text-gray-400'
])

const handleInput = (event) => {
  emit('update:modelValue', event.target.value)
}

const handleFocus = (event) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event) => {
  isFocused.value = false
  emit('blur', event)
}

const clearInput = () => {
  emit('update:modelValue', '')
}
</script>