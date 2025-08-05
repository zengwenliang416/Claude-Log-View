import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useNavigation } from '@/composables/useNavigation.js'

describe('useNavigation', () => {
  let messages
  let navigation

  beforeEach(() => {
    messages = ref([
      { uuid: '1', type: 'user' },
      { uuid: '2', type: 'assistant' },
      { uuid: '3', type: 'tool_result' }
    ])
    
    navigation = useNavigation(messages)
  })

  describe('basic navigation', () => {
    it('should initialize with first message', () => {
      expect(navigation.currentIndex.value).toBe(0)
      expect(navigation.currentMessage.value).toEqual({ uuid: '1', type: 'user' })
    })

    it('should navigate to next message', () => {
      navigation.goToNext()
      
      expect(navigation.currentIndex.value).toBe(1)
      expect(navigation.currentMessage.value).toEqual({ uuid: '2', type: 'assistant' })
    })

    it('should navigate to previous message', () => {
      navigation.goToNext()
      navigation.goToPrevious()
      
      expect(navigation.currentIndex.value).toBe(0)
      expect(navigation.currentMessage.value).toEqual({ uuid: '1', type: 'user' })
    })

    it('should not go before first message', () => {
      navigation.goToPrevious()
      
      expect(navigation.currentIndex.value).toBe(0)
    })

    it('should not go after last message', () => {
      navigation.goToLast()
      navigation.goToNext()
      
      expect(navigation.currentIndex.value).toBe(2)
      expect(navigation.currentMessage.value).toEqual({ uuid: '3', type: 'tool_result' })
    })

    it('should navigate to specific index', () => {
      navigation.goToIndex(2)
      
      expect(navigation.currentIndex.value).toBe(2)
      expect(navigation.currentMessage.value).toEqual({ uuid: '3', type: 'tool_result' })
    })

    it('should ignore invalid indices', () => {
      navigation.goToIndex(-1)
      expect(navigation.currentIndex.value).toBe(0)
      
      navigation.goToIndex(10)
      expect(navigation.currentIndex.value).toBe(0)
      
      navigation.goToIndex('invalid')
      expect(navigation.currentIndex.value).toBe(0)
    })

    it('should navigate to first message', () => {
      navigation.goToIndex(2)
      navigation.goToFirst()
      
      expect(navigation.currentIndex.value).toBe(0)
    })

    it('should navigate to last message', () => {
      navigation.goToLast()
      
      expect(navigation.currentIndex.value).toBe(2)
    })
  })

  describe('computed properties', () => {
    it('should calculate total messages', () => {
      expect(navigation.totalMessages.value).toBe(3)
    })

    it('should calculate navigation capabilities', () => {
      // At first message
      expect(navigation.canGoPrevious.value).toBe(false)
      expect(navigation.canGoNext.value).toBe(true)
      
      // At middle message
      navigation.goToNext()
      expect(navigation.canGoPrevious.value).toBe(true)
      expect(navigation.canGoNext.value).toBe(true)
      
      // At last message
      navigation.goToLast()
      expect(navigation.canGoPrevious.value).toBe(true)
      expect(navigation.canGoNext.value).toBe(false)
    })

    it('should calculate navigation info', () => {
      expect(navigation.navigationInfo.value).toEqual({
        current: 1,
        total: 3,
        position: '1 / 3'
      })
      
      navigation.goToNext()
      expect(navigation.navigationInfo.value).toEqual({
        current: 2,
        total: 3,
        position: '2 / 3'
      })
    })

    it('should handle empty messages for navigation info', () => {
      messages.value = []
      
      expect(navigation.navigationInfo.value).toEqual({
        current: 0,
        total: 0,
        position: '0 / 0'
      })
    })
  })

  describe('message changes', () => {
    it('should reset to first message when messages change', async () => {
      navigation.goToLast()
      
      messages.value = [
        { uuid: '4', type: 'user' },
        { uuid: '5', type: 'assistant' }
      ]
      
      await nextTick()
      
      expect(navigation.currentIndex.value).toBe(0)
      expect(navigation.currentMessage.value).toEqual({ uuid: '4', type: 'user' })
    })

    it('should handle empty messages array', async () => {
      messages.value = []
      
      await nextTick()
      
      expect(navigation.currentIndex.value).toBe(0)
      expect(navigation.currentMessage.value).toBe(null)
      expect(navigation.totalMessages.value).toBe(0)
    })

    it('should handle null messages', async () => {
      messages.value = null
      
      await nextTick()
      
      expect(navigation.currentMessage.value).toBe(null)
      expect(navigation.totalMessages.value).toBe(0)
    })

    it('should adjust index when messages array shrinks', async () => {
      navigation.goToLast() // index = 2
      
      messages.value = [{ uuid: '1', type: 'user' }] // only 1 message
      
      await nextTick()
      
      expect(navigation.currentIndex.value).toBe(0)
    })

    it('should preserve valid index when messages change', async () => {
      navigation.goToNext() // index = 1
      
      messages.value = [
        { uuid: '1', type: 'user' },
        { uuid: '2', type: 'assistant' },
        { uuid: '3', type: 'tool_result' },
        { uuid: '4', type: 'summary' }
      ]
      
      await nextTick()
      
      expect(navigation.currentIndex.value).toBe(1)
    })
  })

  describe('keyboard navigation', () => {
    it('should handle arrow key navigation', () => {
      const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      const preventDefaultSpy = vi.fn()
      
      leftEvent.preventDefault = preventDefaultSpy
      rightEvent.preventDefault = preventDefaultSpy
      
      navigation.goToNext() // start at index 1
      
      navigation.handleKeyboardNavigation(leftEvent)
      expect(navigation.currentIndex.value).toBe(0)
      expect(preventDefaultSpy).toHaveBeenCalled()
      
      navigation.handleKeyboardNavigation(rightEvent)
      expect(navigation.currentIndex.value).toBe(1)
    })

    it('should handle up/down arrow keys', () => {
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      const preventDefaultSpy = vi.fn()
      
      upEvent.preventDefault = preventDefaultSpy
      downEvent.preventDefault = preventDefaultSpy
      
      navigation.goToNext() // start at index 1
      
      navigation.handleKeyboardNavigation(upEvent)
      expect(navigation.currentIndex.value).toBe(0)
      
      navigation.handleKeyboardNavigation(downEvent)
      expect(navigation.currentIndex.value).toBe(1)
    })

    it('should handle Home and End keys', () => {
      const homeEvent = new KeyboardEvent('keydown', { key: 'Home' })
      const endEvent = new KeyboardEvent('keydown', { key: 'End' })
      const preventDefaultSpy = vi.fn()
      
      homeEvent.preventDefault = preventDefaultSpy
      endEvent.preventDefault = preventDefaultSpy
      
      navigation.goToNext() // start at index 1
      
      navigation.handleKeyboardNavigation(endEvent)
      expect(navigation.currentIndex.value).toBe(2)
      
      navigation.handleKeyboardNavigation(homeEvent)
      expect(navigation.currentIndex.value).toBe(0)
    })

    it('should ignore keyboard events on input elements', () => {
      const event = {
        key: 'ArrowRight',
        target: { tagName: 'INPUT' },
        preventDefault: vi.fn()
      }
      
      const initialIndex = navigation.currentIndex.value
      navigation.handleKeyboardNavigation(event)
      
      expect(navigation.currentIndex.value).toBe(initialIndex)
    })

    it('should ignore keyboard events on textarea elements', () => {
      const event = {
        key: 'ArrowRight',
        target: { tagName: 'TEXTAREA' },
        preventDefault: vi.fn()
      }
      
      const initialIndex = navigation.currentIndex.value
      navigation.handleKeyboardNavigation(event)
      
      expect(navigation.currentIndex.value).toBe(initialIndex)
    })
  })

  describe('UUID-based navigation', () => {
    it('should find message index by UUID', () => {
      expect(navigation.findMessageIndex('2')).toBe(1)
      expect(navigation.findMessageIndex('3')).toBe(2)
      expect(navigation.findMessageIndex('nonexistent')).toBe(-1)
    })

    it('should handle null/undefined UUID', () => {
      expect(navigation.findMessageIndex(null)).toBe(-1)
      expect(navigation.findMessageIndex(undefined)).toBe(-1)
    })

    it('should navigate to message by UUID', () => {
      const result = navigation.goToMessageByUuid('3')
      
      expect(result).toBe(true)
      expect(navigation.currentIndex.value).toBe(2)
    })

    it('should return false for nonexistent UUID', () => {
      const result = navigation.goToMessageByUuid('nonexistent')
      
      expect(result).toBe(false)
      expect(navigation.currentIndex.value).toBe(0) // should not change
    })
  })

  describe('state persistence', () => {
    it('should get navigation state', () => {
      navigation.goToIndex(1)
      
      const state = navigation.getNavigationState()
      
      expect(state).toEqual({
        currentIndex: 1,
        currentMessageUuid: '2'
      })
    })

    it('should restore navigation state by UUID', () => {
      const state = {
        currentIndex: 1,
        currentMessageUuid: '3'
      }
      
      navigation.restoreNavigationState(state)
      
      expect(navigation.currentIndex.value).toBe(2) // Found UUID '3' at index 2
    })

    it('should fallback to index when UUID not found', () => {
      const state = {
        currentIndex: 1,
        currentMessageUuid: 'nonexistent'
      }
      
      navigation.restoreNavigationState(state)
      
      expect(navigation.currentIndex.value).toBe(1) // Fallback to index
    })

    it('should handle state without UUID', () => {
      const state = { currentIndex: 2 }
      
      navigation.restoreNavigationState(state)
      
      expect(navigation.currentIndex.value).toBe(2)
    })

    it('should handle empty state', () => {
      navigation.goToNext()
      const initialIndex = navigation.currentIndex.value
      
      navigation.restoreNavigationState({})
      
      expect(navigation.currentIndex.value).toBe(initialIndex) // Should not change
    })
  })

  describe('edge cases', () => {
    it('should handle out of bounds current index', async () => {
      navigation.goToLast()
      expect(navigation.currentIndex.value).toBe(2)
      
      // Simulate external index change to out of bounds
      navigation.currentIndex.value = 10
      
      expect(navigation.currentMessage.value).toBe(null)
    })

    it('should handle negative current index', () => {
      navigation.currentIndex.value = -1
      
      expect(navigation.currentMessage.value).toBe(null)
    })

    it('should handle single message array', async () => {
      messages.value = [{ uuid: '1', type: 'user' }]
      
      await nextTick()
      
      expect(navigation.canGoPrevious.value).toBe(false)
      expect(navigation.canGoNext.value).toBe(false)
      expect(navigation.navigationInfo.value.position).toBe('1 / 1')
    })
  })
})