<template>
  <div class="message-content">
    <!-- Summary Message -->
    <div v-if="message.type === 'summary'" class="content-section">
      <h3 class="section-title">Summary</h3>
      <div class="summary-content">
        <pre class="text-block">{{ getSummaryContent(message.summary) }}</pre>
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
          <!-- Text Content (Plain Text) -->
          <div v-if="part.type === 'text'" class="text-content">
            <pre class="text-block">{{ typeof part.content === 'string' ? part.content : JSON.stringify(part.content, null, 2) }}</pre>
          </div>
          
          <!-- Tool Use -->
          <div v-else-if="part.type === 'tool_use'" class="tool-use-content">
            <div class="tool-header">
              <span class="tool-name">{{ part.name }}</span>
              <span class="tool-id">{{ part.id }}</span>
            </div>
            
            <div class="tool-parameters">
              <h4 class="parameters-title">Parameters:</h4>
              <pre class="code-block" v-html="ensureString(highlightJson(part.input))"></pre>
            </div>
          </div>
          
          <!-- Tool Result -->
          <div v-else-if="part.type === 'tool_result'" class="tool-result-content">
            <div class="tool-result-header">
              <span class="result-label">Tool Result</span>
              <span class="tool-use-id" v-if="part.tool_use_id">{{ part.tool_use_id }}</span>
            </div>
            
            <div class="result-content">
              <pre class="text-block">{{ part.content }}</pre>
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
        return [{ type: 'text', content: processEscapeSequences(content) }]
      }
      
      if (Array.isArray(content)) {
        return content.map(item => {
          if (item && item.type === 'text') {
            // 确保 text 内容是字符串并处理转义字符
            const textContent = item.text || item.content || ''
            const stringContent = typeof textContent === 'string' ? textContent : JSON.stringify(textContent)
            const processedContent = processEscapeSequences(stringContent)
            return { type: 'text', content: processedContent }
          } else if (item && item.type === 'tool_use') {
            // 处理Vue Proxy对象，转换为普通对象
            const inputObj = item.input || {}
            const plainInput = typeof inputObj === 'object' ? JSON.parse(JSON.stringify(inputObj)) : inputObj
            return {
              type: 'tool_use',
              name: item.name || 'Unknown Tool',
              id: item.id || '',
              input: plainInput
            }
          } else if (item && item.type === 'tool_result') {
            // 处理 tool_result 类型
            const resultContent = item.content || ''
            const stringContent = typeof resultContent === 'string' ? resultContent : JSON.stringify(resultContent)
            const processedContent = processEscapeSequences(stringContent)
            return { 
              type: 'tool_result', 
              content: processedContent,
              tool_use_id: item.tool_use_id || ''
            }
          }
          // 处理其他类型的内容
          const fallbackContent = typeof item === 'string' ? item : JSON.stringify(item)
          return { type: 'unknown', content: processEscapeSequences(fallbackContent) }
        })
      }
      
      // 如果是对象，转换为字符串
      const fallbackContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      return [{ type: 'text', content: processEscapeSequences(fallbackContent) }]
    }
    
    const copyToClipboard = async () => {
      try {
        const messageText = JSON.stringify(props.message, null, 2)
        await navigator.clipboard.writeText(messageText)
        
        // Could add a toast notification here
        // Message copied successfully
      } catch (error) {
        // Copy failed - error handled by UI feedback
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = JSON.stringify(props.message, null, 2)
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    }
    
    const processEscapeSequences = (text) => {
      if (!text || typeof text !== 'string') return text
      
      return text
        .replace(/\\n/g, '\n')           // 换行符
        .replace(/\\t/g, '\t')           // 制表符
        .replace(/\\r/g, '\r')           // 回车符
        .replace(/\\"/g, '"')            // 双引号
        .replace(/\\'/g, "'")            // 单引号
        .replace(/\\\\/g, '\\')          // 反斜杠（最后处理）
    }
    
    const getSummaryContent = (summary) => {
      if (!summary) return 'No summary available'
      
      // 如果是字符串，处理转义字符后返回
      if (typeof summary === 'string') {
        return processEscapeSequences(summary)
      }
      
      // 如果是对象，尝试提取常见的文本字段
      if (typeof summary === 'object') {
        // Claude日志可能的summary结构
        if (summary.content) return processEscapeSequences(summary.content)
        if (summary.text) return processEscapeSequences(summary.text)
        if (summary.summary) return processEscapeSequences(summary.summary)
        if (summary.message) return processEscapeSequences(summary.message)
        
        // 如果都没有，格式化显示整个对象
        return JSON.stringify(summary, null, 2)
      }
      
      // 其他类型转换为字符串
      return processEscapeSequences(String(summary))
    }
    
    const ensureString = (value) => {
      if (typeof value === 'string') return value
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') {
        try {
          return JSON.stringify(value, null, 2)
        } catch (e) {
          return String(value)
        }
      }
      return String(value)
    }
    
    return {
      showMetadata,
      highlightJson,
      getMessageParts,
      getSummaryContent,
      ensureString,
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

.message-part.tool_result {
  border-left: 4px solid var(--tool-result-color);
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

/* Tool Result styles */
.tool-result-content {
  padding: 0;
}

.tool-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.result-label {
  font-weight: var(--font-weight-semibold);
  color: var(--tool-result-color);
}

.tool-use-id {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-family: var(--font-mono);
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

/* 🎨 炫酷 Markdown 渲染样式 */
.markdown-content {
  line-height: 1.7;
  color: var(--text-primary);
}

/* 默认HTML标签样式 */
.markdown-content ul,
.markdown-content ol {
  margin: 0.8em 0;
  padding-left: 1.5em;
}

.markdown-content ul li,
.markdown-content ol li {
  margin: 0.3em 0;
  line-height: 1.6;
}

.markdown-content pre {
  background: linear-gradient(145deg, #f8fafc, #f1f5f9);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin: 1em 0;
  padding: 1rem;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 0.9em;
  line-height: 1.4;
  color: var(--text-primary);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.dark .markdown-content pre {
  background: linear-gradient(145deg, #1e293b, #334155);
  border-color: var(--border-color);
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.markdown-content code {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  padding: 2px 6px;
  font-family: var(--font-mono);
  font-size: 0.9em;
  color: var(--accent-color);
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.markdown-content pre code {
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
  display: block;
}

.markdown-content blockquote {
  border-left: 4px solid var(--accent-color);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 197, 253, 0.02));
  margin: 1em 0;
  padding: 0.8em 1.2em;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: var(--text-secondary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  margin: 1em 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markdown-content th {
  background: linear-gradient(135deg, var(--accent-color), rgba(59, 130, 246, 0.8));
  color: white;
  font-weight: 600;
  padding: 0.8em 1em;
  text-align: left;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}

.markdown-content td {
  padding: 0.8em 1em;
  border-bottom: 1px solid var(--border-color);
  vertical-align: top;
}

.markdown-content tr:nth-child(even) {
  background: rgba(59, 130, 246, 0.02);
}

.markdown-content tr:hover {
  background: rgba(59, 130, 246, 0.05);
}

.markdown-content a {
  color: var(--accent-color);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s ease;
  font-weight: 500;
}

.markdown-content a:hover {
  border-bottom-color: var(--accent-color);
  text-shadow: 0 1px 2px rgba(59, 130, 246, 0.3);
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin: 1.5em 0 0.5em 0;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
  position: relative;
}

.markdown-content h1:first-child,
.markdown-content h2:first-child,
.markdown-content h3:first-child {
  margin-top: 0;
}

.markdown-content h1 {
  font-size: 1.8em;
  border-bottom: 2px solid var(--accent-color);
  padding-bottom: 0.3em;
}

.markdown-content h2 {
  font-size: 1.5em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.2em;
}

.markdown-content h3 {
  font-size: 1.3em;
  color: var(--accent-color);
}

.markdown-content p {
  margin: 0.8em 0;
  text-align: justify;
}

.markdown-content strong {
  font-weight: 700;
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.markdown-content em {
  font-style: italic;
  color: var(--accent-color);
}

.markdown-content hr {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--border-color), transparent);
  margin: 2em 0;
}

/* 特殊的高亮效果 */
.markdown-content pre::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(59, 130, 246, 0.5), 
    transparent);
  opacity: 0.7;
}

/* Fallback content styling */
.fallback-content {
  background: rgba(239, 68, 68, 0.1);
  border-left: 4px solid #ef4444;
  color: var(--text-primary);
}

/* Error content styling */
.markdown-content .error-content {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 1rem;
  color: #dc2626;
  font-weight: 500;
  text-align: center;
  font-style: italic;
}

.dark .markdown-content .error-content {
  background: rgba(239, 68, 68, 0.2);
  border-color: #f87171;
  color: #fca5a5;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .markdown-content {
    font-size: 0.95em;
  }
  
  .markdown-content h1 {
    font-size: 1.6em;
  }
  
  .markdown-content h2 {
    font-size: 1.4em;
  }
  
  .markdown-content .markdown-code code {
    font-size: 0.8em;
    padding: 0.8rem;
  }
  
  .markdown-content .table-container {
    font-size: 0.9em;
  }
}

/* 响应式设计 */
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