import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await injectAxe(page)
  })

  test('should have no accessibility violations on initial load @accessibility', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    })
  })

  test('should have proper heading structure @accessibility', async ({ page }) => {
    // Check main heading
    const h1 = page.locator('h1')
    await expect(h1).toHaveText('Claude Log Viewer')
    await expect(h1).toHaveAttribute('role', 'heading')

    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should have proper ARIA labels and roles @accessibility', async ({ page }) => {
    // File upload button should have proper accessibility
    const uploadButton = page.locator('.upload-button')
    await expect(uploadButton).toHaveAttribute('role', 'button')
    await expect(uploadButton).toHaveAttribute('aria-label')

    // Navigation buttons should have proper ARIA
    const jsonlContent = '{"uuid": "1", "type": "user", "message": {"content": "Test"}}'
    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json', 
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    const navButtons = page.locator('[data-testid^="nav-"]')
    for (const button of await navButtons.all()) {
      await expect(button).toHaveAttribute('aria-label')
      await expect(button).toHaveAttribute('type', 'button')
    }
  })

  test('should be keyboard navigable @accessibility', async ({ page }) => {
    // Upload a test file first
    const jsonlContent = `{"uuid": "1", "type": "user", "message": {"content": "First message"}}
{"uuid": "2", "type": "assistant", "message": {"content": "Second message"}}`

    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    // Test keyboard navigation through focusable elements
    await page.keyboard.press('Tab')
    
    // Should be able to reach all interactive elements
    const focusableElements = [
      '.upload-button',
      '[data-testid="search-input"]',
      '[data-role-filter]',
      '[data-tool-filter]',
      '[data-testid="nav-previous"]',
      '[data-testid="nav-next"]'
    ]

    for (const selector of focusableElements) {
      const element = page.locator(selector).first()
      if (await element.count() > 0) {
        await element.focus()
        await expect(element).toBeFocused()
      }
    }
  })

  test('should support screen reader navigation @accessibility', async ({ page }) => {
    const jsonlContent = '{"uuid": "1", "type": "user", "message": {"content": "Screen reader test"}}'
    
    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    // Check for proper landmarks
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('header')).toBeVisible()

    // Check for proper live regions
    const navigationInfo = page.locator('.navigation-info')
    await expect(navigationInfo).toHaveAttribute('aria-live', 'polite')

    // Check message content is properly labeled
    const messageContent = page.locator('.message-content')
    await expect(messageContent).toHaveAttribute('role', 'article')
  })

  test('should have proper color contrast @accessibility', async ({ page }) => {
    // This would typically require axe-core color contrast checking
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true }
      }
    })
  })

  test('should work with high contrast mode @accessibility', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' })
    
    const jsonlContent = '{"uuid": "1", "type": "user", "message": {"content": "High contrast test"}}'
    
    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()
    
    // Check that content is still visible and accessible
    await checkA11y(page)
  })

  test('should support zoom up to 200% @accessibility', async ({ page }) => {
    // Set zoom level to 200%
    await page.setViewportSize({ width: 640, height: 480 }) // Simulates 200% zoom on 1280x960
    
    const jsonlContent = '{"uuid": "1", "type": "user", "message": {"content": "Zoom test"}}'
    
    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()
    
    // All content should still be accessible
    await expect(page.locator('.message-content')).toBeVisible()
    await expect(page.locator('.navigation-controls')).toBeVisible()
    
    // Navigation should still work
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.navigation-info')).toBeVisible()
  })

  test('should have proper focus management @accessibility', async ({ page }) => {
    const jsonlContent = `{"uuid": "1", "type": "user", "message": {"content": "Focus test"}}
{"uuid": "2", "type": "assistant", "message": {"content": "Second message"}}`

    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    // Focus should be visible
    const nextButton = page.locator('[data-testid="nav-next"]')
    await nextButton.focus()
    
    // Should have visible focus indicator
    await expect(nextButton).toHaveCSS('outline-width', /\d+px/)
    
    // Focus should move predictably
    await page.keyboard.press('Tab')
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should provide alternative text for non-text content @accessibility', async ({ page }) => {
    const jsonlContent = '{"uuid": "1", "type": "user", "message": {"content": "Alt text test"}}'
    
    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    // Check for loading spinner alt text
    const loadingSpinner = page.locator('.loading-spinner')
    if (await loadingSpinner.count() > 0) {
      await expect(loadingSpinner).toHaveAttribute('aria-label', 'Loading')
    }

    // Check for icon alternatives
    const icons = page.locator('[class*="icon"]')
    for (const icon of await icons.all()) {
      const hasAltText = await icon.getAttribute('aria-label') || 
                        await icon.getAttribute('alt') ||
                        await icon.getAttribute('title')
      expect(hasAltText).toBeTruthy()
    }
  })

  test('should handle form validation accessibly @accessibility', async ({ page }) => {
    // Try to upload invalid file type
    await page.setInputFiles('input[type="file"]', {
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('invalid content')
    })

    // Handle the alert dialog
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('alert')
      expect(dialog.message()).toContain('Please select a .jsonl or .json file')
      await dialog.accept()
    })

    // Error messages should be properly announced
    const errorMessages = page.locator('[role="alert"]')
    if (await errorMessages.count() > 0) {
      await expect(errorMessages.first()).toBeVisible()
      await expect(errorMessages.first()).toHaveAttribute('aria-live', 'assertive')
    }
  })

  test('should work with reduced motion preferences @accessibility', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    const jsonlContent = '{"uuid": "1", "type": "user", "message": {"content": "Reduced motion test"}}'
    
    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()
    
    // Animations should be disabled or reduced
    const animatedElements = page.locator('[class*="animate"], [class*="transition"]')
    for (const element of await animatedElements.all()) {
      const animationDuration = await element.evaluate(el => 
        getComputedStyle(el).animationDuration
      )
      // Should either be 0s or respect reduced motion
      expect(animationDuration === '0s' || animationDuration === '0.01s').toBeTruthy()
    }
  })

  test('should support voice control navigation @accessibility', async ({ page }) => {
    const jsonlContent = `{"uuid": "1", "type": "user", "message": {"content": "Voice control test"}}
{"uuid": "2", "type": "assistant", "message": {"content": "Second message"}}`

    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    // Elements should have clear, speakable labels
    const nextButton = page.locator('[data-testid="nav-next"]')
    const ariaLabel = await nextButton.getAttribute('aria-label')
    expect(ariaLabel).toMatch(/next|forward/i)

    const prevButton = page.locator('[data-testid="nav-previous"]')
    const prevAriaLabel = await prevButton.getAttribute('aria-label')
    expect(prevAriaLabel).toMatch(/previous|back/i)
  })

  test('should generate detailed accessibility report @accessibility', async ({ page }) => {
    const jsonlContent = '{"uuid": "1", "type": "user", "message": {"content": "Full accessibility test"}}'
    
    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonlContent)
    })

    await expect(page.locator('.message-display')).toBeVisible()

    // Run comprehensive accessibility audit
    const violations = await getViolations(page)
    
    if (violations.length > 0) {
      console.log('Accessibility violations found:', violations)
      
      // Log detailed information about violations
      violations.forEach(violation => {
        console.log(`Rule: ${violation.id}`)
        console.log(`Impact: ${violation.impact}`)
        console.log(`Description: ${violation.description}`)
        console.log(`Help: ${violation.help}`)
        console.log(`Nodes affected: ${violation.nodes.length}`)
        console.log('---')
      })
    }

    // Fail the test if there are any violations
    expect(violations).toHaveLength(0)
  })
})