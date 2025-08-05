import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useMessageFiltering } from '@/composables/useMessageFiltering.js'

describe('useMessageFiltering', () => {
  let messages
  let filtering

  beforeEach(() => {
    messages = ref([
      {
        uuid: '1',
        type: 'user',
        message: { content: 'Hello world' }
      },
      {
        uuid: '2', 
        type: 'assistant',
        message: { content: [
          { type: 'tool_use', name: 'Bash' },
          { type: 'tool_use', name: 'Read' }
        ]}
      },
      {
        uuid: '3',
        toolUseResult: { content: 'command output', type: 'Bash' }
      },
      {
        uuid: '4',
        type: 'assistant',
        message: { content: 'Here is the result' }
      }
    ])
    
    filtering = useMessageFiltering(messages)
  })

  describe('basic filtering', () => {
    it('should return all messages when no filters are active', () => {
      expect(filtering.filteredMessages.value).toHaveLength(4)
    })

    it('should filter by role', () => {
      filtering.toggleRoleFilter('user')
      
      expect(filtering.filteredMessages.value).toHaveLength(1)
      expect(filtering.filteredMessages.value[0].uuid).toBe('1')
    })

    it('should filter by multiple roles', () => {
      filtering.toggleRoleFilter('user')
      filtering.toggleRoleFilter('assistant')
      
      expect(filtering.filteredMessages.value).toHaveLength(2)
      expect(filtering.filteredMessages.value.map(m => m.uuid)).toContain('1')
      expect(filtering.filteredMessages.value.map(m => m.uuid)).toContain('4')
    })

    it('should filter by tool', () => {
      filtering.toggleToolFilter('Bash')
      
      expect(filtering.filteredMessages.value).toHaveLength(2)
      expect(filtering.filteredMessages.value.map(m => m.uuid)).toEqual(['2', '3'])
    })

    it('should combine role and tool filters', () => {
      filtering.toggleRoleFilter('tool')
      filtering.toggleToolFilter('Bash')
      
      expect(filtering.filteredMessages.value).toHaveLength(1)
      expect(filtering.filteredMessages.value[0].uuid).toBe('2')
    })
  })

  describe('search filtering', () => {
    it('should filter by search query in message content', () => {
      filtering.searchQuery.value = 'hello'
      
      expect(filtering.filteredMessages.value).toHaveLength(1)
      expect(filtering.filteredMessages.value[0].uuid).toBe('1')
    })

    it('should filter by search query in tool result content', () => {
      filtering.searchQuery.value = 'command output'
      
      expect(filtering.filteredMessages.value).toHaveLength(1)
      expect(filtering.filteredMessages.value[0].uuid).toBe('3')
    })

    it('should filter by UUID', () => {
      filtering.searchQuery.value = '2'
      
      expect(filtering.filteredMessages.value).toHaveLength(1)
      expect(filtering.filteredMessages.value[0].uuid).toBe('2')
    })

    it('should be case insensitive', () => {
      filtering.searchQuery.value = 'HELLO'
      
      expect(filtering.filteredMessages.value).toHaveLength(1)
      expect(filtering.filteredMessages.value[0].uuid).toBe('1')
    })

    it('should combine search with role filters', () => {
      filtering.searchQuery.value = 'result'
      filtering.toggleRoleFilter('assistant')
      
      expect(filtering.filteredMessages.value).toHaveLength(1)
      expect(filtering.filteredMessages.value[0].uuid).toBe('4')
    })

    it('should handle empty search query', () => {
      filtering.searchQuery.value = '   '
      
      expect(filtering.filteredMessages.value).toHaveLength(4)
    })
  })

  describe('available options', () => {
    it('should calculate available roles', () => {
      const roles = filtering.availableRoles.value
      
      expect(roles).toEqual(['assistant', 'tool', 'tool_result', 'user'])
    })

    it('should calculate available tools', () => {
      const tools = filtering.availableTools.value
      
      expect(tools).toEqual(['Bash', 'Read'])
    })

    it('should handle empty messages', () => {
      messages.value = []
      
      expect(filtering.availableRoles.value).toEqual([])
      expect(filtering.availableTools.value).toEqual([])
      expect(filtering.filteredMessages.value).toEqual([])
    })

    it('should handle null messages', () => {
      messages.value = null
      
      expect(filtering.availableRoles.value).toEqual([])
      expect(filtering.availableTools.value).toEqual([])
      expect(filtering.filteredMessages.value).toEqual([])
    })
  })

  describe('filter management', () => {
    it('should toggle role filters', () => {
      filtering.toggleRoleFilter('user')
      expect(filtering.roleFilters.has('user')).toBe(true)
      
      filtering.toggleRoleFilter('user')
      expect(filtering.roleFilters.has('user')).toBe(false)
    })

    it('should toggle tool filters', () => {
      filtering.toggleToolFilter('Bash')
      expect(filtering.toolFilters.has('Bash')).toBe(true)
      
      filtering.toggleToolFilter('Bash')
      expect(filtering.toolFilters.has('Bash')).toBe(false)
    })

    it('should clear role filters', () => {
      filtering.toggleRoleFilter('user')
      filtering.toggleRoleFilter('assistant')
      
      filtering.clearRoleFilters()
      
      expect(filtering.roleFilters.size).toBe(0)
      expect(filtering.filteredMessages.value).toHaveLength(4)
    })

    it('should clear tool filters', () => {
      filtering.toggleToolFilter('Bash')
      filtering.toggleToolFilter('Read')
      
      filtering.clearToolFilters()
      
      expect(filtering.toolFilters.size).toBe(0)
      expect(filtering.filteredMessages.value).toHaveLength(4)
    })

    it('should clear all filters', () => {
      filtering.toggleRoleFilter('user')
      filtering.toggleToolFilter('Bash')
      filtering.searchQuery.value = 'test'
      
      filtering.clearAllFilters()
      
      expect(filtering.roleFilters.size).toBe(0)
      expect(filtering.toolFilters.size).toBe(0)
      expect(filtering.searchQuery.value).toBe('')
      expect(filtering.filteredMessages.value).toHaveLength(4)
    })

    it('should set multiple role filters', () => {
      filtering.setRoleFilters(['user', 'assistant'])
      
      expect(filtering.roleFilters.has('user')).toBe(true)
      expect(filtering.roleFilters.has('assistant')).toBe(true)
      expect(filtering.roleFilters.size).toBe(2)
    })

    it('should set multiple tool filters', () => {
      filtering.setToolFilters(['Bash', 'Read'])
      
      expect(filtering.toolFilters.has('Bash')).toBe(true)
      expect(filtering.toolFilters.has('Read')).toBe(true)
      expect(filtering.toolFilters.size).toBe(2)
    })
  })

  describe('state persistence', () => {
    it('should get current filter state', () => {
      filtering.toggleRoleFilter('user')
      filtering.toggleToolFilter('Bash') 
      filtering.searchQuery.value = 'test'
      
      const state = filtering.getFilterState()
      
      expect(state).toEqual({
        roles: ['user'],
        tools: ['Bash'],
        search: 'test'
      })
    })

    it('should restore filter state', () => {
      const state = {
        roles: ['user', 'assistant'],
        tools: ['Bash'],
        search: 'hello'
      }
      
      filtering.restoreFilterState(state)
      
      expect(filtering.roleFilters.has('user')).toBe(true)
      expect(filtering.roleFilters.has('assistant')).toBe(true)
      expect(filtering.toolFilters.has('Bash')).toBe(true)
      expect(filtering.searchQuery.value).toBe('hello')
    })

    it('should handle partial state restoration', () => {
      const state = { roles: ['user'] }
      
      filtering.restoreFilterState(state)
      
      expect(filtering.roleFilters.has('user')).toBe(true)
      expect(filtering.toolFilters.size).toBe(0)
      expect(filtering.searchQuery.value).toBe('')
    })
  })

  describe('complex search scenarios', () => {
    beforeEach(() => {
      messages.value = [
        {
          uuid: '1',
          type: 'user',
          message: { content: 'Find the file config.json' },
          summary: 'User asking about config'
        },
        {
          uuid: '2',
          type: 'assistant',
          message: {
            content: [
              { type: 'text', text: 'Searching for config.json' },
              { type: 'tool_use', name: 'Grep', input: { pattern: 'config' } }
            ]
          }
        },
        {
          uuid: '3',
          toolUseResult: { content: 'Found config.json in /etc/app/', type: 'Grep' }
        }
      ]
    })

    it('should search in nested message content arrays', () => {
      filtering.searchQuery.value = 'searching'
      
      expect(filtering.filteredMessages.value).toHaveLength(1)
      expect(filtering.filteredMessages.value[0].uuid).toBe('2')
    })

    it('should search in tool input parameters', () => {
      filtering.searchQuery.value = 'pattern'
      
      expect(filtering.filteredMessages.value).toHaveLength(1)
      expect(filtering.filteredMessages.value[0].uuid).toBe('2')
    })

    it('should search in summary field', () => {
      filtering.searchQuery.value = 'asking about'
      
      expect(filtering.filteredMessages.value).toHaveLength(1)
      expect(filtering.filteredMessages.value[0].uuid).toBe('1')
    })

    it('should search in tool names', () => {
      filtering.searchQuery.value = 'grep'
      
      expect(filtering.filteredMessages.value).toHaveLength(2)
      expect(filtering.filteredMessages.value.map(m => m.uuid)).toEqual(['2', '3'])
    })
  })
})