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
      @scroll="handleScroll"
      :style="{ 
        position: 'relative',
        overflow: 'auto',
        height: '100%'
      }"
    >
      <!-- Virtual scrolling viewport -->
      <div 
        v-if="shouldUseVirtualScrolling"
        class="virtual-list-container"
        :style="{ 
          height: totalHeight + 'px',
          position: 'relative'
        }"
      >
        <div
          class="virtual-list-viewport"
          :style="{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }"
        >
          <div
            v-for="{ item: message, index } in visibleItems"
            :key="message.uuid || `virtual-${index}`"
            class="message-card"
            :class="{
              'message-card--active': index === currentIndex,
              [`message-card--${getMessageTypeClass(message).replace('message-', '')}`]: true
            }"
            @click="$emit('message-click', index)"
            :style="{
              height: itemHeight + 'px',
              minHeight: itemHeight + 'px'
            }"
          >
            <!-- 炫酷背景效果 -->
            <div class="card-glow"></div>
            <div class="card-border"></div>
            
            <!-- 消息头部 -->
            <div class="message-header">
              <div class="message-type-badge">
                <div class="badge-icon"></div>
                <span class="badge-text">{{ getMessageTypeLabel(message) }}</span>
              </div>
              <div class="message-time-display">
                <span class="time-text">{{ formatShortTime(message.timestamp) }}</span>
              </div>
            </div>
            
            <!-- 消息内容预览 -->
            <div class="message-content">
              <div class="content-preview">
                {{ getMessagePreview(message) }}
              </div>
            </div>
            
            <!-- 工具标签 -->
            <div class="message-tools" v-if="getMessageToolNames(message).length > 0">
              <div 
                v-for="tool in getMessageToolNames(message)"
                :key="tool"
                class="tool-chip"
              >
                <div class="chip-glow"></div>
                <span class="chip-text">{{ tool }}</span>
              </div>
            </div>
            
            <!-- 激活状态指示器 -->
            <div class="active-indicator"></div>
          </div>
        </div>
      </div>
      
      <!-- Fallback for smaller datasets -->
      <template v-else>
        <div
          v-for="(message, index) in messages"
          :key="message.uuid || index"
          class="message-card"
          :class="{
            'message-card--active': index === currentIndex,
            [`message-card--${getMessageTypeClass(message).replace('message-', '')}`]: true
          }"
          @click="$emit('message-click', index)"
        >
          <!-- 炫酷背景效果 -->
          <div class="card-glow"></div>
          <div class="card-border"></div>
          
          <!-- 消息头部 -->
          <div class="message-header">
            <div class="message-type-badge">
              <div class="badge-icon"></div>
              <span class="badge-text">{{ getMessageTypeLabel(message) }}</span>
            </div>
            <div class="message-time-display">
              <span class="time-text">{{ formatShortTime(message.timestamp) }}</span>
            </div>
          </div>
          
          <!-- 消息内容预览 -->
          <div class="message-content">
            <div class="content-preview">
              {{ getMessagePreview(message) }}
            </div>
          </div>
          
          <!-- 工具标签 -->
          <div class="message-tools" v-if="getMessageToolNames(message).length > 0">
            <div 
              v-for="tool in getMessageToolNames(message)"
              :key="tool"
              class="tool-chip"
            >
              <div class="chip-glow"></div>
              <span class="chip-text">{{ tool }}</span>
            </div>
          </div>
          
          <!-- 激活状态指示器 -->
          <div class="active-indicator"></div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick, computed } from 'vue'
import { getMessageRole, getMessageToolNames, getMessageTypeLabel, getMessageTypeClass } from '@/utils/messageTypes.js'
import { formatShortTime } from '@/utils/dateFormatter.js'
import { useVirtualScrolling } from '@/composables/useVirtualScrolling.js'
import { useMarkdownRenderer } from '@/composables/useMarkdownRenderer.js'

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
    const messagesRef = computed(() => props.messages)
    const { getMarkdownPreview, isMarkdownContent } = useMarkdownRenderer()
    
    // Virtual scrolling configuration
    const itemHeight = 100 // Approximate height of each message item
    const threshold = 50   // Enable virtual scrolling for > 50 items
    
    // Virtual scrolling composable
    const {
      shouldUseVirtualScrolling,
      totalHeight,
      visibleItems,
      offsetY,
      handleScroll,
      scrollToIndex
    } = useVirtualScrolling(messagesRef, {
      itemHeight,
      containerHeight: 400,
      buffer: 10,
      threshold,
      enabled: true
    })
    
    // Scroll to current message when it changes
    watch(() => props.currentIndex, async (newIndex) => {
      if (!messageContainer.value || props.messages.length === 0) return
      
      await nextTick()
      
      if (shouldUseVirtualScrolling.value) {
        // Use virtual scrolling's scrollToIndex method
        scrollToIndex(newIndex)
      } else {
        // Fallback to DOM-based scrolling
        const activeItem = messageContainer.value.querySelector('.message-item.active')
        if (activeItem) {
          activeItem.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      }
    })
    
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
    
    const getMessagePreview = (message) => {
      if (!message) return 'No content'
      
      // Summary messages
      if (message.summary) {
        const summaryContent = getSummaryContent(message.summary)
        if (isMarkdownContent(summaryContent)) {
          return getMarkdownPreview(summaryContent, 100)
        }
        return summaryContent.substring(0, 100) + (summaryContent.length > 100 ? '...' : '')
      }
      
      // Regular messages with content
      if (message.message?.content) {
        if (typeof message.message.content === 'string') {
          const processedContent = processEscapeSequences(message.message.content)
          if (isMarkdownContent(processedContent)) {
            return getMarkdownPreview(processedContent, 100)
          }
          return processedContent.substring(0, 100) + (processedContent.length > 100 ? '...' : '')
        }
        
        if (Array.isArray(message.message.content)) {
          // 优先处理text内容
          const textContent = message.message.content
            .filter(item => item.type === 'text')
            .map(item => processEscapeSequences(item.text || ''))
            .join(' ')
          
          if (textContent) {
            if (isMarkdownContent(textContent)) {
              return getMarkdownPreview(textContent, 100)
            }
            return textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '')
          }
          
          // 如果没有text内容，检查tool_result内容
          const toolResultContent = message.message.content
            .filter(item => item.type === 'tool_result')
            .map(item => processEscapeSequences(item.content || ''))
            .join(' ')
          
          if (toolResultContent) {
            if (isMarkdownContent(toolResultContent)) {
              return getMarkdownPreview(toolResultContent, 100)
            }
            return toolResultContent.substring(0, 100) + (toolResultContent.length > 100 ? '...' : '')
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
        
        const processedContent = processEscapeSequences(content)
        if (typeof processedContent === 'string' && isMarkdownContent(processedContent)) {
          return getMarkdownPreview(processedContent, 100)
        }
        return processedContent.substring(0, 100) + (processedContent.length > 100 ? '...' : '')
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
      formatShortTime,
      // Virtual scrolling
      shouldUseVirtualScrolling,
      totalHeight,
      visibleItems,
      offsetY,
      handleScroll,
      itemHeight
    }
  }
}
</script>

<style scoped>
.message-list {
  display: flex;
  flex-direction: column;
  /* 移除固定高度限制，让内容自然撑开 */
  min-height: 100px; /* 只设置一个较小的最小高度 */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  text-align: center;
  min-height: 120px; /* 确保空状态有足够的显示高度 */
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
  /* 移除flex: 1，让内容根据实际大小撑开 */
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--spacing-sm) 0;
  /* 平滑滚动 */
  scroll-behavior: smooth;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
  /* 设置最大高度，超过时显示滚动条 */
  max-height: 400px;
}

/* Webkit 滚动条样式 */
.message-items::-webkit-scrollbar {
  width: 6px;
}

.message-items::-webkit-scrollbar-track {
  background: transparent;
}

.message-items::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.message-items::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* 暗色模式滚动条 */
.dark .message-items {
  scrollbar-color: rgba(75, 85, 99, 0.4) transparent;
}

.dark .message-items::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.4);
}

.dark .message-items::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.6);
}

/* 🚀 未来科技风消息卡片 */
.message-card {
  position: relative;
  margin: 8px 4px;
  padding: 16px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.9) 0%, 
    rgba(248, 250, 252, 0.95) 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform: translateZ(0);
  overflow: hidden;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.dark .message-card {
  background: linear-gradient(135deg, 
    rgba(30, 41, 59, 0.9) 0%, 
    rgba(51, 65, 85, 0.95) 100%);
  border-color: rgba(100, 116, 139, 0.3);
}

/* 发光背景效果 */
.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  transform: scale(0);
  transition: all 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: none;
}

/* 边框发光效果 */
.card-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  padding: 1px;
  background: linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.5), transparent);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: all 300ms ease-out;
  pointer-events: none;
}

/* Hover状态 */
.message-card:hover {
  transform: translateY(-2px) scale(1.02) translateZ(0);
  box-shadow: 
    0 8px 25px rgba(59, 130, 246, 0.15),
    0 3px 10px rgba(0, 0, 0, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.message-card:hover .card-glow {
  transform: scale(1);
}

.message-card:hover .card-border {
  opacity: 1;
}

/* 消息头部布局 */
.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
  z-index: 2;
}

/* 类型徽章 */
.message-type-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.05));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: all 200ms ease-out;
}

.badge-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
  animation: pulse-icon 2s ease-in-out infinite;
}

@keyframes pulse-icon {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
  }
  50% { 
    transform: scale(1.2);
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
  }
}

.badge-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(59, 130, 246, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.dark .badge-text {
  color: rgba(147, 197, 253, 0.9);
}

/* 时间显示 */
.message-time-display {
  padding: 4px 8px;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.time-text {
  font-size: 10px;
  font-weight: 500;
  color: rgba(100, 116, 139, 0.8);
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  letter-spacing: 0.3px;
}

.dark .time-text {
  color: rgba(148, 163, 184, 0.8);
  background: rgba(100, 116, 139, 0.15);
}

/* 消息内容区域 */
.message-content {
  margin-bottom: 12px;
  position: relative;
  z-index: 2;
}

.content-preview {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(51, 65, 85, 0.85);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  letter-spacing: 0.2px;
}

.dark .content-preview {
  color: rgba(203, 213, 225, 0.85);
}

/* 工具标签容器 */
.message-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  position: relative;
  z-index: 2;
}

/* 炫酷工具芯片 */
.tool-chip {
  position: relative;
  padding: 4px 10px;
  background: linear-gradient(135deg, 
    rgba(16, 185, 129, 0.1) 0%, 
    rgba(5, 150, 105, 0.05) 100%);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition: all 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  overflow: hidden;
}

.chip-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
  transform: scale(0);
  transition: all 300ms ease-out;
  pointer-events: none;
}

.tool-chip:hover .chip-glow {
  transform: scale(1);
}

.tool-chip:hover {
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  border-color: rgba(16, 185, 129, 0.4);
}

.chip-text {
  font-size: 10px;
  font-weight: 600;
  color: rgba(16, 185, 129, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.dark .chip-text {
  color: rgba(52, 211, 153, 0.9);
}

/* 激活状态指示器 */
.active-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #3b82f6, #1d4ed8);
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transform: scaleY(0);
  transition: all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
}

/* 激活状态样式 */
.message-card--active {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.1) 0%, 
    rgba(147, 197, 253, 0.05) 100%);
  border-color: rgba(59, 130, 246, 0.4);
  transform: translateX(4px) translateZ(0);
  box-shadow: 
    0 8px 32px rgba(59, 130, 246, 0.2),
    0 4px 16px rgba(0, 0, 0, 0.1);
}

.dark .message-card--active {
  background: linear-gradient(135deg, 
    rgba(59, 130, 246, 0.15) 0%, 
    rgba(30, 58, 138, 0.1) 100%);
}

.message-card--active .active-indicator {
  opacity: 1;
  transform: scaleY(1);
}

.message-card--active .card-glow {
  transform: scale(1.2);
}

/* 不同消息类型的特殊样式 */
.message-card--user .badge-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
}

.message-card--user .message-type-badge {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(196, 181, 253, 0.05));
  border-color: rgba(139, 92, 246, 0.2);
}

.message-card--user .badge-text {
  color: rgba(139, 92, 246, 0.9);
}

.message-card--assistant .badge-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.message-card--assistant .message-type-badge {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(167, 243, 208, 0.05));
  border-color: rgba(16, 185, 129, 0.2);
}

.message-card--assistant .badge-text {
  color: rgba(16, 185, 129, 0.9);
}

.message-card--tool .badge-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.message-card--tool .message-type-badge {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(253, 230, 138, 0.05));
  border-color: rgba(245, 158, 11, 0.2);
}

.message-card--tool .badge-text {
  color: rgba(245, 158, 11, 0.9);
}

.message-card--tool-result .badge-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
}

.message-card--tool-result .message-type-badge {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(196, 181, 253, 0.05));
  border-color: rgba(139, 92, 246, 0.2);
}

.message-card--tool-result .badge-text {
  color: rgba(139, 92, 246, 0.9);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .message-card {
    margin: 6px 2px;
    padding: 12px;
  }
  
  .message-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .message-type-badge {
    padding: 4px 8px;
  }
  
  .badge-text {
    font-size: 10px;
  }
  
  .content-preview {
    font-size: 12px;
    -webkit-line-clamp: 3;
  }
}
</style>