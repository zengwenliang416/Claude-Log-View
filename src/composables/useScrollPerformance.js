import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for optimizing scroll performance
 * Reduces expensive effects during scroll operations
 */
export function useScrollPerformance(options = {}) {
  const {
    throttleMs = 16, // ~60fps
    enableBlurReduction = true,
    enableClassToggle = true,
    scrollClassName = 'scrolling'
  } = options

  const isScrolling = ref(false)
  const scrollDirection = ref('down')
  const lastScrollTop = ref(0)
  const scrollElement = ref(null)

  let scrollTimer = null
  let rafId = null

  /**
   * Throttled scroll handler for performance
   */
  const handleScroll = () => {
    if (rafId) return
    
    rafId = requestAnimationFrame(() => {
      const element = scrollElement.value || document.documentElement
      const currentScrollTop = element.scrollTop || window.scrollY
      
      // Update scroll direction
      scrollDirection.value = currentScrollTop > lastScrollTop.value ? 'down' : 'up'
      lastScrollTop.value = currentScrollTop
      
      // Mark as scrolling
      if (!isScrolling.value) {
        isScrolling.value = true
        
        if (enableClassToggle) {
          document.body.classList.add(scrollClassName)
        }
        
        if (enableBlurReduction) {
          reduceBlurEffects()
        }
      }
      
      // Clear existing timer
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
      
      // Set timer to detect scroll end
      scrollTimer = setTimeout(() => {
        isScrolling.value = false
        
        if (enableClassToggle) {
          document.body.classList.remove(scrollClassName)
        }
        
        if (enableBlurReduction) {
          restoreBlurEffects()
        }
      }, 150) // 150ms after scroll stops
      
      rafId = null
    })
  }

  /**
   * Reduce blur effects during scroll for performance
   */
  const reduceBlurEffects = () => {
    const glassElements = document.querySelectorAll('.glass-surface')
    glassElements.forEach(element => {
      element.style.backdropFilter = 'blur(4px) saturate(120%)'
    })
  }

  /**
   * Restore full blur effects after scroll
   */
  const restoreBlurEffects = () => {
    const glassElements = document.querySelectorAll('.glass-surface')
    glassElements.forEach(element => {
      element.style.backdropFilter = ''
    })
  }

  /**
   * Optimize element for better scroll performance
   */
  const optimizeElement = (element) => {
    if (!element) return

    // Add performance optimizations
    element.style.willChange = 'transform'
    element.style.transform = 'translateZ(0)'
    element.style.contain = 'layout style paint'
    
    return () => {
      // Cleanup function
      element.style.willChange = ''
      element.style.transform = ''
      element.style.contain = ''
    }
  }

  /**
   * Create a performance-aware scroll listener
   */
  const createScrollListener = (element = null) => {
    scrollElement.value = element
    const target = element || window
    
    target.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      target.removeEventListener('scroll', handleScroll)
    }
  }

  /**
   * Get scroll performance metrics
   */
  const getScrollMetrics = () => {
    return {
      isScrolling: isScrolling.value,
      direction: scrollDirection.value,
      lastScrollTop: lastScrollTop.value,
      optimizationsActive: isScrolling.value && enableBlurReduction
    }
  }

  /**
   * Force enable/disable scroll optimizations
   */
  const setScrollOptimizations = (enabled) => {
    if (enabled) {
      reduceBlurEffects()
      if (enableClassToggle) {
        document.body.classList.add(scrollClassName)
      }
    } else {
      restoreBlurEffects()
      if (enableClassToggle) {
        document.body.classList.remove(scrollClassName)
      }
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (scrollTimer) {
      clearTimeout(scrollTimer)
    }
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    if (enableClassToggle) {
      document.body.classList.remove(scrollClassName)
    }
    restoreBlurEffects()
  })

  return {
    // State
    isScrolling,
    scrollDirection,
    
    // Methods
    createScrollListener,
    optimizeElement,
    getScrollMetrics,
    setScrollOptimizations,
    
    // Manual controls
    reduceBlurEffects,
    restoreBlurEffects
  }
}