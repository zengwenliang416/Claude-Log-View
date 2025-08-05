import { ref, computed, watch, onMounted } from 'vue'
import { useStorage, usePreferredColorScheme, useMediaQuery } from '@vueuse/core'

// Theme configuration
const THEMES = {
  light: {
    id: 'light',
    name: 'Light',
    colors: {
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9'
      },
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        muted: '#64748b'
      }
    }
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    colors: {
      background: {
        primary: '#0f172a',
        secondary: '#1e293b',
        tertiary: '#334155'
      },
      text: {
        primary: '#f8fafc',
        secondary: '#cbd5e1',
        muted: '#94a3b8'
      }
    }
  },
  system: {
    id: 'system',
    name: 'System',
    colors: null // Will inherit from system preference
  }
}

// Persistent theme storage
const selectedTheme = useStorage('claude-log-viewer-theme', 'system')
const systemPreference = usePreferredColorScheme()
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

// Reactive theme state
const isDark = ref(false)
const isTransitioning = ref(false)

export function useTheme() {
  // Computed current theme
  const currentTheme = computed(() => {
    if (selectedTheme.value === 'system') {
      return systemPreference.value === 'dark' ? THEMES.dark : THEMES.light
    }
    return THEMES[selectedTheme.value] || THEMES.system
  })

  // Apply theme to document
  const applyTheme = (theme, withTransition = true) => {
    const html = document.documentElement
    const body = document.body

    // Add transition class if animations are enabled
    if (withTransition && !prefersReducedMotion.value) {
      isTransitioning.value = true
      html.classList.add('theme-transitioning')
      
      // Remove transition class after animation completes
      setTimeout(() => {
        html.classList.remove('theme-transitioning')
        isTransitioning.value = false
      }, 300)
    }

    // Update dark mode state
    isDark.value = theme.id === 'dark' || (theme.id === 'system' && systemPreference.value === 'dark')

    // Apply theme classes
    if (isDark.value) {
      html.classList.add('dark')
      html.classList.remove('light')
      body.style.colorScheme = 'dark'
    } else {
      html.classList.add('light')
      html.classList.remove('dark')
      body.style.colorScheme = 'light'
    }

    // Update theme-color meta tag for mobile browsers
    updateThemeColorMeta(isDark.value)
  }

  // Update theme-color meta tag
  const updateThemeColorMeta = (dark) => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]')
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta')
      metaThemeColor.name = 'theme-color'
      document.head.appendChild(metaThemeColor)
    }
    
    metaThemeColor.content = dark ? '#0f172a' : '#ffffff'
  }

  // Theme switching functions
  const setTheme = (themeId) => {
    if (THEMES[themeId]) {
      selectedTheme.value = themeId
    }
  }

  const toggleTheme = () => {
    if (selectedTheme.value === 'light') {
      setTheme('dark')
    } else if (selectedTheme.value === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const cycleTheme = () => {
    const themeOrder = ['light', 'dark', 'system']
    const currentIndex = themeOrder.indexOf(selectedTheme.value)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }

  // Theme utilities
  const getThemeIcon = (themeId) => {
    const icons = {
      light: 'Sun',
      dark: 'Moon',
      system: 'Monitor'
    }
    return icons[themeId] || 'Monitor'
  }

  const getThemeDescription = (themeId) => {
    const descriptions = {
      light: 'Light theme with bright colors',
      dark: 'Dark theme with muted colors',
      system: 'Follow system preference'
    }
    return descriptions[themeId] || 'System default'
  }

  // Initialize theme system
  const initializeTheme = () => {
    // Apply initial theme without transition
    applyTheme(currentTheme.value, false)
    
    // Watch for theme changes
    watch(currentTheme, (newTheme) => {
      applyTheme(newTheme, true)
    }, { immediate: false })

    // Watch for system preference changes
    watch(systemPreference, () => {
      if (selectedTheme.value === 'system') {
        applyTheme(currentTheme.value, true)
      }
    })
  }

  // Available themes for UI
  const availableThemes = computed(() => Object.values(THEMES))

  // Theme state
  const themeState = computed(() => ({
    current: currentTheme.value,
    selected: selectedTheme.value,
    isDark: isDark.value,
    isLight: !isDark.value,
    isSystem: selectedTheme.value === 'system',
    isTransitioning: isTransitioning.value,
    systemPreference: systemPreference.value,
    prefersReducedMotion: prefersReducedMotion.value
  }))

  // Initialize on mount
  onMounted(() => {
    initializeTheme()
  })

  return {
    // State
    currentTheme,
    selectedTheme,
    isDark,
    isTransitioning,
    availableThemes,
    
    // Actions
    setTheme,
    toggleTheme,
    cycleTheme,
    
    // Utilities
    getThemeIcon,
    getThemeDescription,
    
    // Constants
    THEMES
  }
}

// CSS for smooth theme transitions
export const themeTransitionCSS = `
.theme-transitioning,
.theme-transitioning *,
.theme-transitioning *:before,
.theme-transitioning *:after {
  transition: 
    background-color 300ms ease-out,
    border-color 300ms ease-out,
    color 300ms ease-out,
    fill 300ms ease-out,
    stroke 300ms ease-out,
    opacity 300ms ease-out,
    box-shadow 300ms ease-out,
    transform 300ms ease-out,
    backdrop-filter 300ms ease-out !important;
  transition-delay: 0ms !important;
}

@media (prefers-reduced-motion: reduce) {
  .theme-transitioning,
  .theme-transitioning *,
  .theme-transitioning *:before,
  .theme-transitioning *:after {
    transition: none !important;
  }
}
`