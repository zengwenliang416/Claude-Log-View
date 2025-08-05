<template>
  <div class="message-list">
    <div
      v-if="messages.length === 0"
      class="empty-state"
    >
      <p class="empty-text">No messages to display</p>
      <p class="empty-subtitle">Load a log file to get started</p>
    </div>
    
    <div
      v-else
      class="message-items"
      ref="messageContainer"
    >
      <div
        v-for="(message, index) in messages"
        :key="message.uuid || index"
        class="message-item"
        :class="{
          active: index === currentIndex,
          [getMessageTypeClass(message)]: true
        }"
        @click="$emit('message-click', index)"
      >
        <div class="message-header">
          <span class="message-type">{{ getMessageTypeLabel(message) }}</span>
          <span class="message-time">{{ formatShortTime(message.timestamp) }}</span>
        </div>
        
        <div class="message-preview">
          {{ getMessagePreview(message) }}
        </div>
        
        <div class="message-tools" v-if="getMessageToolNames(message).length > 0">
          <span 
            v-for="tool in getMessageToolNames(message)"
            :key="tool"
            class="tool-tag"
          >
            {{ tool }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import { getMessageRole, getMessageToolNames, getMessageTypeLabel, getMessageTypeClass } from '@/utils/messageTypes.js'
import { formatShortTime } from '@/utils/dateFormatter.js'

export default {
  name: 'MessageList',
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    currentIndex: {
      type: Number,
      default: 0
    }
  },
  emits: [
    'message-click'
  ],
  setup(props) {
    const messageContainer = ref(null)
    
    // Scroll to current message when it changes
    watch(() => props.currentIndex, async (newIndex) => {
      if (!messageContainer.value || props.messages.length === 0) return
      
      await nextTick()
      
      const activeItem = messageContainer.value.querySelector('.message-item.active')
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    })
    
    const getMessagePreview = (message) => {
      if (!message) return 'No content'
      
      // Summary messages
      if (message.summary) {
        return message.summary.substring(0, 100) + (message.summary.length > 100 ? '...' : '')
      }
      
      // Regular messages with content
      if (message.message?.content) {
        if (typeof message.message.content === 'string') {
          return message.message.content.substring(0, 100) + (message.message.content.length > 100 ? '...' : '')
        }
        
        if (Array.isArray(message.message.content)) {
          const textContent = message.message.content
            .filter(item => item.type === 'text')
            .map(item => item.text)
            .join(' ')
          
          if (textContent) {
            return textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '')
          }
          
          // Tool use content
          const toolContent = message.message.content
            .filter(item => item.type === 'tool_use')
            .map(item => `${item.name}(...)`)
            .join(', ')
          
          if (toolContent) {
            return toolContent
          }
        }
      }
      
      // Tool result messages
      if (message.toolUseResult?.content) {
        const content = typeof message.toolUseResult.content === 'string' 
          ? message.toolUseResult.content 
          : JSON.stringify(message.toolUseResult.content)
        
        return content.substring(0, 100) + (content.length > 100 ? '...' : '')
      }
      
      return 'No preview available'
    }
    
    return {
      messageContainer,
      getMessagePreview,
      getMessageRole,
      getMessageToolNames,
      getMessageTypeLabel,
      getMessageTypeClass,
      formatShortTime
    }
  }
}
</script>

<style scoped>
.message-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.empty-text {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.empty-subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.message-items {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm) 0;
}

.message-item {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.message-item:hover {
  background-color: var(--bg-hover);
}

.message-item.active {
  background-color: var(--bg-tertiary);
  border-left: 3px solid var(--accent-color);
}

.message-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--accent-color);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.message-type {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 3px;
  background-color: var(--bg-tertiary);
}

.message-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.message-preview {
  font-size: var(--font-size-sm);
  line-height: 1.4;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tool-tag {
  font-size: var(--font-size-xs);
  padding: 2px 6px;
  background-color: var(--tool-color);
  color: white;
  border-radius: 3px;
  font-weight: var(--font-weight-medium);
}

/* Message type specific styling */
.message-user .message-type {
  color: var(--user-color);
  background-color: rgba(76, 110, 245, 0.1);
}

.message-assistant .message-type {
  color: var(--assistant-color);
  background-color: rgba(81, 207, 102, 0.1);
}

.message-tool .message-type {
  color: var(--tool-color);
  background-color: rgba(255, 146, 43, 0.1);
}

.message-tool-result .message-type {
  color: var(--tool-result-color);
  background-color: rgba(132, 94, 247, 0.1);
}

.message-summary .message-type {
  color: var(--summary-color);
  background-color: rgba(255, 212, 59, 0.1);
}

/* Responsive design */
@media (max-width: 480px) {
  .message-item {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
}
</style>