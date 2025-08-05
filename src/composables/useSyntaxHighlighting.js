import { ref, nextTick } from 'vue'
import hljs from 'highlight.js'

// Import only the languages we need to reduce bundle size
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import python from 'highlight.js/lib/languages/python'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import sql from 'highlight.js/lib/languages/sql'

// Register languages
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('python', python)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('sql', sql)

/**
 * Composable for syntax highlighting functionality
 */
export function useSyntaxHighlighting() {
  const isHighlightingEnabled = ref(true)
  
  /**
   * Highlights code content
   * @param {string} content - Code content to highlight
   * @param {string} language - Language for highlighting (optional)
   * @returns {string} Highlighted HTML content
   */
  const highlightCode = (content, language = null) => {
    if (!isHighlightingEnabled.value || !content) {
      return escapeHtml(content || '')
    }
    
    try {
      if (language && hljs.getLanguage(language)) {
        const result = hljs.highlight(content, { language })
        return result.value
      } else {
        const result = hljs.highlightAuto(content)
        return result.value
      }
    } catch (error) {
      console.warn('Error highlighting code:', error)
      return escapeHtml(content)
    }
  }
  
  /**
   * Highlights JSON content with proper formatting
   * @param {string|Object} content - JSON content to highlight
   * @returns {string} Highlighted HTML content
   */
  const highlightJson = (content) => {
    if (!isHighlightingEnabled.value) {
      return escapeHtml(typeof content === 'string' ? content : JSON.stringify(content, null, 2))
    }
    
    try {
      const jsonString = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      const result = hljs.highlight(jsonString, { language: 'json' })
      return result.value
    } catch (error) {
      console.warn('Error highlighting JSON:', error)
      const fallback = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      return escapeHtml(fallback)
    }
  }
  
  /**
   * Detects the language of code content
   * @param {string} content - Code content
   * @returns {string|null} Detected language or null
   */
  const detectLanguage = (content) => {
    if (!content) return null
    
    try {
      const result = hljs.highlightAuto(content)
      return result.language || null
    } catch (error) {
      console.warn('Error detecting language:', error)
      return null
    }
  }
  
  /**
   * Highlights code blocks in HTML content
   * @param {string} html - HTML content with code blocks
   * @returns {string} HTML with highlighted code blocks
   */
  const highlightCodeBlocks = (html) => {
    if (!isHighlightingEnabled.value || !html) {
      return html || ''
    }
    
    // Simple regex to find code blocks (this is a basic implementation)
    return html.replace(
      /<code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code>/g,
      (match, language, code) => {
        const decodedCode = decodeHtml(code)
        const highlighted = highlightCode(decodedCode, language)
        return `<code class="hljs ${language || ''}">${highlighted}</code>`
      }
    )
  }
  
  /**
   * Applies syntax highlighting to DOM elements
   * @param {Element} element - DOM element containing code
   */
  const highlightElement = (element) => {
    if (!isHighlightingEnabled.value || !element) {
      return
    }
    
    nextTick(() => {
      const codeBlocks = element.querySelectorAll('pre code, code')
      codeBlocks.forEach(block => {
        if (!block.classList.contains('hljs')) {
          hljs.highlightElement(block)
        }
      })
    })
  }
  
  /**
   * Formats and highlights tool parameters
   * @param {Object} params - Tool parameters object
   * @returns {string} Formatted and highlighted HTML
   */
  const formatToolParameters = (params) => {
    if (!params || typeof params !== 'object') {
      return ''
    }
    
    try {
      const formatted = JSON.stringify(params, null, 2)
      return highlightJson(formatted)
    } catch (error) {
      console.warn('Error formatting tool parameters:', error)
      return escapeHtml(String(params))
    }
  }
  
  /**
   * Formats different types of message content
   * @param {any} content - Message content
   * @param {string} type - Content type hint
   * @returns {string} Formatted HTML content
   */
  const formatMessageContent = (content, type = 'auto') => {
    if (!content) return ''
    
    if (typeof content === 'string') {
      // Check if it looks like JSON
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        try {
          JSON.parse(content)
          return highlightJson(content)
        } catch {
          // Not valid JSON, treat as text
        }
      }
      
      // Check if it looks like code
      if (type === 'code' || content.includes('function ') || content.includes('import ') || content.includes('def ')) {
        return highlightCode(content)
      }
      
      // Default to plain text with line breaks
      return escapeHtml(content).replace(/\n/g, '<br>')
    }
    
    if (typeof content === 'object') {
      return highlightJson(content)
    }
    
    return escapeHtml(String(content))
  }
  
  /**
   * Toggles syntax highlighting on/off
   */
  const toggleHighlighting = () => {
    isHighlightingEnabled.value = !isHighlightingEnabled.value
  }
  
  return {
    // State
    isHighlightingEnabled,
    
    // Methods
    highlightCode,
    highlightJson,
    detectLanguage,
    highlightCodeBlocks,
    highlightElement,
    formatToolParameters,
    formatMessageContent,
    toggleHighlighting
  }
}

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Decodes HTML entities
 * @param {string} html - HTML to decode
 * @returns {string} Decoded text
 */
function decodeHtml(html) {
  const map = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'"
  }
  
  return html.replace(/&(amp|lt|gt|quot|#039);/g, (m) => map[m])
}