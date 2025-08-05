import { ref, computed, watch, nextTick } from 'vue'

/**
 * Virtual scrolling composable for large datasets
 * Optimizes rendering performance by only rendering visible items
 */
export function useVirtualScrolling(items, options = {}) {
  const {
    itemHeight = 100,
    containerHeight = 400,
    buffer = 5,
    enabled = true,
    threshold = 100 // Enable virtual scrolling when items > threshold
  } = options

  // Refs
  const scrollContainer = ref(null)
  const scrollTop = ref(0)
  const containerRef = ref(null)

  // Computed properties
  const shouldUseVirtualScrolling = computed(() => {
    return enabled && items.value && items.value.length > threshold
  })

  const totalHeight = computed(() => {
    return items.value ? items.value.length * itemHeight : 0
  })

  const visibleItemsCount = computed(() => {
    return Math.ceil(containerHeight / itemHeight) + buffer * 2
  })

  const startIndex = computed(() => {
    if (!shouldUseVirtualScrolling.value) return 0
    const start = Math.floor(scrollTop.value / itemHeight) - buffer
    return Math.max(0, start)
  })

  const endIndex = computed(() => {
    if (!shouldUseVirtualScrolling.value) {
      return items.value ? items.value.length - 1 : 0
    }
    const end = startIndex.value + visibleItemsCount.value
    return Math.min(items.value ? items.value.length - 1 : 0, end)
  })

  const visibleItems = computed(() => {
    if (!items.value || !shouldUseVirtualScrolling.value) {
      return items.value || []
    }
    
    return items.value.slice(startIndex.value, endIndex.value + 1).map((item, index) => ({
      item,
      index: startIndex.value + index,
      top: (startIndex.value + index) * itemHeight
    }))
  })

  const offsetY = computed(() => {
    return shouldUseVirtualScrolling.value ? startIndex.value * itemHeight : 0
  })

  // Methods
  const handleScroll = (event) => {
    scrollTop.value = event.target.scrollTop
  }

  const scrollToIndex = async (index) => {
    if (!scrollContainer.value || !items.value) return

    await nextTick()
    
    const targetScrollTop = index * itemHeight
    
    if (shouldUseVirtualScrolling.value) {
      scrollContainer.value.scrollTop = targetScrollTop
    } else {
      // Fallback to element-based scrolling
      const element = scrollContainer.value.children[index]
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    }
  }

  const scrollToTop = () => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0
    }
  }

  const scrollToBottom = () => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = totalHeight.value
    }
  }

  // Performance metrics
  const getPerformanceMetrics = () => {
    return {
      totalItems: items.value ? items.value.length : 0,
      visibleItems: visibleItems.value.length,
      isVirtualized: shouldUseVirtualScrolling.value,
      memoryUsageReduction: shouldUseVirtualScrolling.value 
        ? Math.round((1 - (visibleItems.value.length / (items.value?.length || 1))) * 100)
        : 0
    }
  }

  // Watchers
  watch(() => items.value, () => {
    // Reset scroll position when items change
    scrollTop.value = 0
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0
    }
  })

  return {
    // Refs
    scrollContainer,
    containerRef,
    
    // Computed
    shouldUseVirtualScrolling,
    totalHeight,
    visibleItems,
    offsetY,
    startIndex,
    endIndex,
    
    // Methods
    handleScroll,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    getPerformanceMetrics
  }
}