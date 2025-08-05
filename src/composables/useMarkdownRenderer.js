import { marked } from 'marked'
import { ref, computed } from 'vue'

/**
 * Composable for rendering Markdown content with syntax highlighting
 */
export function useMarkdownRenderer() {
  // 使用默认渲染器，通过CSS来控制样式
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert \n to <br>
    pedantic: false,
    sanitize: false, // We'll handle sanitization manually
    smartLists: true,
    smartypants: true, // Smart quotes and other punctuation
  })
  
  /**
   * Renders Markdown content to HTML
   * @param {string} content - The markdown content to render
   * @returns {string} The rendered HTML
   */
  const renderMarkdown = (content) => {
    // 首先确保内容是字符串类型
    if (!content) {
      return ''
    }
    
    // 如果不是字符串，尝试转换为字符串
    let stringContent = content
    if (typeof content !== 'string') {
      if (typeof content === 'object') {
        // 如果是对象，尝试JSON序列化
        try {
          stringContent = JSON.stringify(content, null, 2)
        } catch (e) {
          stringContent = String(content)
        }
      } else {
        stringContent = String(content)
      }
    }
    
    // 再次检查确保是有效字符串
    if (!stringContent || typeof stringContent !== 'string') {
      return '<div class="error-content">Unable to render content</div>'
    }
    
    try {
      // Pre-process content to handle common Claude formatting and escape sequences
      let processedContent = stringContent
        // 处理JSON转义序列 - 这是关键修复！
        .replace(/\\n/g, '\n')           // 换行符
        .replace(/\\t/g, '\t')           // 制表符
        .replace(/\\r/g, '\r')           // 回车符
        .replace(/\\"/g, '"')            // 双引号
        .replace(/\\'/g, "'")            // 单引号
        .replace(/\\\\/g, '\\')          // 反斜杠（最后处理避免影响其他转义）
        // Handle tool result formatting
        .replace(/^```(\w+)?\n([\s\S]*?)```$/gm, (match, lang, code) => {
          return '```' + (lang || 'plaintext') + '\n' + code + '```'
        })
        // Handle inline code that might be on multiple lines
        .replace(/`([^`\n]*(?:\n[^`\n]*)*)`/g, (match, code) => {
          if (code.includes('\n')) {
            return '```\n' + code + '\n```'
          }
          return match
        })
      
      return marked.parse(processedContent)
    } catch (error) {
      console.error('Markdown rendering error:', error, 'Content:', stringContent)
      // Fallback to escaped plain text
      return `<pre class="text-block fallback-content">${escapeHtml(stringContent)}</pre>`
    }
  }
  
  /**
   * Checks if content appears to contain Markdown
   * @param {string} content - Content to check
   * @returns {boolean} True if content likely contains Markdown
   */
  const isMarkdownContent = (content) => {
    if (!content) {
      return false
    }
    
    // 确保内容是字符串
    let stringContent = content
    if (typeof content !== 'string') {
      // 如果不是字符串，不太可能是Markdown
      return false
    }
    
    // 检查内容长度，太短的内容不太可能是复杂的Markdown
    if (stringContent.length < 10) {
      return false
    }
    
    // Common Markdown patterns
    const markdownPatterns = [
      /^#{1,6}\s/m, // Headers (multiline mode)
      /\*\*.*?\*\*/s, // Bold (dotall mode)
      /\*[^*]+\*/s, // Italic (dotall mode) 
      /`[^`]+`/s, // Inline code (dotall mode)
      /^```/m, // Code blocks (multiline mode)
      /^\* /m, // Unordered lists (multiline mode)
      /^\d+\. /m, // Ordered lists (multiline mode)
      /\[.*?\]\(.*?\)/s, // Links (dotall mode)
      /^>/m, // Blockquotes (multiline mode)
      /\|.*\|/s, // Tables (dotall mode)
    ]
    
    return markdownPatterns.some(pattern => pattern.test(stringContent))
  }
  
  /**
   * Escapes HTML characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  /**
   * Strips HTML tags from content for plain text display
   * @param {string} html - HTML content
   * @returns {string} Plain text content
   */
  const stripHtml = (html) => {
    if (!html) return ''
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }
  
  /**
   * Gets a plain text preview of markdown content
   * @param {string} content - Markdown content
   * @param {number} maxLength - Maximum length of preview
   * @returns {string} Plain text preview
   */
  const getMarkdownPreview = (content, maxLength = 100) => {
    if (!content) return 'No content'
    
    // 确保内容是字符串
    let stringContent = content
    if (typeof content !== 'string') {
      if (typeof content === 'object') {
        try {
          stringContent = JSON.stringify(content, null, 2)
        } catch (e) {
          stringContent = String(content)
        }
      } else {
        stringContent = String(content)
      }
    }
    
    // 如果转换后还是没有有效内容
    if (!stringContent || typeof stringContent !== 'string') {
      return 'No content'
    }
    
    // Convert markdown to HTML then strip tags for clean preview
    const html = renderMarkdown(stringContent)
    const plainText = stripHtml(html)
    
    if (plainText.length > maxLength) {
      return plainText.substring(0, maxLength) + '...'
    }
    
    return plainText || 'No preview available'
  }
  
  return {
    renderMarkdown,
    isMarkdownContent,
    escapeHtml,
    stripHtml,
    getMarkdownPreview
  }
}