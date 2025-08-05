/**
 * Test data factory functions for creating consistent test data
 */

export const createUserMessage = (uuid = '1', content = 'Test user message') => ({
  uuid,
  type: 'user',
  message: { content },
  timestamp: new Date().toISOString(),
  _role: 'user',
  _tools: [],
  _index: 0
})

export const createAssistantMessage = (uuid = '2', content = 'Test assistant message') => ({
  uuid,
  type: 'assistant',  
  message: { content },
  timestamp: new Date().toISOString(),
  _role: 'assistant',
  _tools: [],
  _index: 1
})

export const createToolMessage = (uuid = '3', toolName = 'Bash', command = 'ls -la') => ({
  uuid,
  type: 'assistant',
  message: {
    content: [
      { type: 'text', text: `Using ${toolName} tool` },
      { type: 'tool_use', name: toolName, input: { command } }
    ]
  },
  timestamp: new Date().toISOString(),
  _role: 'tool',
  _tools: [toolName],
  _index: 2
})

export const createToolResultMessage = (uuid = '4', toolName = 'Bash', output = 'command output') => ({
  uuid,
  toolUseResult: {
    type: toolName,
    content: output
  },
  timestamp: new Date().toISOString(),
  _role: 'tool_result',
  _tools: [toolName],
  _index: 3
})

export const createSummaryMessage = (uuid = '5', summary = 'Test summary') => ({
  uuid,
  type: 'summary',
  summary,
  timestamp: new Date().toISOString(),
  _role: 'summary',
  _tools: [],
  _index: 4
})

export const createMessageSet = (count = 5) => {
  const messages = []
  
  for (let i = 0; i < count; i++) {
    const uuid = `${i + 1}`
    const messageType = i % 4
    
    switch (messageType) {
      case 0:
        messages.push(createUserMessage(uuid, `User message ${i + 1}`))
        break
      case 1:
        messages.push(createAssistantMessage(uuid, `Assistant message ${i + 1}`))
        break
      case 2:
        messages.push(createToolMessage(uuid, 'Bash', `command-${i + 1}`))
        break
      case 3:
        messages.push(createToolResultMessage(uuid, 'Bash', `output-${i + 1}`))
        break
    }
  }
  
  return messages.map((msg, index) => ({
    ...msg,
    _index: index
  }))
}

export const createComplexMessage = (uuid = '1') => ({
  uuid,
  type: 'assistant',
  message: {
    content: [
      { type: 'text', text: 'I need to use multiple tools to help you.' },
      { 
        type: 'tool_use', 
        name: 'Read', 
        input: { file_path: '/path/to/file.js' }
      },
      { type: 'text', text: 'Now let me edit the file.' },
      {
        type: 'tool_use',
        name: 'Edit',
        input: {
          file_path: '/path/to/file.js',
          old_string: 'old code',
          new_string: 'new code'
        }
      }
    ]
  },
  timestamp: new Date().toISOString(),
  _role: 'tool',
  _tools: ['Read', 'Edit'],
  _index: 0
})

export const createErrorMessage = (uuid = '1') => ({
  uuid,
  type: 'error',
  error: {
    type: 'ParseError',
    message: 'Failed to parse JSON',
    code: 'PARSE_ERROR'
  },
  timestamp: new Date().toISOString(),
  _role: 'error',
  _tools: [],
  _index: 0
})

export const createLargeMessage = (uuid = '1', contentSize = 10000) => ({
  uuid,
  type: 'user',
  message: {
    content: 'A'.repeat(contentSize)
  },
  timestamp: new Date().toISOString(),
  _role: 'user',
  _tools: [],
  _index: 0
})

export const createJsonlContent = (messages) => {
  return messages.map(msg => {
    // Remove computed properties for JSONL
    const { _role, _tools, _index, ...cleanMsg } = msg
    return JSON.stringify(cleanMsg)
  }).join('\n')
}

export const createMalformedJsonl = () => {
  return `{"uuid": "1", "type": "user", "message": {"content": "Valid message"}}
invalid json line here
{"uuid": "2", "type": "assistant"
{"uuid": "3", "type": "user", "message": {"content": "Another valid message"}}`
}

export const createEmptyJsonl = () => {
  return ''
}

export const createLargeJsonl = (messageCount = 10000) => {
  const messages = createMessageSet(messageCount)
  return createJsonlContent(messages)
}

/**
 * Mock file creation helpers
 */
export const createTestFile = (content, filename = 'test.jsonl', type = 'application/json') => {
  if (typeof global !== 'undefined' && global.createMockFile) {
    return global.createMockFile(content, filename, { type })
  }
  
  // Fallback for environments without global mock
  return new File([content], filename, { type })
}

export const createValidJsonlFile = (messageCount = 3) => {
  const messages = createMessageSet(messageCount)
  const content = createJsonlContent(messages)
  return createTestFile(content, 'valid.jsonl')
}

export const createInvalidJsonlFile = () => {
  const content = createMalformedJsonl()
  return createTestFile(content, 'invalid.jsonl')
}

export const createLargeJsonlFile = (messageCount = 1000) => {
  const content = createLargeJsonl(messageCount)
  return createTestFile(content, 'large.jsonl')
}

export const createWrongTypeFile = () => {
  return createTestFile('Not JSON content', 'wrong.txt', 'text/plain')
}

/**
 * Filter test data
 */
export const createFilterTestData = () => {
  return [
    createUserMessage('1', 'Hello world'),
    createAssistantMessage('2', 'Hi there, how can I help?'),
    createToolMessage('3', 'Bash', 'ls -la'),
    createToolResultMessage('4', 'Bash', 'file1.txt\nfile2.txt'),
    createToolMessage('5', 'Read', '/path/to/file.txt'),
    createToolResultMessage('6', 'Read', 'File content here'),
    createUserMessage('7', 'Thank you for the help'),
    createSummaryMessage('8', 'Task completed successfully')
  ]
}

/**
 * Search test data
 */
export const createSearchTestData = () => {
  return [
    createUserMessage('1', 'I need help with error handling'),
    createAssistantMessage('2', 'I can help you with error handling in JavaScript'),
    createUserMessage('3', 'How do I catch exceptions?'),
    createAssistantMessage('4', 'You can use try-catch blocks'),
    createToolMessage('5', 'Read', 'error-handling.js'),
    createToolResultMessage('6', 'Read', 'try { code } catch (error) { handle }'),
    createUserMessage('7', 'What about async errors?'),
    createAssistantMessage('8', 'For async code, use try-catch with async/await')
  ]
}

/**
 * Navigation test data
 */
export const createNavigationTestData = () => {
  const baseMessages = createMessageSet(10)
  return baseMessages.map((msg, index) => ({
    ...msg,
    uuid: `nav-${index + 1}`,
    message: { content: `Navigation test message ${index + 1}` }
  }))
}

/**
 * Performance test data generators
 */
export const createPerformanceTestData = (messageCount = 1000) => {
  const messages = []
  const tools = ['Bash', 'Read', 'Edit', 'Write', 'Grep']
  
  for (let i = 0; i < messageCount; i++) {
    const messageType = i % 4
    const tool = tools[i % tools.length]
    
    switch (messageType) {
      case 0:
        messages.push(createUserMessage(`perf-${i}`, `Performance test message ${i}`))
        break
      case 1:
        messages.push(createAssistantMessage(`perf-${i}`, `Response ${i}`))
        break
      case 2:
        messages.push(createToolMessage(`perf-${i}`, tool, `command-${i}`))
        break
      case 3:
        messages.push(createToolResultMessage(`perf-${i}`, tool, `output-${i}`.repeat(10)))
        break
    }
  }
  
  return messages
}

export const createMemoryTestData = (messageCount = 5000, contentMultiplier = 1) => {
  return Array.from({ length: messageCount }, (_, i) => ({
    uuid: `mem-${i}`,
    type: 'user',
    message: {
      content: `Memory test message ${i} with repeated content`.repeat(contentMultiplier)
    },
    timestamp: new Date(Date.now() - i * 1000).toISOString(),
    _role: 'user',
    _tools: [],
    _index: i
  }))
}