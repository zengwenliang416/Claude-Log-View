<template>
  <div class="theme-toggle">
    <!-- Simple Toggle Button -->
    <Button
      v-if="variant === 'simple'"
      variant="ghost"
      :size="size"
      @click="toggleTheme"
      :aria-label="toggleLabel"
      class="theme-toggle-button"
    >
      <component :is="currentIcon" :size="iconSize" />
    </Button>
    
    <!-- Dropdown Selection -->
    <div v-else-if="variant === 'dropdown'" class="relative">
      <Button
        variant="ghost"
        :size="size"
        @click="toggleDropdown"
        :aria-label="dropdownLabel"
        class="theme-toggle-button"
      >
        <component :is="currentIcon" :size="iconSize" />
        <ChevronDownIcon :size="14" class="ml-1" />
      </Button>
      
      <!-- Dropdown Menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
      >
        <div
          v-if="showDropdown"
          class="absolute right-0 top-full mt-2 w-48 z-50"
          @click.stop
        >
          <div class="glass-card rounded-xl p-2 shadow-xl">
            <button
              v-for="theme in availableThemes"
              :key="theme.id"
              @click="selectTheme(theme.id)"
              :class="getThemeButtonClass(theme.id)"
              class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150"
            >
              <component :is="getThemeIcon(theme.id)" :size="16" />
              <div class="flex-1">
                <div class="font-medium">{{ theme.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ getThemeDescription(theme.id) }}
                </div>
              </div>
              <div v-if="selectedTheme === theme.id" class="text-primary-600">
                <CheckIcon :size="16" />
              </div>
            </button>
          </div>
        </div>
      </Transition>
    </div>
    
    <!-- Segmented Control -->
    <div v-else-if="variant === 'segmented'" class="theme-segmented-control">
      <div class="glass-surface rounded-xl p-1 flex">
        <button
          v-for="theme in availableThemes"
          :key="theme.id"
          @click="selectTheme(theme.id)"
          :class="getSegmentedButtonClass(theme.id)"
          :aria-label="`Switch to ${theme.name.toLowerCase()} theme`"
          class="flex items-center justify-center px-3 py-2 rounded-lg transition-all duration-200"
        >
          <component :is="getThemeIcon(theme.id)" :size="16" />
          <span v-if="showLabels" class="ml-2 text-sm font-medium">
            {{ theme.name }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTheme } from '@/composables/useTheme.js'
import { SunIcon, MoonIcon, MonitorIcon, ChevronDownIcon, CheckIcon } from 'lucide-vue-next'
import Button from './Button.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'simple',
    validator: (value) => ['simple', 'dropdown', 'segmented'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  showLabels: {
    type: Boolean,
    default: false
  }
})

// Theme composable
const {
  currentTheme,
  selectedTheme,
  availableThemes,
  isDark,
  setTheme,
  toggleTheme,
  getThemeIcon: getThemeIconName,
  getThemeDescription
} = useTheme()

// Dropdown state
const showDropdown = ref(false)

// Icon mapping
const iconComponents = {
  Sun: SunIcon,
  Moon: MoonIcon,
  Monitor: MonitorIcon
}

// Computed properties
const currentIcon = computed(() => {
  const iconName = getThemeIconName(selectedTheme)
  return iconComponents[iconName] || MonitorIcon
})

const iconSize = computed(() => {
  const sizes = {
    sm: 16,
    md: 20,
    lg: 24
  }
  return sizes[props.size] || 20
})

const toggleLabel = computed(() => {
  return `Switch theme (currently ${currentTheme.value.name.toLowerCase()})`
})

const dropdownLabel = computed(() => {
  return `Theme: ${currentTheme.value.name}`
})

// Methods
const getThemeIcon = (themeId) => {
  const iconName = getThemeIconName(themeId)
  return iconComponents[iconName] || MonitorIcon
}

const selectTheme = (themeId) => {
  setTheme(themeId)
  showDropdown.value = false
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const closeDropdown = (event) => {
  if (!event.target.closest('.theme-toggle')) {
    showDropdown.value = false
  }
}

const getThemeButtonClass = (themeId) => {
  const isSelected = selectedTheme === themeId
  return [
    'hover:bg-gray-100 dark:hover:bg-gray-800',
    isSelected ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : ''
  ].filter(Boolean).join(' ')
}

const getSegmentedButtonClass = (themeId) => {
  const isSelected = selectedTheme === themeId
  return [
    isSelected 
      ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' 
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
  ].filter(Boolean).join(' ')
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<style scoped>
.theme-toggle {
  position: relative;
}

.theme-segmented-control {
  display: inline-flex;
}

/* Animation for theme transitions */
.theme-toggle-button {
  transition: all 200ms ease-out;
}

.theme-toggle-button:hover {
  transform: scale(1.05);
}

.theme-toggle-button:active {
  transform: scale(0.95);
}
</style>