import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should load application quickly @performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Wait for main content to be visible
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.upload-button')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Application should load within 2 seconds
    expect(loadTime).toBeLessThan(2000)
    
    console.log(`Application load time: ${loadTime}ms`)
  })

  test('should parse files efficiently @performance', async ({ page }) => {
    // Create test file with 1000 messages
    const messages = Array.from({ length: 1000 }, (_, i) => 
      JSON.stringify({
        uuid: `${i + 1}`,
        type: i % 2 === 0 ? 'user' : 'assistant',
        message: { content: `Message content ${i + 1}` },
        timestamp: new Date(Date.now() - i * 1000).toISOString()
      })
    )
    const jsonlContent = messages.join('\n')

    await page.goto('/')
    
    const startTime = Date.now()
    
    await page.setInputFiles('input[type="file"]', {
      name: 'performance-test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    // Wait for processing to complete
    await expect(page.locator('.message-display')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.navigation-info')).toContainText('1 / 1000')
    
    const parseTime = Date.now() - startTime
    
    // Should parse 1000 messages within 3 seconds
    expect(parseTime).toBeLessThan(3000)
    
    console.log(`Parse time for 1000 messages: ${parseTime}ms`)
  })

  test('should navigate between messages quickly @performance', async ({ page }) => {
    // Load test file
    const jsonlContent = Array.from({ length: 100 }, (_, i) => 
      JSON.stringify({ uuid: `${i + 1}`, type: 'user', message: { content: `Message ${i + 1}` } })
    ).join('\n')

    await page.goto('/')
    await page.setInputFiles('input[type="file"]', {
      name: 'nav-test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    // Measure navigation performance
    const startTime = Date.now()
    
    // Navigate through 10 messages
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('.navigation-info')).toContainText(`${i + 2} / 100`)
    }
    
    const navTime = Date.now() - startTime
    
    // 10 navigations should complete within 500ms
    expect(navTime).toBeLessThan(500)
    
    console.log(`Navigation time for 10 steps: ${navTime}ms`)
  })

  test('should filter messages quickly @performance', async ({ page }) => {
    // Create mixed message types
    const messages = Array.from({ length: 2000 }, (_, i) => {
      const types = ['user', 'assistant', 'tool_result']
      const type = types[i % 3]
      return JSON.stringify({
        uuid: `${i + 1}`,
        type,
        message: { content: `${type} message ${i + 1}` }
      })
    })
    const jsonlContent = messages.join('\n')

    await page.goto('/')
    await page.setInputFiles('input[type="file"]', {
      name: 'filter-test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()
    await expect(page.locator('.navigation-info')).toContainText('1 / 2000')

    const startTime = Date.now()
    
    // Apply role filter
    await page.click('[data-role-filter="user"]')
    await expect(page.locator('.navigation-info')).toContainText('/ 667') // ~1/3 of messages
    
    const filterTime = Date.now() - startTime
    
    // Filtering should complete within 200ms
    expect(filterTime).toBeLessThan(200)
    
    console.log(`Filter time for 2000 messages: ${filterTime}ms`)
  })

  test('should search messages efficiently @performance', async ({ page }) => {
    // Create searchable content
    const searchTerms = ['error', 'success', 'warning', 'info', 'debug']
    const messages = Array.from({ length: 1000 }, (_, i) => {
      const term = searchTerms[i % searchTerms.length]
      return JSON.stringify({
        uuid: `${i + 1}`,
        type: 'user',
        message: { content: `This is a ${term} message number ${i + 1}` }
      })
    })
    const jsonlContent = messages.join('\n')

    await page.goto('/')
    await page.setInputFiles('input[type="file"]', {
      name: 'search-test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    const startTime = Date.now()
    
    // Perform search
    await page.fill('[data-testid="search-input"]', 'error')
    await expect(page.locator('.navigation-info')).toContainText('/ 200') // ~1/5 of messages
    
    const searchTime = Date.now() - startTime
    
    // Search should complete within 300ms
    expect(searchTime).toBeLessThan(300)
    
    console.log(`Search time for 1000 messages: ${searchTime}ms`)
  })

  test('should handle large individual messages @performance', async ({ page }) => {
    // Create message with large content
    const largeContent = 'A'.repeat(100000) // 100KB content
    const jsonlContent = JSON.stringify({
      uuid: '1',
      type: 'user',
      message: { content: largeContent }
    })

    await page.goto('/')

    const startTime = Date.now()
    
    await page.setInputFiles('input[type="file"]', {
      name: 'large-message.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible({ timeout: 5000 })
    
    const loadTime = Date.now() - startTime
    
    // Should handle large message within 2 seconds
    expect(loadTime).toBeLessThan(2000)
    
    // Check that content is actually displayed
    await expect(page.locator('.message-content')).toContainText('AAA')
    
    console.log(`Large message load time: ${loadTime}ms`)
  })

  test('should maintain performance during rapid interactions @performance', async ({ page }) => {
    const jsonlContent = Array.from({ length: 500 }, (_, i) => 
      JSON.stringify({ uuid: `${i + 1}`, type: 'user', message: { content: `Message ${i + 1}` } })
    ).join('\n')

    await page.goto('/')
    await page.setInputFiles('input[type="file"]', {
      name: 'rapid-test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    const startTime = Date.now()
    
    // Rapid navigation
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowRight')
    }
    
    // Rapid filtering
    await page.click('[data-role-filter="user"]')
    await page.click('[data-role-filter="user"]') // toggle off
    
    // Rapid search
    await page.fill('[data-testid="search-input"]', 'Message')
    await page.fill('[data-testid="search-input"]', '')
    
    const totalTime = Date.now() - startTime
    
    // All rapid interactions should complete within 1 second
    expect(totalTime).toBeLessThan(1000)
    
    console.log(`Rapid interactions time: ${totalTime}ms`)
  })

  test('should have efficient memory usage @performance', async ({ page, context }) => {
    // Enable performance monitoring
    await context.addInitScript(() => {
      window.performanceData = {
        memoryStart: performance.memory?.usedJSHeapSize || 0,
        memoryPeak: 0
      }
      
      const originalSetTimeout = window.setTimeout
      window.setTimeout = function(...args) {
        window.performanceData.memoryPeak = Math.max(
          window.performanceData.memoryPeak,
          performance.memory?.usedJSHeapSize || 0
        )
        return originalSetTimeout.apply(this, args)
      }
    })

    // Create large dataset
    const messages = Array.from({ length: 5000 }, (_, i) => 
      JSON.stringify({
        uuid: `${i + 1}`,
        type: 'user',
        message: { content: `Message with content ${i + 1}`.repeat(5) }
      })
    )
    const jsonlContent = messages.join('\n')

    await page.goto('/')
    await page.setInputFiles('input[type="file"]', {
      name: 'memory-test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    // Perform various operations to test memory usage
    for (let i = 0; i < 10; i++) {
      await page.fill('[data-testid="search-input"]', `Message ${i * 100}`)
      await page.fill('[data-testid="search-input"]', '')
      await page.keyboard.press('ArrowRight')
    }

    // Check memory usage
    const memoryData = await page.evaluate(() => window.performanceData)
    const memoryIncrease = memoryData.memoryPeak - memoryData.memoryStart
    
    console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`)
    
    // Memory increase should be reasonable (less than 100MB for 5000 messages)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
  })

  test('should handle concurrent operations efficiently @performance', async ({ page }) => {
    const jsonlContent = Array.from({ length: 1000 }, (_, i) => 
      JSON.stringify({ uuid: `${i + 1}`, type: 'user', message: { content: `Message ${i + 1}` } })
    ).join('\n')

    await page.goto('/')
    await page.setInputFiles('input[type="file"]', {
      name: 'concurrent-test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    const startTime = Date.now()
    
    // Simulate concurrent operations
    const operations = [
      page.keyboard.press('ArrowRight'),
      page.fill('[data-testid="search-input"]', 'Message'),
      page.click('[data-role-filter="user"]'),
      page.keyboard.press('ArrowRight'),
      page.fill('[data-testid="search-input"]', ''),
      page.click('[data-role-filter="user"]')
    ]

    await Promise.all(operations)
    
    const concurrentTime = Date.now() - startTime
    
    // Concurrent operations should complete quickly
    expect(concurrentTime).toBeLessThan(500)
    
    console.log(`Concurrent operations time: ${concurrentTime}ms`)
  })
})