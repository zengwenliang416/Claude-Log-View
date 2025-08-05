<template>
  <header class="message-header">
    <div class="header-main">
      <div class="message-type-badge" :class="messageTypeClass">
        {{ messageTypeLabel }}
      </div>
      
      <div class="message-meta">
        <span class="message-timestamp">{{ formattedTimestamp }}</span>
        <span class="message-uuid" v-if="message.uuid">{{ message.uuid }}</span>
      </div>
    </div>
    
    <div class="header-tools" v-if="messageTools.length > 0">
      <span class="tools-label">Tools:</span>
      <div class="tool-badges">
        <span
          v-for="tool in messageTools"
          :key="tool"
          class="tool-badge"
        >
          {{ tool }}
        </span>
      </div>
    </div>
    
    <div class="header-extra" v-if="showExtraInfo">
      <div class="extra-info">
        <span v-if="message.sessionId" class="session-info">
          Session: {{ message.sessionId.substring(0, 8) }}...
        </span>
        <span v-if="message.parentUuid" class="parent-info">
          Parent: {{ message.parentUuid.substring(0, 8) }}...
        </span>
        <span v-if="message.userType" class="user-type">
          User Type: {{ message.userType }}
        </span>
      </div>
      
      <button class="toggle-extra" @click="showExtraInfo = false">
        Hide Details
      </button>
    </div>
    
    <div class="header-actions" v-else>
      <button class="toggle-extra" @click="showExtraInfo = true">
        Show Details
      </button>
    </div>
  </header>
</template>

<script>
import { ref, computed } from 'vue'
import { getMessageRole, getMessageToolNames, getMessageTypeLabel, getMessageTypeClass } from '@/utils/messageTypes.js'
import { formatTimestamp } from '@/utils/dateFormatter.js'

export default {
  name: 'MessageHeader',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const showExtraInfo = ref(false)
    
    const messageTypeClass = computed(() => getMessageTypeClass(props.message))
    const messageTypeLabel = computed(() => getMessageTypeLabel(props.message))
    const messageTools = computed(() => getMessageToolNames(props.message))
    const formattedTimestamp = computed(() => formatTimestamp(props.message.timestamp))
    
    return {
      showExtraInfo,
      messageTypeClass,
      messageTypeLabel,
      messageTools,
      formattedTimestamp
    }
  }
}
</script>

<style scoped>
.message-header {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: var(--spacing-lg);
  flex-shrink: 0;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.message-type-badge {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius);
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
}

.message-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-xs);
}

.message-timestamp {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.message-uuid {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.message-uuid:hover {
  color: var(--text-secondary);
}

.header-tools {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.tools-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.tool-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tool-badge {
  font-size: var(--font-size-xs);
  padding: 2px 6px;
  background-color: var(--tool-color);
  color: white;
  border-radius: 3px;
  font-weight: var(--font-weight-medium);
}

.header-extra {
  border-top: 1px solid var(--border-color);
  padding-top: var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.extra-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.session-info,
.parent-info,
.user-type {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

.toggle-extra {
  font-size: var(--font-size-xs);
  color: var(--accent-color);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs) 0;
  transition: color var(--transition-fast);
}

.toggle-extra:hover {
  color: var(--accent-hover);
}

/* Message type specific styling */
.message-user {
  color: var(--user-color);
  background-color: rgba(76, 110, 245, 0.1);
  border-color: var(--user-color);
}

.message-assistant {
  color: var(--assistant-color);
  background-color: rgba(81, 207, 102, 0.1);
  border-color: var(--assistant-color);
}

.message-tool {
  color: var(--tool-color);
  background-color: rgba(255, 146, 43, 0.1);
  border-color: var(--tool-color);
}

.message-tool-result {
  color: var(--tool-result-color);
  background-color: rgba(132, 94, 247, 0.1);
  border-color: var(--tool-result-color);
}

.message-summary {
  color: var(--summary-color);
  background-color: rgba(255, 212, 59, 0.1);
  border-color: var(--summary-color);
}

/* Responsive design */
@media (max-width: 768px) {
  .message-header {
    padding: var(--spacing-md);
  }
  
  .header-main {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .message-meta {
    align-items: flex-start;
  }
  
  .header-tools {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-extra {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}

@media (max-width: 480px) {
  .message-header {
    padding: var(--spacing-sm);
  }
  
  .message-type-badge {
    font-size: var(--font-size-xs);
  }
}
</style>