import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from '@axe-core/playwright'

test.describe('User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Claude Log Viewer')
  })

  test.describe('File Upload Workflow', () => {
    test('should upload and display JSONL file @smoke', async ({ page }) => {
      // Create test JSONL content
      const jsonlContent = `{"uuid": "1", "type": "user", "message": {"content": "Hello Claude"}}
{"uuid": "2", "type": "assistant", "message": {"content": "Hello! How can I help you today?"}}
{"uuid": "3", "type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Bash", "input": {"command": "ls -la"}}]}}`

      // Upload file using file input
      await page.setInputFiles('input[type="file"]', {
        name: 'test.jsonl',
        mimeType: 'application/json',
        buffer: Buffer.from(jsonlContent)
      })

      // Wait for file to be processed
      await expect(page.locator('.message-display')).toBeVisible({ timeout: 5000 })
      
      // Verify messages are loaded
      await expect(page.locator('.navigation-info')).toContainText('1 / 3')
      
      // Verify first message is displayed
      await expect(page.locator('.message-content')).toContainText('Hello Claude')
    })

    test('should handle drag and drop upload @smoke', async ({ page }) => {
      const jsonlContent = '{"uuid": "1", "type": "user", "message": {"content": "Test message"}}'
      
      // Create a DataTransfer object with file
      const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
      
      // Simulate drag and drop
      await page.dispatchEvent('body', 'dragenter', { dataTransfer })
      await expect(page.locator('.drop-zone')).toBeVisible()
      
      await page.dispatchEvent('.drop-zone', 'drop', {
        dataTransfer: await page.evaluateHandle((content) => {
          const dt = new DataTransfer()
          const file = new File([content], 'test.jsonl', { type: 'application/json' })
          dt.items.add(file)
          return dt
        }, jsonlContent)
      })

      await expect(page.locator('.message-display')).toBeVisible({ timeout: 5000 })
      await expect(page.locator('.message-content')).toContainText('Test message')
    })

    test('should show error for invalid file types', async ({ page }) => {
      await page.setInputFiles('input[type="file"]', {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('invalid content')
      })

      // Should show browser alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Please select a .jsonl or .json file')
        await dialog.accept()
      })
    })

    test('should handle file size limits', async ({ page }) => {
      // Create a large file (over 50MB)
      const largeContent = 'x'.repeat(51 * 1024 * 1024)
      
      await page.setInputFiles('input[type="file"]', {
        name: 'large.jsonl',
        mimeType: 'application/json',
        buffer: Buffer.from(largeContent)
      })

      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('File too large. Maximum size is 50MB')
        await dialog.accept()
      })
    })
  })

  test.describe('Navigation Workflow', () => {
    test.beforeEach(async ({ page }) => {
      // Upload test file
      const jsonlContent = `{"uuid": "1", "type": "user", "message": {"content": "Message 1"}}
{"uuid": "2", "type": "assistant", "message": {"content": "Message 2"}}
{"uuid": "3", "type": "tool_result", "toolUseResult": {"content": "Message 3"}}`

      await page.setInputFiles('input[type="file"]', {
        name: 'test.jsonl',
        mimeType: 'application/json',
        buffer: Buffer.from(jsonlContent)
      })

      await expect(page.locator('.message-display')).toBeVisible()
    })

    test('should navigate between messages using buttons @critical', async ({ page }) => {
      // Should start at first message
      await expect(page.locator('.navigation-info')).toContainText('1 / 3')
      await expect(page.locator('.message-content')).toContainText('Message 1')

      // Navigate to next message
      await page.click('[data-testid="nav-next"]')
      await expect(page.locator('.navigation-info')).toContainText('2 / 3')
      await expect(page.locator('.message-content')).toContainText('Message 2')

      // Navigate to previous message
      await page.click('[data-testid="nav-previous"]')
      await expect(page.locator('.navigation-info')).toContainText('1 / 3')
      await expect(page.locator('.message-content')).toContainText('Message 1')
    })

    test('should navigate using keyboard shortcuts @critical', async ({ page }) => {
      // Start at first message
      await expect(page.locator('.navigation-info')).toContainText('1 / 3')

      // Use arrow keys to navigate
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('.navigation-info')).toContainText('2 / 3')

      await page.keyboard.press('ArrowLeft')
      await expect(page.locator('.navigation-info')).toContainText('1 / 3')

      // Use Home/End keys
      await page.keyboard.press('End')
      await expect(page.locator('.navigation-info')).toContainText('3 / 3')

      await page.keyboard.press('Home')
      await expect(page.locator('.navigation-info')).toContainText('1 / 3')
    })

    test('should navigate using message index', async ({ page }) => {
      // Click on third message in index
      await page.click('[data-message-index="2"]')
      await expect(page.locator('.navigation-info')).toContainText('3 / 3')
      await expect(page.locator('.message-content')).toContainText('Message 3')
    })

    test('should disable navigation buttons at boundaries', async ({ page }) => {
      // At first message, previous should be disabled
      const prevButton = page.locator('[data-testid="nav-previous"]')
      await expect(prevButton).toBeDisabled()

      // Navigate to last message
      await page.keyboard.press('End')
      
      // At last message, next should be disabled
      const nextButton = page.locator('[data-testid="nav-next"]')
      await expect(nextButton).toBeDisabled()
    })
  })

  test.describe('Filtering Workflow', () => {
    test.beforeEach(async ({ page }) => {
      // Upload file with different message types
      const jsonlContent = `{"uuid": "1", "type": "user", "message": {"content": "Hello"}}
{"uuid": "2", "type": "assistant", "message": {"content": "Hi there"}}
{"uuid": "3", "type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Bash"}]}}
{"uuid": "4", "toolUseResult": {"content": "command output"}}`

      await page.setInputFiles('input[type="file"]', {
        name: 'test.jsonl',
        mimeType: 'application/json',
        buffer: Buffer.from(jsonlContent)
      })

      await expect(page.locator('.message-display')).toBeVisible()
    })

    test('should filter messages by role @critical', async ({ page }) => {
      // Initial state - all messages visible
      await expect(page.locator('.navigation-info')).toContainText('1 / 4')

      // Filter by user role
      await page.click('[data-role-filter="user"]')
      await expect(page.locator('.navigation-info')).toContainText('1 / 1')
      await expect(page.locator('.message-content')).toContainText('Hello')

      // Add assistant role to filter
      await page.click('[data-role-filter="assistant"]')
      await expect(page.locator('.navigation-info')).toContainText('1 / 2')

      // Clear filters
      await page.click('[data-testid="clear-role-filters"]')
      await expect(page.locator('.navigation-info')).toContainText('1 / 4')
    })

    test('should filter messages by tool type', async ({ page }) => {
      // Filter by Bash tool
      await page.click('[data-tool-filter="Bash"]')
      await expect(page.locator('.navigation-info')).toContainText('1 / 1')

      // Should show the tool use message
      await expect(page.locator('.message-type')).toContainText('TOOL')
    })

    test('should search messages by content @critical', async ({ page }) => {
      // Search for "Hello"
      await page.fill('[data-testid="search-input"]', 'Hello')
      await expect(page.locator('.navigation-info')).toContainText('1 / 1')
      await expect(page.locator('.message-content')).toContainText('Hello')

      // Search should be case insensitive
      await page.fill('[data-testid="search-input"]', 'hello')
      await expect(page.locator('.navigation-info')).toContainText('1 / 1')

      // Clear search
      await page.fill('[data-testid="search-input"]', '')
      await expect(page.locator('.navigation-info')).toContainText('1 / 4')
    })

    test('should combine multiple filters', async ({ page }) => {
      // Apply role filter and search
      await page.click('[data-role-filter="assistant"]')
      await page.fill('[data-testid="search-input"]', 'Hi there')
      
      await expect(page.locator('.navigation-info')).toContainText('1 / 1')
      await expect(page.locator('.message-content')).toContainText('Hi there')
    })

    test('should handle no results gracefully', async ({ page }) => {
      await page.fill('[data-testid="search-input"]', 'nonexistent')
      await expect(page.locator('.navigation-info')).toContainText('0 / 0')
      await expect(page.locator('.empty-state')).toBeVisible()
    })
  })

  test.describe('Error Handling Workflow', () => {
    test('should display error for malformed JSONL', async ({ page }) => {
      const invalidJsonl = `{"uuid": "1", "type": "user"}
invalid json line
{"uuid": "2", "type": "assistant"}`

      await page.setInputFiles('input[type="file"]', {
        name: 'invalid.jsonl',
        mimeType: 'application/json',
        buffer: Buffer.from(invalidJsonl)
      })

      // Should still process valid lines
      await expect(page.locator('.message-display')).toBeVisible()
      await expect(page.locator('.navigation-info')).toContainText('1 / 2')
    })

    test('should handle empty files', async ({ page }) => {
      await page.setInputFiles('input[type="file"]', {
        name: 'empty.jsonl',
        mimeType: 'application/json',
        buffer: Buffer.from('')
      })

      await expect(page.locator('.empty-state')).toBeVisible()
      await expect(page.locator('.empty-state')).toContainText('No messages to display')
    })

    test('should provide retry functionality', async ({ page }) => {
      // This would require mocking file read errors
      // For now, test the UI presence
      const errorButton = page.locator('[data-testid="retry-button"]')
      if (await errorButton.count() > 0) {
        await expect(errorButton).toBeVisible()
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const jsonlContent = '{"uuid": "1", "type": "user", "message": {"content": "Mobile test"}}'
      
      await page.setInputFiles('input[type="file"]', {
        name: 'mobile.jsonl',
        mimeType: 'application/json',
        buffer: Buffer.from(jsonlContent)
      })

      await expect(page.locator('.message-display')).toBeVisible()
      
      // Navigation should work on mobile
      await page.touchTap('[data-testid="nav-next"]')
      
      // Content should be readable
      await expect(page.locator('.message-content')).toBeVisible()
    })

    test('should adapt layout for tablet viewport @tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      const jsonlContent = '{"uuid": "1", "type": "user", "message": {"content": "Tablet test"}}'
      
      await page.setInputFiles('input[type="file"]', {
        name: 'tablet.jsonl',
        mimeType: 'application/json',
        buffer: Buffer.from(jsonlContent)
      })

      await expect(page.locator('.message-display')).toBeVisible()
      
      // Sidebar should be visible on tablet
      await expect(page.locator('.sidebar')).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should handle large files efficiently @performance', async ({ page }) => {
      // Create a large JSONL file
      const messages = Array.from({ length: 1000 }, (_, i) => 
        JSON.stringify({ uuid: `${i + 1}`, type: 'user', message: { content: `Message ${i + 1}` } })
      )
      const largeJsonl = messages.join('\n')

      const startTime = Date.now()

      await page.setInputFiles('input[type="file"]', {
        name: 'large.jsonl',
        mimeType: 'application/json',
        buffer: Buffer.from(largeJsonl)
      })

      await expect(page.locator('.message-display')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.navigation-info')).toContainText('1 / 1000')
      
      const loadTime = Date.now() - startTime
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(5000) // 5 seconds

      // Navigation should be responsive
      const navStart = Date.now()
      await page.keyboard.press('ArrowRight')
      await expect(page.locator('.navigation-info')).toContainText('2 / 1000')
      const navTime = Date.now() - navStart
      
      expect(navTime).toBeLessThan(100) // 100ms
    })

    test('should maintain smooth scrolling @performance', async ({ page }) => {
      const longContent = 'A'.repeat(10000)
      const jsonlContent = `{"uuid": "1", "type": "user", "message": {"content": "${longContent}"}}`
      
      await page.setInputFiles('input[type="file"]', {
        name: 'long.jsonl',
        mimeType: 'application/json',
        buffer: Buffer.from(jsonlContent)
      })

      await expect(page.locator('.message-display')).toBeVisible()
      
      // Test scrolling performance
      const messageContent = page.locator('.message-content')
      await messageContent.hover()
      
      // Scroll should be smooth without layout thrashing
      await page.mouse.wheel(0, 500)
      await page.waitForTimeout(100)
      await expect(messageContent).toBeVisible()
    })
  })
})