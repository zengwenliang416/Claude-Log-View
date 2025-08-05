import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  parseJsonl, 
  parseFileContent, 
  validateMessage, 
  sortMessagesByTimestamp,
  getMessageStats 
} from '@/utils/logParser.js'

describe('logParser', () => {
  describe('parseJsonl', () => {
    it('should parse valid JSONL content', async () => {
      const jsonlContent = `{"uuid": "1", "type": "user", "message": {"content": "Hello"}}
{"uuid": "2", "type": "assistant", "message": {"content": "Hi there"}}`
      
      const result = await parseJsonl(jsonlContent)
      
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        uuid: "1",
        type: "user",
        _index: 0,
        _role: "user"
      })
      expect(result[1]).toMatchObject({
        uuid: "2", 
        type: "assistant",
        _index: 1,
        _role: "assistant"
      })
    })

    it('should handle empty lines in JSONL content', async () => {
      const jsonlContent = `{"uuid": "1", "type": "user"}

{"uuid": "2", "type": "assistant"}
`
      
      const result = await parseJsonl(jsonlContent)
      expect(result).toHaveLength(2)
    })

    it('should collect parsing errors for invalid JSON lines', async () => {
      const jsonlContent = `{"uuid": "1", "type": "user"}
invalid json line
{"uuid": "2", "type": "assistant"}`
    
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = await parseJsonl(jsonlContent)
      
      expect(result).toHaveLength(2)
      expect(consoleSpy).toHaveBeenCalledWith('Parsing errors:', expect.any(Array))
      
      consoleSpy.mockRestore()
    })

    it('should throw error for invalid input', async () => {
      await expect(parseJsonl(null)).rejects.toThrow('Invalid JSONL content')
      await expect(parseJsonl('')).rejects.toThrow('Invalid JSONL content')
      await expect(parseJsonl(123)).rejects.toThrow('Invalid JSONL content')
    })

    it('should enrich messages with computed properties', async () => {
      const jsonlContent = `{"uuid": "1", "type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Bash"}]}, "timestamp": "2024-01-01T00:00:00Z"}`
      
      const result = await parseJsonl(jsonlContent)
      
      expect(result[0]).toMatchObject({
        _index: 0,
        _role: "tool",
        _tools: ["Bash"],
        _timestamp: "2024-01-01T00:00:00Z"
      })
    })
  })

  describe('parseFileContent', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should parse a valid JSONL file', async () => {
      const content = '{"uuid": "1", "type": "user"}'
      const file = createMockFile(content, 'test.jsonl')
      
      const result = await parseFileContent(file)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        uuid: "1",
        type: "user"
      })
    })

    it('should reject files with invalid extensions', async () => {
      const file = createMockFile('content', 'test.txt')
      
      await expect(parseFileContent(file)).rejects.toThrow(
        'Invalid file type. Please select a .jsonl or .json file.'
      )
    })

    it('should reject files that are too large', async () => {
      const largeContent = 'x'.repeat(51 * 1024 * 1024) // 51MB
      const file = createMockFile(largeContent, 'large.jsonl')
      
      await expect(parseFileContent(file)).rejects.toThrow(
        'File too large. Maximum size is 50MB.'
      )
    })

    it('should handle file read errors', async () => {
      const file = createMockFile('content', 'error.jsonl')
      
      await expect(parseFileContent(file)).rejects.toThrow('Failed to read file')
    })

    it('should handle null file input', async () => {
      await expect(parseFileContent(null)).rejects.toThrow('No file provided')
    })

    it('should accept .json files', async () => {
      const content = '{"uuid": "1", "type": "user"}'
      const file = createMockFile(content, 'test.json')
      
      const result = await parseFileContent(file)
      expect(result).toHaveLength(1)
    })
  })

  describe('validateMessage', () => {
    it('should validate messages with uuid', () => {
      expect(validateMessage({ uuid: '123' })).toBe(true)
    })

    it('should validate messages with type', () => {
      expect(validateMessage({ type: 'user' })).toBe(true)
    })

    it('should validate messages with message', () => {
      expect(validateMessage({ message: 'content' })).toBe(true)
    })

    it('should reject invalid messages', () => {
      expect(validateMessage(null)).toBe(false)
      expect(validateMessage(undefined)).toBe(false)
      expect(validateMessage('string')).toBe(false)
      expect(validateMessage({})).toBe(false)
      expect(validateMessage({ other: 'field' })).toBe(false)
    })
  })

  describe('sortMessagesByTimestamp', () => {
    it('should sort messages by timestamp chronologically', () => {
      const messages = [
        { uuid: '2', timestamp: '2024-01-02T00:00:00Z' },
        { uuid: '1', timestamp: '2024-01-01T00:00:00Z' },
        { uuid: '3', timestamp: '2024-01-03T00:00:00Z' }
      ]
      
      const sorted = sortMessagesByTimestamp(messages)
      
      expect(sorted.map(m => m.uuid)).toEqual(['1', '2', '3'])
    })

    it('should handle messages without timestamps', () => {
      const messages = [
        { uuid: '2', timestamp: '2024-01-02T00:00:00Z' },
        { uuid: '1' },
        { uuid: '3', timestamp: '2024-01-01T00:00:00Z' }
      ]
      
      const sorted = sortMessagesByTimestamp(messages)
      
      // Messages without timestamps should come last
      expect(sorted[sorted.length - 1].uuid).toBe('1')
    })

    it('should handle _timestamp field', () => {
      const messages = [
        { uuid: '2', _timestamp: '2024-01-02T00:00:00Z' },
        { uuid: '1', _timestamp: '2024-01-01T00:00:00Z' }
      ]
      
      const sorted = sortMessagesByTimestamp(messages)
      expect(sorted.map(m => m.uuid)).toEqual(['1', '2'])
    })

    it('should not mutate original array', () => {
      const messages = [
        { uuid: '2', timestamp: '2024-01-02T00:00:00Z' },
        { uuid: '1', timestamp: '2024-01-01T00:00:00Z' }
      ]
      const original = [...messages]
      
      sortMessagesByTimestamp(messages)
      
      expect(messages).toEqual(original)
    })
  })

  describe('getMessageStats', () => {
    it('should calculate message statistics', () => {
      const messages = [
        { _role: 'user', _tools: [] },
        { _role: 'assistant', _tools: ['Bash'] },
        { _role: 'tool', _tools: ['Read', 'Edit'] },
        { _role: 'user', _tools: [] }
      ]
      
      const stats = getMessageStats(messages)
      
      expect(stats).toEqual({
        total: 4,
        byRole: {
          user: 2,
          assistant: 1,
          tool: 1
        },
        byTool: {
          Bash: 1,
          Read: 1,
          Edit: 1
        }
      })
    })

    it('should handle empty messages array', () => {
      const stats = getMessageStats([])
      
      expect(stats).toEqual({
        total: 0,
        byRole: {},
        byTool: {}
      })
    })

    it('should handle invalid input', () => {
      const stats = getMessageStats(null)
      
      expect(stats).toEqual({
        total: 0,
        byRole: {},
        byTool: {}
      })
    })

    it('should handle messages with unknown roles', () => {
      const messages = [
        { _role: undefined, _tools: [] },
        { _tools: ['Test'] }
      ]
      
      const stats = getMessageStats(messages)
      
      expect(stats.byRole.unknown).toBe(2)
      expect(stats.byTool.Test).toBe(1)
    })
  })
})