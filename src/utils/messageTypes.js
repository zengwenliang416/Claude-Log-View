// Message type constants and utilities
export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  TOOL_RESULT: 'tool_result',
  SUMMARY: 'summary'
}

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  TOOL: 'tool',
  TOOL_RESULT: 'tool_result'
}

export const TOOL_TYPES = {
  BASH: 'Bash',
  EDIT: 'Edit',
  GLOB: 'Glob',
  GREP: 'Grep',
  READ: 'Read',
  TODO_WRITE: 'TodoWrite',
  TASK: 'Task',
  WRITE: 'Write',
  MULTI_EDIT: 'MultiEdit',
  NOTEBOOK_EDIT: 'NotebookEdit'
}

// Role filter options for UI
export const ROLE_FILTER_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'tool', label: 'Tool' },
  { value: 'tool_result', label: 'Tool Result' }
]

// Tool filter options for UI
export const TOOL_FILTER_OPTIONS = [
  { value: 'Bash', label: 'Bash' },
  { value: 'Edit', label: 'Edit' },
  { value: 'Glob', label: 'Glob' },
  { value: 'Grep', label: 'Grep' },
  { value: 'Read', label: 'Read' },
  { value: 'TodoWrite', label: 'TodoWrite' },
  { value: 'Task', label: 'Task' },
  { value: 'Write', label: 'Write' },
  { value: 'MultiEdit', label: 'MultiEdit' },
  { value: 'NotebookEdit', label: 'NotebookEdit' }
]

/**
 * Determines the role of a message based on its properties
 * @param {Object} message - The message object
 * @returns {string} The message role
 */
export function getMessageRole(message) {
  if (!message) return 'unknown'
  
  // Check for summary messages
  if (message.type === MESSAGE_TYPES.SUMMARY) {
    return 'summary'
  }
  
  // Check for tool result messages (has toolUseResult or tool_use_id)
  if (message.toolUseResult || message.tool_use_id) {
    return MESSAGE_ROLES.TOOL_RESULT
  }
  
  // Check for tool use in assistant messages
  if (message.type === MESSAGE_TYPES.ASSISTANT && message.message) {
    const content = message.message.content
    if (Array.isArray(content) && content.some(item => item.type === 'tool_use')) {
      return MESSAGE_ROLES.TOOL
    }
  }
  
  // Return the message type or role directly
  return message.type || message.message?.role || 'unknown'
}

/**
 * Extracts tool names from a message
 * @param {Object} message - The message object
 * @returns {string[]} Array of tool names used in the message
 */
export function getMessageToolNames(message) {
  if (!message) return []
  
  const tools = []
  
  // Check assistant messages with tool_use content
  if (message.message?.content && Array.isArray(message.message.content)) {
    message.message.content.forEach(item => {
      if (item.type === 'tool_use' && item.name) {
        tools.push(item.name)
      }
    })
  }
  
  // Check tool result messages
  if (message.toolUseResult?.type) {
    tools.push(message.toolUseResult.type)
  }
  
  return tools
}

/**
 * Gets a display-friendly message type label
 * @param {Object} message - The message object
 * @returns {string} Display label for the message type
 */
export function getMessageTypeLabel(message) {
  const role = getMessageRole(message)
  
  switch (role) {
    case MESSAGE_ROLES.USER:
      return 'USER'
    case MESSAGE_ROLES.ASSISTANT:
      return 'ASSISTANT'
    case MESSAGE_ROLES.TOOL:
      const tools = getMessageToolNames(message)
      return tools.length > 0 ? `TOOL (${tools.join(', ')})` : 'TOOL'
    case MESSAGE_ROLES.TOOL_RESULT:
      return 'TOOL RESULT'
    case 'summary':
      return 'SUMMARY'
    default:
      return role.toUpperCase()
  }
}

/**
 * Gets the CSS class name for a message type
 * @param {Object} message - The message object
 * @returns {string} CSS class name
 */
export function getMessageTypeClass(message) {
  const role = getMessageRole(message)
  
  switch (role) {
    case MESSAGE_ROLES.USER:
      return 'message-user'
    case MESSAGE_ROLES.ASSISTANT:
      return 'message-assistant'
    case MESSAGE_ROLES.TOOL:
      return 'message-tool'
    case MESSAGE_ROLES.TOOL_RESULT:
      return 'message-tool-result'
    case 'summary':
      return 'message-summary'
    default:
      return 'message-unknown'
  }
}