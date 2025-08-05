/**
 * Formats an ISO timestamp to readable format (YYYY/M/D HH:mm:ss)
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown'
  
  try {
    const date = new Date(timestamp)
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.warn('Error formatting timestamp:', timestamp, error)
    return 'Invalid Date'
  }
}

/**
 * Formats timestamp to a short format for list views (HH:mm:ss)
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Short formatted time string
 */
export function formatShortTime(timestamp) {
  if (!timestamp) return '--:--:--'
  
  try {
    const date = new Date(timestamp)
    
    if (isNaN(date.getTime())) {
      return '--:--:--'
    }
    
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    
    return `${hours}:${minutes}:${seconds}`
  } catch (error) {
    console.warn('Error formatting short time:', timestamp, error)
    return '--:--:--'
  }
}

/**
 * Gets relative time string (e.g., "2 minutes ago")
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Relative time string
 */
export function getRelativeTime(timestamp) {
  if (!timestamp) return 'Unknown time'
  
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    } else if (diffSeconds > 0) {
      return `${diffSeconds} second${diffSeconds > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  } catch (error) {
    console.warn('Error calculating relative time:', timestamp, error)
    return 'Unknown time'
  }
}

/**
 * Checks if a timestamp is from today
 * @param {string} timestamp - ISO timestamp string
 * @returns {boolean} True if timestamp is from today
 */
export function isToday(timestamp) {
  if (!timestamp) return false
  
  try {
    const date = new Date(timestamp)
    const today = new Date()
    
    return date.toDateString() === today.toDateString()
  } catch (error) {
    return false
  }
}