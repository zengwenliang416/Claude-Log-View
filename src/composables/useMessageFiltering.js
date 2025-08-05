import { ref, computed, reactive, watch } from 'vue'
import { getMessageRole, getMessageToolNames } from '@/utils/messageTypes.js'
import { FilteringEngine, filteringUtils } from '@/utils/FilteringEngine.js'
import { messageContentCache } from '@/utils/MessageContentCache.js'

/**
 * Composable for filtering messages by role and tool type with performance optimizations
 */
export function useMessageFiltering(messages) {
  // Enhanced filter state with inclusive selection model
  const selectedRoles = reactive(new Set())
  const selectedTools = reactive(new Set())
  const filterMode = ref('inclusive')
  
  // Search state with debouncing
  const searchQuery = ref('')
  const debouncedSearchQuery = ref('')
  
  // Initialize filtering engine with content cache
  const filteringEngine = new FilteringEngine(messageContentCache)
  
  // Error handling state
  const errors = ref([])
  
  // Debounce search query to prevent excessive re-filtering
  const debouncedSearch = filteringUtils.debounceFilter((query) => {
    debouncedSearchQuery.value = query
  }, 300)
  
  // Watch search query and apply debouncing
  watch(searchQuery, (newQuery) => {
    debouncedSearch(newQuery)
  })
  
  // Pre-warm cache when messages change
  watch(messages, (newMessages) => {
    if (newMessages && newMessages.length > 0) {
      filteringEngine.preWarmCache(newMessages)
    }
  }, { immediate: true })
  
  /**
   * Computed property to determine if showing all message types
   */
  const isShowingAll = computed(() => {
    if (debouncedSearchQuery.value && debouncedSearchQuery.value.trim()) {
      return false
    }
    if (selectedRoles.size === 0 || selectedTools.size === 0) {
      return false
    }
    
    return selectedRoles.size === availableRoles.value.length &&
           selectedTools.size === availableTools.value.length
  })
  
  /**
   * Computed property to determine if any filters are currently active
   */
  const hasActiveFilters = computed(() => {
    return !isShowingAll.value
  })
  
  /**
   * Shared filtering results - single source of truth for all filtering operations
   */
  const filteringResults = computed(() => {
    try {
      if (!messages.value || messages.value.length === 0) {
        return {
          filteredMessages: [],
          filteredToOriginalMap: new Map(),
          originalToFilteredMap: new Map(),
          stats: { originalCount: 0, filteredCount: 0, filteringTime: 0 }
        }
      }
      
      // If no filters are active, return all messages with identity mappings
      if (!hasActiveFilters.value) {
        const identityMap = new Map()
        const originalToFilteredMap = new Map()
        
        for (let i = 0; i < messages.value.length; i++) {
          identityMap.set(i, i)
          originalToFilteredMap.set(i, i)
        }
        
        return {
          filteredMessages: messages.value,
          filteredToOriginalMap: identityMap,
          originalToFilteredMap: originalToFilteredMap,
          stats: { 
            originalCount: messages.value.length, 
            filteredCount: messages.value.length, 
            filteringTime: 0 
          }
        }
      }
      
      // Use FilteringEngine for actual filtering (single pass)
      const filters = filteringEngine.createFilterState(selectedRoles, selectedTools, debouncedSearchQuery.value)
      return filteringEngine.processMessages(messages.value, filters)
      
    } catch (error) {
      console.error('Error in filteringResults computed:', error)
      errors.value.push({
        operation: 'filteringResults',
        error: error.message,
        timestamp: Date.now()
      })
      
      // Return empty results as fallback
      return {
        filteredMessages: [],
        filteredToOriginalMap: new Map(),
        originalToFilteredMap: new Map(),
        stats: { originalCount: 0, filteredCount: 0, filteringTime: 0, error: error.message }
      }
    }
  })
  
  /**
   * Filtered messages based on active filters and search
   * Returns all messages by default when no filters are active
   */
  const filteredMessages = computed(() => {
    return filteringResults.value.filteredMessages
  })
  
  /**
   * Available filter options based on current messages
   */
  const availableRoles = computed(() => {
    if (!messages.value || messages.value.length === 0) {
      return []
    }
    
    const roles = new Set()
    messages.value.forEach(message => {
      const role = getMessageRole(message)
      roles.add(role)
    })
    
    return Array.from(roles).sort()
  })
  
  const availableTools = computed(() => {
    if (!messages.value || messages.value.length === 0) {
      return []
    }
    
    const tools = new Set()
    messages.value.forEach(message => {
      const messageTools = getMessageToolNames(message)
      messageTools.forEach(tool => tools.add(tool))
    })
    
    return Array.from(tools).sort()
  })
  
  /**
   * Mapping from filtered message indices to original message indices (optimized)
   */
  const filteredToOriginalIndexMap = computed(() => {
    return filteringResults.value.filteredToOriginalMap
  })
  
  /**
   * Mapping from original message indices to filtered message indices (optimized)
   */
  const originalToFilteredIndexMap = computed(() => {
    return filteringResults.value.originalToFilteredMap
  })
  
  
  /**
   * Toggles a role filter in inclusive selection model
   * @param {string} role - Role to toggle
   */
  const toggleRoleFilter = (role) => {
    if (selectedRoles.has(role)) {
      selectedRoles.delete(role)
    } else {
      selectedRoles.add(role)
    }
  }
  
  /**
   * Toggles a tool filter in inclusive selection model
   * @param {string} tool - Tool to toggle
   */
  const toggleToolFilter = (tool) => {
    if (selectedTools.has(tool)) {
      selectedTools.delete(tool)
    } else {
      selectedTools.add(tool)
    }
  }
  
  /**
   * Clears all role filters
   */
  const clearRoleFilters = () => {
    selectedRoles.clear()
  }
  
  /**
   * Clears all tool filters
   */
  const clearToolFilters = () => {
    selectedTools.clear()
  }
  
  /**
   * Clears all filters and search - restores to "all selected" state
   */
  const clearAllFilters = () => {
    // Restore to "all selected" state instead of empty
    selectAllRoles()
    selectAllTools()
    searchQuery.value = ''
  }
  
  /**
   * Sets multiple role filters at once
   * @param {string[]} roles - Array of roles to set
   */
  const setRoleFilters = (roles) => {
    selectedRoles.clear()
    roles.forEach(role => selectedRoles.add(role))
  }
  
  /**
   * Sets multiple tool filters at once
   * @param {string[]} tools - Array of tools to set
   */
  const setToolFilters = (tools) => {
    selectedTools.clear()
    tools.forEach(tool => selectedTools.add(tool))
  }
  
  /**
   * Selects all available roles
   */
  const selectAllRoles = () => {
    availableRoles.value.forEach(role => selectedRoles.add(role))
  }
  
  /**
   * Selects all available tools
   */
  const selectAllTools = () => {
    availableTools.value.forEach(tool => selectedTools.add(tool))
  }
  
  /**
   * Checks if a specific role is selected
   * @param {string} role - Role to check
   * @returns {boolean} True if role is selected
   */
  const isRoleSelected = (role) => {
    return selectedRoles.has(role)
  }
  
  /**
   * Checks if a specific tool is selected
   * @param {string} tool - Tool to check
   * @returns {boolean} True if tool is selected
   */
  const isToolSelected = (tool) => {
    return selectedTools.has(tool)
  }
  
  /**
   * Computed property to check if all roles are selected
   */
  const areAllRolesSelected = computed(() => {
    return availableRoles.value.length > 0 && selectedRoles.size === availableRoles.value.length
  })
  
  /**
   * Computed property to check if all tools are selected
   */
  const areAllToolsSelected = computed(() => {
    return availableTools.value.length === 0 || selectedTools.size === availableTools.value.length
  })
  
  /**
   * Gets current filter state as plain objects
   */
  const getFilterState = () => {
    return {
      roles: Array.from(selectedRoles),
      tools: Array.from(selectedTools),
      search: searchQuery.value,
      mode: filterMode.value
    }
  }
  
  /**
   * Restores filter state from plain objects
   * @param {Object} state - Filter state to restore
   */
  const restoreFilterState = (state) => {
    if (state.roles) {
      setRoleFilters(state.roles)
    }
    if (state.tools) {
      setToolFilters(state.tools)
    }
    if (state.search !== undefined) {
      searchQuery.value = state.search
    }
  }
  
  /**
   * Gets the original message index from a filtered index with enhanced error handling
   * @param {number} filteredIndex - Index in the filtered array
   * @returns {number} Original index or -1 if not found
   */
  const getOriginalIndex = (filteredIndex) => {
    try {
      // Validate input
      if (typeof filteredIndex !== 'number' || filteredIndex < 0) {
        return -1
      }
      
      // Check if index is within bounds
      const totalFiltered = filteredMessages.value.length
      if (filteredIndex >= totalFiltered) {
        return -1
      }
      
      return filteredToOriginalIndexMap.value.get(filteredIndex) ?? -1
    } catch (error) {
      console.error('Error in getOriginalIndex:', error)
      errors.value.push({
        operation: 'getOriginalIndex',
        error: error.message,
        timestamp: Date.now(),
        parameters: { filteredIndex }
      })
      return -1
    }
  }
  
  /**
   * Gets the filtered message index from an original index with enhanced error handling
   * @param {number} originalIndex - Index in the original array
   * @returns {number} Filtered index or -1 if not found
   */
  const getFilteredIndex = (originalIndex) => {
    try {
      // Validate input
      if (typeof originalIndex !== 'number' || originalIndex < 0) {
        return -1
      }
      
      // Check if index is within bounds
      const totalOriginal = messages.value?.length || 0
      if (originalIndex >= totalOriginal) {
        return -1
      }
      
      return originalToFilteredIndexMap.value.get(originalIndex) ?? -1
    } catch (error) {
      console.error('Error in getFilteredIndex:', error)
      errors.value.push({
        operation: 'getFilteredIndex',
        error: error.message,
        timestamp: Date.now(),
        parameters: { originalIndex }
      })
      return -1
    }
  }
  
  /**
   * Gets the count of messages for a specific role
   * @param {string} role - Role to count
   * @returns {number} Number of messages with this role
   */
  const getRoleMessageCount = (role) => {
    if (!messages.value || messages.value.length === 0) {
      return 0
    }
    
    return messages.value.filter(message => {
      return getMessageRole(message) === role
    }).length
  }
  
  /**
   * Gets the count of messages for a specific tool
   * @param {string} tool - Tool to count
   * @returns {number} Number of messages using this tool
   */
  const getToolMessageCount = (tool) => {
    if (!messages.value || messages.value.length === 0) {
      return 0
    }
    
    return messages.value.filter(message => {
      const tools = getMessageToolNames(message)
      return tools.includes(tool)
    }).length
  }
  
  /**
   * Clears all filtering errors
   */
  const clearErrors = () => {
    errors.value = []
  }
  
  /**
   * Gets current performance metrics from the filtering engine
   * @returns {Object} Performance metrics including cache statistics
   */
  const getPerformanceMetrics = () => {
    return filteringEngine.getPerformanceMetrics()
  }
  
  /**
   * Gets current filtering statistics
   * @returns {Object} Filtering statistics
   */
  const getFilteringStats = () => {
    return filteringResults.value.stats
  }
  
  /**
   * Clears content cache to free memory
   */
  const clearContentCache = () => {
    messageContentCache.clear()
  }
  
  /**
   * Optimizes performance by cleaning up caches and metrics
   * @returns {Object} Optimization results
   */
  const optimize = () => {
    return filteringEngine.optimize()
  }

  // Initialize with all roles and tools selected when available
  watch([availableRoles, availableTools], ([newRoles, newTools]) => {
    if (newRoles.length > 0 && selectedRoles.size === 0) {
      newRoles.forEach(role => selectedRoles.add(role))
    }
    if (newTools.length > 0 && selectedTools.size === 0) {
      newTools.forEach(tool => selectedTools.add(tool))
    }
  }, { immediate: true })

  return {
    // Enhanced state
    selectedRoles,
    selectedTools,
    searchQuery,
    filterMode,
    
    // Computed
    filteredMessages,
    availableRoles,
    availableTools,
    hasActiveFilters,
    isShowingAll,
    areAllRolesSelected,
    areAllToolsSelected,
    filteredToOriginalIndexMap,
    originalToFilteredIndexMap,
    
    // Enhanced methods
    toggleRoleFilter,
    toggleToolFilter,
    clearRoleFilters,
    clearToolFilters,
    clearAllFilters,
    setRoleFilters,
    setToolFilters,
    selectAllRoles,
    selectAllTools,
    isRoleSelected,
    isToolSelected,
    getFilterState,
    restoreFilterState,
    getOriginalIndex,
    getFilteredIndex,
    getRoleMessageCount,
    getToolMessageCount,
    
    // Enhanced methods
    clearErrors,
    getPerformanceMetrics,
    getFilteringStats,
    clearContentCache,
    optimize,
    
    // Error handling
    errors: computed(() => errors.value)
  }
}