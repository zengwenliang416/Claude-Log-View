import { describe, it, expect } from 'vitest'
import {
  MESSAGE_TYPES,
  MESSAGE_ROLES,
  TOOL_TYPES,
  getMessageRole,
  getMessageToolNames,
  getMessageTypeLabel,
  getMessageTypeClass
} from '@/utils/messageTypes.js'

describe('messageTypes', () => {
  describe('getMessageRole', () => {
    it('should return unknown for null/undefined messages', () => {
      expect(getMessageRole(null)).toBe('unknown')
      expect(getMessageRole(undefined)).toBe('unknown')
    })

    it('should identify summary messages', () => {
      const message = { type: MESSAGE_TYPES.SUMMARY }
      expect(getMessageRole(message)).toBe('summary')
    })

    it('should identify tool result messages by toolUseResult', () => {
      const message = { toolUseResult: { content: 'result' } }
      expect(getMessageRole(message)).toBe(MESSAGE_ROLES.TOOL_RESULT)
    })

    it('should identify tool result messages by tool_use_id', () => {
      const message = { tool_use_id: '123' }
      expect(getMessageRole(message)).toBe(MESSAGE_ROLES.TOOL_RESULT)
    })

    it('should identify tool use in assistant messages', () => {
      const message = {
        type: MESSAGE_TYPES.ASSISTANT,
        message: {
          content: [
            { type: 'text', text: 'Using tool' },
            { type: 'tool_use', name: 'Bash' }
          ]
        }
      }
      expect(getMessageRole(message)).toBe(MESSAGE_ROLES.TOOL)
    })

    it('should return message type directly', () => {
      const message = { type: MESSAGE_TYPES.USER }
      expect(getMessageRole(message)).toBe(MESSAGE_TYPES.USER)
    })

    it('should return message role from nested message', () => {
      const message = { message: { role: 'assistant' } }
      expect(getMessageRole(message)).toBe('assistant')
    })

    it('should return unknown for messages without identifiable role', () => {
      const message = { some: 'data' }
      expect(getMessageRole(message)).toBe('unknown')
    })
  })

  describe('getMessageToolNames', () => {
    it('should return empty array for null/undefined messages', () => {
      expect(getMessageToolNames(null)).toEqual([])
      expect(getMessageToolNames(undefined)).toEqual([])
    })

    it('should extract tool names from assistant message content', () => {
      const message = {
        message: {
          content: [
            { type: 'text', text: 'Using tools' },
            { type: 'tool_use', name: 'Bash' },
            { type: 'tool_use', name: 'Read' }
          ]
        }
      }
      
      const tools = getMessageToolNames(message)
      expect(tools).toEqual(['Bash', 'Read'])
    })

    it('should extract tool name from toolUseResult', () => {
      const message = {
        toolUseResult: { type: 'Edit' }
      }
      
      const tools = getMessageToolNames(message)
      expect(tools).toEqual(['Edit'])
    })

    it('should handle mixed tool sources', () => {
      const message = {
        message: {
          content: [
            { type: 'tool_use', name: 'Bash' }
          ]
        },
        toolUseResult: { type: 'Read' }
      }
      
      const tools = getMessageToolNames(message)
      expect(tools).toEqual(['Bash', 'Read'])
    })

    it('should handle messages without tools', () => {
      const message = {
        message: {
          content: [
            { type: 'text', text: 'No tools here' }
          ]
        }
      }
      
      const tools = getMessageToolNames(message)
      expect(tools).toEqual([])
    })

    it('should skip tool_use items without names', () => {
      const message = {
        message: {
          content: [
            { type: 'tool_use' }, // no name
            { type: 'tool_use', name: 'Bash' }
          ]
        }
      }
      
      const tools = getMessageToolNames(message)
      expect(tools).toEqual(['Bash'])
    })
  })

  describe('getMessageTypeLabel', () => {
    it('should return USER label for user messages', () => {
      const message = { type: MESSAGE_TYPES.USER }
      expect(getMessageTypeLabel(message)).toBe('USER')
    })

    it('should return ASSISTANT label for assistant messages', () => {
      const message = { type: MESSAGE_TYPES.ASSISTANT }
      expect(getMessageTypeLabel(message)).toBe('ASSISTANT')
    })

    it('should return TOOL label with tool names', () => {
      const message = {
        type: MESSAGE_TYPES.ASSISTANT,
        message: {
          content: [
            { type: 'tool_use', name: 'Bash' },
            { type: 'tool_use', name: 'Read' }
          ]
        }
      }
      expect(getMessageTypeLabel(message)).toBe('TOOL (Bash, Read)')
    })

    it('should return TOOL label without names when no tools', () => {
      const message = {
        type: MESSAGE_TYPES.ASSISTANT,
        message: { content: [{ type: 'tool_use' }] } // tool without name
      }
      // Mock getMessageRole to return 'tool' for this test
      expect(getMessageTypeLabel(message)).toBe('TOOL')
    })

    it('should return TOOL RESULT label', () => {
      const message = { toolUseResult: { content: 'result' } }
      expect(getMessageTypeLabel(message)).toBe('TOOL RESULT')
    })

    it('should return SUMMARY label', () => {
      const message = { type: MESSAGE_TYPES.SUMMARY }
      expect(getMessageTypeLabel(message)).toBe('SUMMARY')
    })

    it('should return uppercase unknown role', () => {
      const message = { other: 'data' }
      expect(getMessageTypeLabel(message)).toBe('UNKNOWN')
    })
  })

  describe('getMessageTypeClass', () => {
    it('should return correct CSS classes for each role', () => {
      expect(getMessageTypeClass({ type: MESSAGE_TYPES.USER })).toBe('message-user')
      expect(getMessageTypeClass({ type: MESSAGE_TYPES.ASSISTANT })).toBe('message-assistant')
      expect(getMessageTypeClass({ toolUseResult: { content: 'result' } })).toBe('message-tool-result')
      expect(getMessageTypeClass({ type: MESSAGE_TYPES.SUMMARY })).toBe('message-summary')
    })

    it('should return tool class for tool messages', () => {
      const message = {
        type: MESSAGE_TYPES.ASSISTANT,
        message: {
          content: [{ type: 'tool_use', name: 'Bash' }]
        }
      }
      expect(getMessageTypeClass(message)).toBe('message-tool')
    })

    it('should return unknown class for unknown messages', () => {
      const message = { other: 'data' }
      expect(getMessageTypeClass(message)).toBe('message-unknown')
    })
  })

  describe('constants', () => {
    it('should export MESSAGE_TYPES constants', () => {
      expect(MESSAGE_TYPES.USER).toBe('user')
      expect(MESSAGE_TYPES.ASSISTANT).toBe('assistant')
      expect(MESSAGE_TYPES.TOOL_RESULT).toBe('tool_result')
      expect(MESSAGE_TYPES.SUMMARY).toBe('summary')
    })

    it('should export MESSAGE_ROLES constants', () => {
      expect(MESSAGE_ROLES.USER).toBe('user')
      expect(MESSAGE_ROLES.ASSISTANT).toBe('assistant')
      expect(MESSAGE_ROLES.TOOL).toBe('tool')
      expect(MESSAGE_ROLES.TOOL_RESULT).toBe('tool_result')
    })

    it('should export TOOL_TYPES constants', () => {
      expect(TOOL_TYPES.BASH).toBe('Bash')
      expect(TOOL_TYPES.EDIT).toBe('Edit')
      expect(TOOL_TYPES.READ).toBe('Read')
    })
  })
})