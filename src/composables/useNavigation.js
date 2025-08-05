import { ref, computed, watch, readonly } from 'vue'

/**
 * Composable for handling message navigation with enhanced error handling
 */
export function useNavigation(messages) {
  // Current message index
  const currentIndex = ref(0)
  
  // Error handling state
  const errors = ref([])
  
  // Navigation state validation
  const validationErrors = ref([])
  
  /**
   * Safe operation wrapper with error handling
   * @param {Function} operation - Operation to execute safely
   * @param {any} fallback - Fallback value on error
   * @param {string} operationName - Name for error tracking
   * @returns {any} Operation result or fallback
   */
  const safeOperation = (operation, fallback, operationName) => {
    try {
      return operation()
    } catch (error) {
      console.error(`Navigation error in ${operationName}:`, error)
      errors.value.push({
        operation: operationName,
        error: error.message,
        timestamp: Date.now(),
        stack: error.stack
      })
      return fallback
    }
  }
  
  /**
   * Validates navigation state and logs issues
   * @returns {boolean} True if state is valid
   */
  const validateNavigationState = () => {
    validationErrors.value = []
    
    try {
      // Check messages validity
      if (messages.value === null || messages.value === undefined) {
        validationErrors.value.push('Messages array is null or undefined')
        return false
      }
      
      if (!Array.isArray(messages.value)) {
        validationErrors.value.push('Messages is not an array')
        return false
      }
      
      // Check index validity
      if (typeof currentIndex.value !== 'number') {
        validationErrors.value.push('Current index is not a number')
        return false
      }
      
      if (!Number.isInteger(currentIndex.value)) {
        validationErrors.value.push('Current index is not an integer')
        return false
      }
      
      if (messages.value.length === 0) {
        if (currentIndex.value !== 0) {
          validationErrors.value.push('Index should be 0 when messages array is empty')
          return false
        }
        return true // Valid for empty array
      }
      
      if (currentIndex.value < 0) {
        validationErrors.value.push(`Current index ${currentIndex.value} is negative`)
        return false
      }
      
      if (currentIndex.value >= messages.value.length) {
        validationErrors.value.push(`Current index ${currentIndex.value} exceeds array bounds (${messages.value.length})`)
        return false
      }
      
      return true
    } catch (error) {
      validationErrors.value.push(`Validation error: ${error.message}`)
      return false
    }
  }
  
  // Computed properties with enhanced error handling
  const currentMessage = computed(() => {
    return safeOperation(() => {
      if (!messages.value || messages.value.length === 0) {
        return null
      }
      
      const index = currentIndex.value
      if (index < 0 || index >= messages.value.length) {
        return null
      }
      
      const message = messages.value[index]
      
      // Validate message structure
      if (!message || typeof message !== 'object') {
        console.warn(`Invalid message at index ${index}:`, message)
        return null
      }
      
      return message
    }, null, 'currentMessage')
  })
  
  const totalMessages = computed(() => {
    return safeOperation(() => {
      if (!messages.value || !Array.isArray(messages.value)) {
        return 0
      }
      return messages.value.length
    }, 0, 'totalMessages')
  })
  
  const canGoPrevious = computed(() => {
    return safeOperation(() => {
      return currentIndex.value > 0 && totalMessages.value > 0
    }, false, 'canGoPrevious')
  })
  
  const canGoNext = computed(() => {
    return safeOperation(() => {
      return currentIndex.value < totalMessages.value - 1 && totalMessages.value > 0
    }, false, 'canGoNext')
  })
  
  const navigationInfo = computed(() => {
    return safeOperation(() => {
      const total = totalMessages.value
      
      if (total === 0) {
        return { 
          current: 0, 
          total: 0, 
          position: '0 / 0',
          isValid: true
        }
      }
      
      const current = Math.min(Math.max(currentIndex.value, 0), total - 1)
      const isValid = validateNavigationState()
      
      return {
        current: current + 1,
        total: total,
        position: `${current + 1} / ${total}`,
        isValid,
        validationErrors: validationErrors.value.slice()
      }
    }, { current: 0, total: 0, position: '0 / 0', isValid: false }, 'navigationInfo')
  })
  
  // Watch for messages changes and reset navigation if needed
  watch(messages, (newMessages, oldMessages) => {
    safeOperation(() => {
      if (!newMessages || newMessages.length === 0) {
        currentIndex.value = 0
        return
      }
      
      // Validate new messages array
      if (!Array.isArray(newMessages)) {
        console.error('New messages is not an array:', newMessages)
        currentIndex.value = 0
        return
      }
      
      // If current index is out of bounds, reset to last valid message
      if (currentIndex.value >= newMessages.length) {
        const newIndex = Math.max(0, newMessages.length - 1)
        console.debug(`Index out of bounds, resetting from ${currentIndex.value} to ${newIndex}`)
        currentIndex.value = newIndex
      }
      
      // If messages array changed (not just length), try to preserve current message
      if (oldMessages && Array.isArray(oldMessages) && oldMessages.length > 0 && newMessages !== oldMessages) {
        syncNavigationState(oldMessages, newMessages)
      }
      
      // Validate final state
      if (!validateNavigationState()) {
        console.warn('Navigation state invalid after messages change, correcting...')
        correctNavigationState()
      }
    }, undefined, 'messagesWatcher')
  }, { immediate: true })
  
  /**
   * Navigates to the previous message with enhanced validation
   */
  const goToPrevious = () => {
    return safeOperation(() => {
      if (!validateNavigationState()) {
        correctNavigationState()
      }
      
      if (canGoPrevious.value) {
        const newIndex = currentIndex.value - 1
        if (newIndex >= 0) {
          currentIndex.value = newIndex
          return true
        }
      }
      return false
    }, false, 'goToPrevious')
  }
  
  /**
   * Navigates to the next message with enhanced validation
   */
  const goToNext = () => {
    return safeOperation(() => {
      if (!validateNavigationState()) {
        correctNavigationState()
      }
      
      if (canGoNext.value) {
        const newIndex = currentIndex.value + 1
        if (newIndex < totalMessages.value) {
          currentIndex.value = newIndex
          return true
        }
      }
      return false
    }, false, 'goToNext')
  }
  
  /**
   * Navigates to a specific message index with comprehensive validation
   * @param {number} index - Target message index
   * @returns {boolean} True if navigation succeeded
   */
  const goToIndex = (index) => {
    return safeOperation(() => {
      // Validate input
      if (typeof index !== 'number') {
        console.warn('goToIndex: index must be a number, got:', typeof index)
        return false
      }
      
      if (!Number.isInteger(index)) {
        console.warn('goToIndex: index must be an integer, got:', index)
        return false
      }
      
      if (index < 0) {
        console.warn('goToIndex: index cannot be negative, got:', index)
        return false
      }
      
      const total = totalMessages.value
      if (index >= total) {
        console.warn(`goToIndex: index ${index} exceeds bounds (0-${total - 1})`)
        return false
      }
      
      // Validate current navigation state
      if (!validateNavigationState()) {
        console.debug('Navigation state invalid before goToIndex, correcting...')
        correctNavigationState()
      }
      
      currentIndex.value = index
      
      // Validate after setting
      if (!validateNavigationState()) {
        console.error('Navigation state became invalid after goToIndex')
        correctNavigationState()
        return false
      }
      
      return true
    }, false, 'goToIndex')
  }
  
  /**
   * Navigates to the first message
   */
  const goToFirst = () => {
    if (totalMessages.value > 0) {
      currentIndex.value = 0
    }
  }
  
  /**
   * Navigates to the last message
   */
  const goToLast = () => {
    if (totalMessages.value > 0) {
      currentIndex.value = totalMessages.value - 1
    }
  }
  
  /**
   * Handles keyboard navigation
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyboardNavigation = (event) => {
    // Only handle navigation if no input is focused
    if (event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) {
      return
    }
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        goToPrevious()
        break
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        goToNext()
        break
      case 'Home':
        event.preventDefault()
        goToFirst()
        break
      case 'End':
        event.preventDefault()
        goToLast()
        break
    }
  }
  
  /**
   * Finds the index of a message by UUID
   * @param {string} uuid - Message UUID to find
   * @returns {number} Message index or -1 if not found
   */
  const findMessageIndex = (uuid) => {
    if (!messages.value || !uuid) {
      return -1
    }
    
    return messages.value.findIndex(message => message.uuid === uuid)
  }
  
  /**
   * Navigates to a message by UUID
   * @param {string} uuid - Message UUID to navigate to
   * @returns {boolean} True if message was found and navigated to
   */
  const goToMessageByUuid = (uuid) => {
    const index = findMessageIndex(uuid)
    if (index >= 0) {
      goToIndex(index)
      return true
    }
    return false
  }
  
  /**
   * Gets the current navigation state for persistence
   */
  const getNavigationState = () => {
    return {
      currentIndex: currentIndex.value,
      currentMessageUuid: currentMessage.value?.uuid || null
    }
  }
  
  /**
   * Restores navigation state
   * @param {Object} state - Navigation state to restore
   */
  const restoreNavigationState = (state) => {
    if (state.currentMessageUuid) {
      // Try to navigate to the same message by UUID first
      if (!goToMessageByUuid(state.currentMessageUuid)) {
        // Fall back to index if UUID not found
        if (typeof state.currentIndex === 'number') {
          goToIndex(state.currentIndex)
        }
      }
    } else if (typeof state.currentIndex === 'number') {
      goToIndex(state.currentIndex)
    }
  }
  
  /**
   * Synchronizes navigation state when messages array changes (due to filtering)
   * Attempts to preserve the current message when possible
   * @param {Array} oldMessages - Previous messages array
   * @param {Array} newMessages - New messages array
   */
  const syncNavigationState = (oldMessages, newMessages) => {
    if (!oldMessages || !newMessages || oldMessages.length === 0 || newMessages.length === 0) {
      return
    }
    
    // Get the current message from old array
    const currentMsg = oldMessages[currentIndex.value]
    if (!currentMsg || !currentMsg.uuid) {
      return
    }
    
    // Try to find the same message in new array by UUID
    const newIndex = newMessages.findIndex(msg => msg.uuid === currentMsg.uuid)
    
    if (newIndex >= 0) {
      // Message found in new array, navigate to it
      currentIndex.value = newIndex
    } else {
      // Message not found (filtered out), find closest valid message
      findClosestValidMessage(newMessages)
    }
  }
  
  /**
   * Finds the closest valid message when current message is filtered out
   * @param {Array} messages - Available messages array
   */
  const findClosestValidMessage = (messages) => {
    if (!messages || messages.length === 0) {
      currentIndex.value = 0
      return
    }
    
    // For now, just go to the first message
    // This could be enhanced to find a message with similar timestamp or position
    currentIndex.value = 0
  }
  
  /**
   * Validates if the current navigation state is valid
   * @returns {boolean} True if navigation state is valid
   */
  const isValidNavigationState = () => {
    if (!messages.value || messages.value.length === 0) {
      return currentIndex.value === 0
    }
    
    return currentIndex.value >= 0 && currentIndex.value < messages.value.length
  }
  
  /**
   * Corrects navigation state if it's invalid
   * @returns {boolean} True if correction was applied
   */
  const correctNavigationState = () => {
    if (isValidNavigationState()) {
      return false
    }
    
    if (!messages.value || messages.value.length === 0) {
      currentIndex.value = 0
    } else if (currentIndex.value >= messages.value.length) {
      currentIndex.value = Math.max(0, messages.value.length - 1)
    } else if (currentIndex.value < 0) {
      currentIndex.value = 0
    }
    
    return true
  }
  
  /**
   * Clears all navigation errors
   */
  const clearErrors = () => {
    errors.value = []
    validationErrors.value = []
  }
  
  /**
   * Gets current error state for debugging
   * @returns {Object} Error information
   */
  const getErrorState = () => {
    return {
      errors: errors.value.slice(),
      validationErrors: validationErrors.value.slice(),
      isValid: validateNavigationState(),
      currentState: {
        currentIndex: currentIndex.value,
        totalMessages: totalMessages.value,
        messagesType: messages.value ? typeof messages.value : 'undefined',
        messagesLength: messages.value?.length || 0
      }
    }
  }
  
  /**
   * Performs comprehensive navigation state check and correction
   * @returns {Object} Validation and correction results
   */
  const performHealthCheck = () => {
    const beforeState = {
      index: currentIndex.value,
      isValid: validateNavigationState(),
      errors: validationErrors.value.slice()
    }
    
    const correctionApplied = correctNavigationState()
    
    const afterState = {
      index: currentIndex.value,
      isValid: validateNavigationState(),
      errors: validationErrors.value.slice()
    }
    
    return {
      beforeState,
      afterState,
      correctionApplied,
      isHealthy: afterState.isValid && afterState.errors.length === 0
    }
  }

  return {
    // State
    currentIndex,
    
    // Computed
    currentMessage,
    totalMessages,
    canGoPrevious,
    canGoNext,
    navigationInfo,
    
    // Methods
    goToPrevious,
    goToNext,
    goToIndex,
    goToFirst,
    goToLast,
    handleKeyboardNavigation,
    findMessageIndex,
    goToMessageByUuid,
    getNavigationState,
    restoreNavigationState,
    syncNavigationState,
    isValidNavigationState,
    correctNavigationState,
    
    // Enhanced error handling
    validateNavigationState,
    clearErrors,
    getErrorState,
    performHealthCheck,
    
    // Error state (readonly)
    errors: readonly(errors),
    validationErrors: readonly(validationErrors)
  }
}