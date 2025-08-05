<template>
  <div class="message-content">
    <!-- Summary Message -->
    <div v-if="message.type === 'summary'" class="content-section">
      <h3 class="section-title">Summary</h3>
      <div class="summary-content">
        {{ message.summary }}
      </div>
    </div>
    
    <!-- User/Assistant Messages -->
    <div v-else-if="message.message" class="content-section">
      <h3 class="section-title">{{ message.message.role === 'user' ? 'User Message' : 'Assistant Response' }}</h3>
      
      <div class="message-parts">
        <div
          v-for="(part, index) in getMessageParts(message.message.content)"
          :key="index"
          class="message-part"
          :class="part.type"
        >
          <!-- Text Content -->
          <div v-if="part.type === 'text'" class="text-content">
            <pre class="text-block">{{ part.content }}</pre>
          </div>
          
          <!-- Tool Use -->
          <div v-else-if="part.type === 'tool_use'" class="tool-use-content">
            <div class="tool-header">
              <span class="tool-name">{{ part.name }}</span>
              <span class="tool-id">{{ part.id }}</span>
            </div>
            
            <div class="tool-parameters">
              <h4 class="parameters-title">Parameters:</h4>
              <pre class="code-block" v-html="highlightJson(part.input)"></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tool Result Messages -->
    <div v-else-if="message.toolUseResult" class="content-section">
      <h3 class="section-title">Tool Result</h3>
      
      <div class="tool-result-content">
        <div class="result-header">
          <span class="result-type" v-if="message.toolUseResult.type">
            Type: {{ message.toolUseResult.type }}
          </span>
        </div>
        
        <div class="result-content">
          <h4 class="result-title">Output:</h4>
          <div class="result-data">
            <pre
              v-if="typeof message.toolUseResult.content === 'string'"
              class="text-block"
            >{{ message.toolUseResult.content }}</pre>
            <pre
              v-else
              class="code-block"
              v-html="highlightJson(message.toolUseResult.content)"
            ></pre>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Metadata Section -->
    <div class="metadata-section" v-if="showMetadata">
      <h3 class="section-title">Raw Message Data</h3>
      <pre class="code-block metadata-content" v-html="highlightJson(message)"></pre>
    </div>
    
    <!-- Actions -->
    <div class="content-actions">
      <button class="action-button" @click="showMetadata = !showMetadata">
        {{ showMetadata ? 'Hide' : 'Show' }} Raw Data
      </button>
      <button class="action-button" @click="copyToClipboard">
        Copy Message
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useSyntaxHighlighting } from '@/composables/useSyntaxHighlighting.js'

export default {
  name: 'MessageContent',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const showMetadata = ref(false)
    const { highlightJson } = useSyntaxHighlighting()
    
    const getMessageParts = (content) => {
      if (!content) return []
      
      if (typeof content === 'string') {
        return [{ type: 'text', content }]
      }
      
      if (Array.isArray(content)) {
        return content.map(item => {
          if (item.type === 'text') {
            return { type: 'text', content: item.text || '' }
          } else if (item.type === 'tool_use') {
            return {
              type: 'tool_use',
              name: item.name || 'Unknown Tool',
              id: item.id || '',
              input: item.input || {}
            }
          }
          return { type: 'unknown', content: JSON.stringify(item) }
        })
      }
      
      return [{ type: 'text', content: JSON.stringify(content) }]
    }
    
    const copyToClipboard = async () => {
      try {
        const messageText = JSON.stringify(props.message, null, 2)
        await navigator.clipboard.writeText(messageText)
        
        // Could add a toast notification here
        console.log('Message copied to clipboard')
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = JSON.stringify(props.message, null, 2)
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    }
    
    return {
      showMetadata,
      highlightJson,
      getMessageParts,
      copyToClipboard
    }
  }
}
</script>

<style scoped>
.message-content {
  padding: var(--spacing-lg);
  max-width: none;
}

.content-section {
  margin-bottom: var(--spacing-xl);
}

.content-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: var(--spacing-sm);
}

.summary-content {
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  border-left: 4px solid var(--summary-color);
}

.message-parts {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.message-part {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.message-part.text {
  border-left: 4px solid var(--text-primary);
}

.message-part.tool_use {
  border-left: 4px solid var(--tool-color);
}

.text-content {
  padding: var(--spacing-md);
}

.text-block {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.tool-use-content {
  padding: 0;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.tool-name {
  font-weight: var(--font-weight-semibold);
  color: var(--tool-color);
}

.tool-id {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.tool-parameters {
  padding: var(--spacing-md);
}

.parameters-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.code-block {
  margin: 0;
  padding: var(--spacing-md);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  line-height: 1.4;
  overflow-x: auto;
  color: var(--text-primary);
}

.tool-result-content {
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  border-left: 4px solid var(--tool-result-color);
  overflow: hidden;
}

.result-header {
  padding: var(--spacing-md);
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.result-type {
  font-weight: var(--font-weight-medium);
  color: var(--tool-result-color);
}

.result-content {
  padding: var(--spacing-md);
}

.result-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.result-data {
  max-height: 400px;
  overflow-y: auto;
}

.metadata-section {
  border-top: 2px solid var(--border-color);
  padding-top: var(--spacing-lg);
}

.metadata-content {
  max-height: 500px;
  overflow-y: auto;
}

.content-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
}

.action-button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-button:hover {
  background-color: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.action-button:focus {
  outline: none;
  border-color: var(--accent-color);
}

/* Syntax highlighting styles */
.code-block :deep(.hljs) {
  background: transparent;
  color: var(--text-primary);
}

.code-block :deep(.hljs-string) {
  color: var(--success-color);
}

.code-block :deep(.hljs-number) {
  color: var(--accent-color);
}

.code-block :deep(.hljs-literal) {
  color: var(--warning-color);
}

.code-block :deep(.hljs-attr) {
  color: var(--tool-color);
}

/* Responsive design */
@media (max-width: 768px) {
  .message-content {
    padding: var(--spacing-md);
  }
  
  .tool-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .content-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .message-content {
    padding: var(--spacing-sm);
  }
  
  .code-block {
    font-size: var(--font-size-xs);
    padding: var(--spacing-sm);
  }
}
</style>