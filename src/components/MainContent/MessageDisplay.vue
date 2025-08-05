<template>
  <main class="message-display">
    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p class="loading-text">Loading messages...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Error Loading Messages</h3>
      <p class="error-message">{{ error }}</p>
    </div>
    
    <div 
      v-else-if="messages && messages.length > 0" 
      class="messages-container"
      ref="messagesContainer"
    >
      <div
        v-for="(message, index) in messages"
        :key="message.uuid || index"
        class="message-item"
        :class="{
          'message-active': index === currentIndex,
          [getMessageTypeClass(message)]: true
        }"
        :ref="`message-${index}`"
      >
        <!-- Message Type Indicator -->
        <div class="message-type-indicator">
          <span class="type-label">{{ getMessageTypeLabel(message) }}</span>
        </div>
        
        <!-- Message Content -->
        <div class="message-wrapper">
          <MessageHeader :message="message" />
          <MessageContent :message="message" />
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <div class="empty-icon">📄</div>
      <h3 class="empty-title">No Messages Available</h3>
      <p class="empty-message">Load a log file to view messages, or adjust your filters to see more messages</p>
    </div>
  </main>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import MessageHeader from './MessageHeader.vue'
import MessageContent from './MessageContent.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import { getMessageTypeLabel, getMessageTypeClass } from '@/utils/messageTypes.js'

export default {
  name: 'MessageDisplay',
  components: {
    MessageHeader,
    MessageContent,
    LoadingSpinner
  },
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    currentIndex: {
      type: Number,
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const messagesContainer = ref(null)
    
    // Auto-scroll to current message when currentIndex changes
    watch(() => props.currentIndex, async (newIndex) => {
      if (!messagesContainer.value || !props.messages.length) return
      
      await nextTick()
      
      // Find the active message element
      const activeMessage = messagesContainer.value.querySelector('.message-active')
      if (activeMessage) {
        activeMessage.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }
    })
    
    return {
      messagesContainer,
      getMessageTypeLabel,
      getMessageTypeClass
    }
  }
}
</script>

<style scoped>
.message-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-primary);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  scroll-behavior: smooth;
}

.message-item {
  position: relative;
  margin-bottom: var(--spacing-xl);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all var(--transition-fast);
}

.message-item:last-child {
  margin-bottom: 0;
}

.message-item.message-active {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(76, 110, 245, 0.2);
}

.message-type-indicator {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  z-index: 10;
  pointer-events: none;
}

.type-label {
  display: inline-block;
  padding: 4px 8px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 4px;
  color: white;
  background-color: var(--text-muted);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-wrapper {
  position: relative;
  padding-top: var(--spacing-lg);
}

/* Message type specific styling for indicators */
.message-user .type-label {
  background-color: var(--user-color);
}

.message-assistant .type-label {
  background-color: var(--assistant-color);
}

.message-tool .type-label {
  background-color: var(--tool-color);
}

.message-tool-result .type-label {
  background-color: var(--tool-result-color);
}

.message-summary .type-label {
  background-color: var(--summary-color);
  color: var(--text-primary);
}

/* Message type specific borders */
.message-user {
  border-left: 4px solid var(--user-color);
}

.message-assistant {
  border-left: 4px solid var(--assistant-color);
}

.message-tool {
  border-left: 4px solid var(--tool-color);
}

.message-tool-result {
  border-left: 4px solid var(--tool-result-color);
}

.message-summary {
  border-left: 4px solid var(--summary-color);
}

.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
}

.loading-text {
  margin: var(--spacing-md) 0 0 0;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.6;
}

.error-title,
.empty-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.error-message,
.empty-message {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  max-width: 500px;
  line-height: 1.5;
}

.error-state .error-title {
  color: var(--error-color);
}

/* Custom scrollbar */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* Responsive design */
@media (max-width: 768px) {
  .messages-container {
    padding: var(--spacing-sm);
  }
  
  .message-item {
    margin-bottom: var(--spacing-lg);
  }
  
  .loading-state,
  .error-state,
  .empty-state {
    padding: var(--spacing-lg);
  }
  
  .error-icon,
  .empty-icon {
    font-size: 2rem;
  }
  
  .error-title,
  .empty-title {
    font-size: var(--font-size-base);
  }
}

@media (max-width: 480px) {
  .messages-container {
    padding: var(--spacing-xs);
  }
  
  .message-type-indicator {
    top: var(--spacing-xs);
    left: var(--spacing-xs);
  }
  
  .type-label {
    padding: 2px 6px;
    font-size: 10px;
  }
}
</style>