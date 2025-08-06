import { logger } from './logger.js'

/**
 * Comprehensive file security validation system
 * Provides multi-layered security validation for file uploads
 */
export class FileSecurityValidator {
  constructor(options = {}) {
    // Allowed file extensions (case-insensitive)
    this.allowedExtensions = new Set(options.allowedExtensions || ['.jsonl', '.json'])
    
    // Allowed MIME types
    this.allowedMimeTypes = new Set(options.allowedMimeTypes || [
      'application/json',
      'text/plain',
      'application/jsonlines',
      'text/jsonlines'
    ])
    
    // File size limits (in bytes)
    this.maxFileSize = options.maxFileSize || (50 * 1024 * 1024) // 50MB
    this.minFileSize = options.minFileSize || 1 // 1 byte minimum
    
    // Content validation settings
    this.maxLines = options.maxLines || 100000 // 100k lines maximum
    this.maxLineLength = options.maxLineLength || 50000 // 50k chars per line
    this.timeoutMs = options.timeoutMs || 30000 // 30 second timeout
    
    // Security settings
    this.enableContentSanitization = options.enableContentSanitization !== false
    this.enableStructureValidation = options.enableStructureValidation !== false
    this.strictMode = options.strictMode || false
    
    logger.debug('FileSecurityValidator initialized', {
      component: 'FileSecurityValidator',
      maxFileSize: this.formatBytes(this.maxFileSize),
      allowedExtensions: Array.from(this.allowedExtensions),
      allowedMimeTypes: Array.from(this.allowedMimeTypes)
    })
  }

  /**
   * Validate file with comprehensive security checks
   * @param {File} file - File object to validate
   * @returns {Promise<ValidationResult>} Validation result
   */
  async validateFile(file) {
    const startTime = performance.now()
    const validationId = `validation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    logger.debug('Starting file validation', {
      component: 'FileSecurityValidator',
      validationId,
      fileName: file.name,
      fileSize: this.formatBytes(file.size),
      mimeType: file.type
    })

    try {
      const results = []
      
      // 1. Basic file properties validation
      const basicValidation = this.validateBasicProperties(file)
      if (!basicValidation.valid) {
        results.push(...basicValidation.errors)
      }
      
      // 2. File extension validation
      const extensionValidation = this.validateFileExtension(file.name)
      if (!extensionValidation.valid) {
        results.push(...extensionValidation.errors)
      }
      
      // 3. MIME type validation
      const mimeValidation = this.validateMimeType(file.type, file.name)
      if (!mimeValidation.valid) {
        results.push(...mimeValidation.errors)
      }
      
      // 4. File size validation
      const sizeValidation = this.validateFileSize(file.size)
      if (!sizeValidation.valid) {
        results.push(...sizeValidation.errors)
      }
      
      // If basic validation fails, skip content validation
      if (results.length > 0 && this.strictMode) {
        return this.createValidationResult(false, results, [], performance.now() - startTime)
      }
      
      // 5. Content validation (if file passes basic checks)
      if (results.length === 0 || !this.strictMode) {
        try {
          const contentValidation = await this.validateFileContent(file)
          if (!contentValidation.valid) {
            results.push(...contentValidation.errors)
          }
        } catch (error) {
          results.push({
            type: 'CONTENT_VALIDATION_FAILED',
            severity: 'high',
            message: 'Content validation failed due to processing error',
            details: { error: error.message }
          })
        }
      }
      
      const duration = performance.now() - startTime
      const result = this.createValidationResult(results.length === 0, results, [], duration)
      
      logger.debug('File validation completed', {
        component: 'FileSecurityValidator',
        validationId,
        valid: result.valid,
        errorCount: results.length,
        duration: `${duration.toFixed(2)}ms`
      })
      
      return result
      
    } catch (error) {
      const duration = performance.now() - startTime
      logger.error('File validation failed with exception', {
        component: 'FileSecurityValidator',
        validationId,
        error,
        duration: `${duration.toFixed(2)}ms`
      })
      
      return this.createValidationResult(false, [{
        type: 'VALIDATION_ERROR',
        severity: 'critical',
        message: 'File validation failed due to system error',
        details: { error: error.message }
      }], [], duration)
    }
  }

  /**
   * Validate basic file properties
   * @param {File} file - File to validate
   * @returns {ValidationResult} Basic validation result
   */
  validateBasicProperties(file) {
    const errors = []
    
    if (!file) {
      errors.push({
        type: 'NO_FILE',
        severity: 'critical',
        message: 'No file provided for validation'
      })
      return { valid: false, errors }
    }
    
    if (!file.name || file.name.trim() === '') {
      errors.push({
        type: 'INVALID_FILENAME',
        severity: 'high',
        message: 'File must have a valid name'
      })
    }
    
    // Check for potentially dangerous filenames
    const dangerousPatterns = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid filename characters
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i,  // Windows reserved names
      /^\./,  // Hidden files (Unix-style)
    ]
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(file.name)) {
        errors.push({
          type: 'SUSPICIOUS_FILENAME',
          severity: 'high',
          message: `Filename contains potentially unsafe characters or patterns: ${file.name}`
        })
        break
      }
    }
    
    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate file extension
   * @param {string} filename - Filename to validate
   * @returns {ValidationResult} Extension validation result
   */
  validateFileExtension(filename) {
    const errors = []
    const extension = this.getFileExtension(filename)
    
    if (!extension) {
      errors.push({
        type: 'NO_EXTENSION',
        severity: 'high',
        message: 'File must have a file extension'
      })
      return { valid: false, errors }
    }
    
    if (!this.allowedExtensions.has(extension.toLowerCase())) {
      errors.push({
        type: 'INVALID_EXTENSION',
        severity: 'high',
        message: `File extension '${extension}' not allowed. Supported types: ${Array.from(this.allowedExtensions).join(', ')}`,
        details: {
          provided: extension,
          allowed: Array.from(this.allowedExtensions)
        }
      })
    }
    
    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate MIME type with cross-validation against file extension
   * @param {string} mimeType - MIME type to validate
   * @param {string} filename - Filename for cross-validation
   * @returns {ValidationResult} MIME type validation result
   */
  validateMimeType(mimeType, filename) {
    const errors = []
    
    // Allow empty MIME type for some browsers/systems
    if (!mimeType || mimeType === '') {
      // Warn but don't fail validation if extension is valid
      const extension = this.getFileExtension(filename)
      if (this.allowedExtensions.has(extension?.toLowerCase())) {
        return { valid: true, errors: [], warnings: [{
          type: 'EMPTY_MIME_TYPE',
          message: 'MIME type not provided, relying on file extension validation'
        }] }
      }
    }
    
    if (mimeType && !this.allowedMimeTypes.has(mimeType)) {
      errors.push({
        type: 'INVALID_MIME_TYPE',
        severity: 'medium',
        message: `MIME type '${mimeType}' not explicitly allowed. Supported types: ${Array.from(this.allowedMimeTypes).join(', ')}`,
        details: {
          provided: mimeType,
          allowed: Array.from(this.allowedMimeTypes)
        }
      })
    }
    
    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate file size constraints
   * @param {number} fileSize - File size in bytes
   * @returns {ValidationResult} Size validation result
   */
  validateFileSize(fileSize) {
    const errors = []
    
    if (fileSize < this.minFileSize) {
      errors.push({
        type: 'FILE_TOO_SMALL',
        severity: 'medium',
        message: `File too small. Minimum size: ${this.formatBytes(this.minFileSize)}, actual: ${this.formatBytes(fileSize)}`
      })
    }
    
    if (fileSize > this.maxFileSize) {
      errors.push({
        type: 'FILE_TOO_LARGE',
        severity: 'high',
        message: `File too large. Maximum size: ${this.formatBytes(this.maxFileSize)}, actual: ${this.formatBytes(fileSize)}`,
        details: {
          maxSize: this.maxFileSize,
          actualSize: fileSize,
          maxSizeFormatted: this.formatBytes(this.maxFileSize),
          actualSizeFormatted: this.formatBytes(fileSize)
        }
      })
    }
    
    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate file content structure and format
   * @param {File} file - File to validate content
   * @returns {Promise<ValidationResult>} Content validation result
   */
  async validateFileContent(file) {
    return new Promise((resolve) => {
      const errors = []
      const warnings = []
      const reader = new FileReader()
      const timeout = setTimeout(() => {
        reader.abort()
        resolve({
          valid: false,
          errors: [{
            type: 'CONTENT_TIMEOUT',
            severity: 'high',
            message: `Content validation timed out after ${this.timeoutMs}ms`
          }]
        })
      }, this.timeoutMs)

      reader.onload = (event) => {
        clearTimeout(timeout)
        try {
          const content = event.target.result
          const validation = this.validateJsonlContent(content)
          resolve(validation)
        } catch (error) {
          resolve({
            valid: false,
            errors: [{
              type: 'CONTENT_PROCESSING_ERROR',
              severity: 'high',
              message: 'Failed to process file content',
              details: { error: error.message }
            }]
          })
        }
      }

      reader.onerror = () => {
        clearTimeout(timeout)
        resolve({
          valid: false,
          errors: [{
            type: 'FILE_READ_ERROR',
            severity: 'high',
            message: 'Failed to read file content'
          }]
        })
      }

      reader.readAsText(file)
    })
  }

  /**
   * Validate JSONL content structure
   * @param {string} content - File content to validate
   * @returns {ValidationResult} Content structure validation result
   */
  validateJsonlContent(content) {
    const errors = []
    const warnings = []
    
    if (!content || content.trim() === '') {
      errors.push({
        type: 'EMPTY_CONTENT',
        severity: 'high',
        message: 'File is empty or contains only whitespace'
      })
      return { valid: false, errors }
    }
    
    const lines = content.trim().split('\n')
    
    if (lines.length > this.maxLines) {
      errors.push({
        type: 'TOO_MANY_LINES',
        severity: 'high',
        message: `File contains too many lines. Maximum: ${this.maxLines}, actual: ${lines.length}`
      })
    }
    
    let validJsonLines = 0
    const sampleSize = Math.min(10, lines.length) // Sample first 10 lines
    
    for (let i = 0; i < sampleSize; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines
      
      if (line.length > this.maxLineLength) {
        warnings.push({
          type: 'LINE_TOO_LONG',
          message: `Line ${i + 1} exceeds maximum length (${this.maxLineLength} characters)`
        })
      }
      
      try {
        const parsed = JSON.parse(line)
        
        // Validate message structure
        if (this.enableStructureValidation && !this.isValidMessageStructure(parsed)) {
          warnings.push({
            type: 'INVALID_MESSAGE_STRUCTURE',
            message: `Line ${i + 1} does not match expected message structure`
          })
        } else {
          validJsonLines++
        }
        
        // Check for potentially dangerous content
        if (this.enableContentSanitization && this.containsSuspiciousContent(parsed)) {
          warnings.push({
            type: 'SUSPICIOUS_CONTENT',
            message: `Line ${i + 1} contains potentially suspicious content`
          })
        }
        
      } catch (parseError) {
        errors.push({
          type: 'INVALID_JSON',
          severity: 'high',
          message: `Invalid JSON on line ${i + 1}: ${parseError.message}`,
          details: {
            line: i + 1,
            content: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
            parseError: parseError.message
          }
        })
      }
    }
    
    // Check if we have valid JSON lines
    if (validJsonLines === 0 && sampleSize > 0) {
      errors.push({
        type: 'NO_VALID_JSON',
        severity: 'critical',
        message: 'No valid JSON lines found in sample content'
      })
    }
    
    return { valid: errors.length === 0, errors, warnings }
  }

  /**
   * Check if parsed JSON matches expected message structure
   * @param {any} parsed - Parsed JSON object
   * @returns {boolean} Whether structure is valid
   */
  isValidMessageStructure(parsed) {
    if (!parsed || typeof parsed !== 'object') return false
    
    // Expected fields for a chat message
    const requiredFields = ['role']
    const optionalFields = ['uuid', 'content', 'timestamp', 'tool_name', 'metadata']
    const validRoles = ['user', 'assistant', 'tool', 'tool_result', 'summary']
    
    // Check required fields
    for (const field of requiredFields) {
      if (!(field in parsed)) return false
    }
    
    // Validate role
    if (!validRoles.includes(parsed.role)) return false
    
    // All checks passed
    return true
  }

  /**
   * Check for suspicious content patterns
   * @param {any} parsed - Parsed JSON object
   * @returns {boolean} Whether content is suspicious
   */
  containsSuspiciousContent(parsed) {
    const suspiciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /<iframe[^>]*>/gi
    ]
    
    const content = JSON.stringify(parsed)
    return suspiciousPatterns.some(pattern => pattern.test(content))
  }

  /**
   * Get file extension from filename
   * @param {string} filename - Filename to parse
   * @returns {string|null} File extension including the dot
   */
  getFileExtension(filename) {
    if (!filename || typeof filename !== 'string') return null
    const lastDot = filename.lastIndexOf('.')
    if (lastDot === -1 || lastDot === filename.length - 1) return null
    return filename.substring(lastDot)
  }

  /**
   * Format bytes to human-readable string
   * @param {number} bytes - Number of bytes
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  /**
   * Create standardized validation result
   * @param {boolean} valid - Whether validation passed
   * @param {Array} errors - Array of errors
   * @param {Array} warnings - Array of warnings
   * @param {number} duration - Validation duration in ms
   * @returns {ValidationResult} Standardized result object
   */
  createValidationResult(valid, errors = [], warnings = [], duration = 0) {
    return {
      valid,
      errors: errors.map(error => ({
        ...error,
        timestamp: new Date().toISOString()
      })),
      warnings: warnings.map(warning => ({
        ...warning,
        timestamp: new Date().toISOString()
      })),
      metadata: {
        validationDuration: `${duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        validator: 'FileSecurityValidator'
      }
    }
  }

  /**
   * Sanitize content by removing or escaping dangerous elements
   * @param {string} content - Content to sanitize
   * @returns {string} Sanitized content
   */
  sanitizeContent(content) {
    if (!this.enableContentSanitization) return content
    
    // Basic HTML/JS sanitization
    return content
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, 'javascript-disabled:')
      .replace(/on\w+\s*=/gi, 'on-disabled=')
      .replace(/data:text\/html/gi, 'data-text-html-disabled')
  }

  /**
   * Get user-friendly error message for display
   * @param {ValidationResult} result - Validation result
   * @returns {string} User-friendly error message
   */
  getUserFriendlyErrorMessage(result) {
    if (result.valid) return null
    
    const criticalErrors = result.errors.filter(e => e.severity === 'critical')
    const highErrors = result.errors.filter(e => e.severity === 'high')
    const mediumErrors = result.errors.filter(e => e.severity === 'medium')
    
    if (criticalErrors.length > 0) {
      return criticalErrors[0].message
    }
    
    if (highErrors.length > 0) {
      return highErrors[0].message
    }
    
    if (mediumErrors.length > 0) {
      return mediumErrors[0].message
    }
    
    return result.errors[0]?.message || 'File validation failed'
  }

  /**
   * Get validation summary for logging/monitoring
   * @param {ValidationResult} result - Validation result
   * @returns {object} Validation summary
   */
  getValidationSummary(result) {
    return {
      valid: result.valid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      criticalErrors: result.errors.filter(e => e.severity === 'critical').length,
      highErrors: result.errors.filter(e => e.severity === 'high').length,
      mediumErrors: result.errors.filter(e => e.severity === 'medium').length,
      duration: result.metadata?.validationDuration || 'unknown'
    }
  }
}

export default FileSecurityValidator