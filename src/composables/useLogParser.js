import { ref, reactive, computed } from 'vue'
import { parseFileContent, getMessageStats, sortMessagesByTimestamp } from '@/utils/logParser.js'

/**
 * Composable for handling log file parsing and management
 */
export function useLogParser() {
  // Reactive state
  const messages = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const fileInfo = reactive({
    name: '',
    size: 0,
    lastModified: null
  })
  
  // Computed properties
  const messageStats = computed(() => getMessageStats(messages.value))
  const sortedMessages = computed(() => sortMessagesByTimestamp(messages.value))
  
  /**
   * Loads and parses a log file
   * @param {File} file - File object to parse
   */
  const loadFile = async (file) => {
    if (!file) {
      error.value = 'No file provided'
      return
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      // Update file info
      fileInfo.name = file.name
      fileInfo.size = file.size
      fileInfo.lastModified = new Date(file.lastModified)
      
      // Parse the file
      const parsedMessages = await parseFileContent(file)
      
      // Update messages state
      messages.value = parsedMessages
      
      console.log(`Successfully loaded ${parsedMessages.length} messages from ${file.name}`)
      
    } catch (err) {
      console.error('Error loading file:', err)
      error.value = err.message || 'Failed to load file'
      messages.value = []
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Clears all loaded data
   */
  const clearData = () => {
    messages.value = []
    error.value = null
    fileInfo.name = ''
    fileInfo.size = 0
    fileInfo.lastModified = null
  }
  
  /**
   * Gets a message by index
   * @param {number} index - Message index
   * @returns {Object|null} Message object or null
   */
  const getMessageByIndex = (index) => {
    if (index < 0 || index >= messages.value.length) {
      return null
    }
    return messages.value[index]
  }
  
  /**
   * Finds messages matching a search query
   * @param {string} query - Search query
   * @returns {Object[]} Array of matching messages with indices
   */
  const searchMessages = (query) => {
    if (!query || !query.trim()) {
      return []
    }
    
    const searchTerm = query.toLowerCase().trim()
    const results = []
    
    messages.value.forEach((message, index) => {
      let matchFound = false
      
      // Search in message content
      if (message.message?.content) {
        const content = JSON.stringify(message.message.content).toLowerCase()
        if (content.includes(searchTerm)) {
          matchFound = true
        }
      }
      
      // Search in summary
      if (message.summary && message.summary.toLowerCase().includes(searchTerm)) {
        matchFound = true
      }
      
      // Search in tool results
      if (message.toolUseResult?.content) {
        const toolContent = JSON.stringify(message.toolUseResult.content).toLowerCase()
        if (toolContent.includes(searchTerm)) {
          matchFound = true
        }
      }
      
      // Search in UUID
      if (message.uuid && message.uuid.toLowerCase().includes(searchTerm)) {
        matchFound = true
      }
      
      if (matchFound) {
        results.push({ message, index })
      }
    })
    
    return results
  }
  
  return {
    // State
    messages: sortedMessages,
    isLoading,
    error,
    fileInfo,
    
    // Computed
    messageStats,
    
    // Methods
    loadFile,
    clearData,
    getMessageByIndex,
    searchMessages
  }
}