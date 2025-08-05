import { getMessageRole, getMessageToolNames } from './messageTypes.js'

/**
 * Parses a JSONL (JSON Lines) file content into an array of message objects
 * @param {string} jsonlContent - Raw JSONL file content
 * @returns {Promise<Object[]>} Promise resolving to array of parsed messages
 */
export async function parseJsonl(jsonlContent) {
  if (!jsonlContent || typeof jsonlContent !== 'string') {
    throw new Error('Invalid JSONL content')
  }
  
  const lines = jsonlContent.trim().split('\n')
  const messages = []
  const errors = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines
    
    try {
      const parsed = JSON.parse(line)
      
      // Enrich the message with computed properties
      const role = getMessageRole(parsed)
      const tools = getMessageToolNames(parsed)
      
      const enrichedMessage = {
        ...parsed,
        _index: messages.length,
        _role: role,
        _tools: tools,
        _timestamp: parsed.timestamp || null
      }
      
      // Only log first few messages to reduce noise
      if (messages.length < 5) {
        console.log(`Message ${messages.length}: type=${parsed.type}, role=${role}, tools=${tools.join(',')}`)
      }
      
      messages.push(enrichedMessage)
    } catch (error) {
      errors.push({
        line: i + 1,
        content: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
        error: error.message
      })
    }
  }
  
  // Log parsing results
  console.log(`Parsed ${messages.length} messages with ${errors.length} errors`)
  if (errors.length > 0) {
    console.warn('Parsing errors:', errors)
  }
  
  return messages
}

/**
 * Reads and parses a file from a File object
 * @param {File} file - File object from input
 * @returns {Promise<Object[]>} Promise resolving to array of parsed messages
 */
export async function parseFileContent(file) {
  if (!file) {
    throw new Error('No file provided')
  }
  
  // Validate file type
  if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.json')) {
    throw new Error('Invalid file type. Please select a .jsonl or .json file.')
  }
  
  // Check file size (limit to 50MB)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    throw new Error(`File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`)
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const content = event.target.result
        const messages = await parseJsonl(content)
        resolve(messages)
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error.message}`))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Validates a message object structure
 * @param {Object} message - Message object to validate
 * @returns {boolean} True if message is valid
 */
export function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    return false
  }
  
  // Must have at least uuid and type or message
  if (!message.uuid && !message.type && !message.message) {
    return false
  }
  
  return true
}

/**
 * Sorts messages by timestamp in chronological order
 * @param {Object[]} messages - Array of message objects
 * @returns {Object[]} Sorted array of messages
 */
export function sortMessagesByTimestamp(messages) {
  return [...messages].sort((a, b) => {
    const timestampA = a.timestamp || a._timestamp || ''
    const timestampB = b.timestamp || b._timestamp || ''
    
    if (!timestampA && !timestampB) return 0
    if (!timestampA) return 1
    if (!timestampB) return -1
    
    return new Date(timestampA).getTime() - new Date(timestampB).getTime()
  })
}

/**
 * Gets basic statistics about the parsed messages
 * @param {Object[]} messages - Array of message objects
 * @returns {Object} Statistics object
 */
export function getMessageStats(messages) {
  if (!Array.isArray(messages)) {
    return { total: 0, byRole: {}, byTool: {} }
  }
  
  const stats = {
    total: messages.length,
    byRole: {},
    byTool: {}
  }
  
  messages.forEach(message => {
    const role = message._role || 'unknown'
    const tools = message._tools || []
    
    // Count by role
    stats.byRole[role] = (stats.byRole[role] || 0) + 1
    
    // Count by tool
    tools.forEach(tool => {
      stats.byTool[tool] = (stats.byTool[tool] || 0) + 1
    })
  })
  
  return stats
}