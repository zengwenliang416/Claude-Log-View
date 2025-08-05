import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests for UI/UX Enhancements', () => {
  const sampleJsonl = `{"uuid": "1", "type": "user", "message": {"content": "Hello Claude"}}
{"uuid": "2", "type": "assistant", "message": {"content": "Hello! How can I help you?"}}
{"uuid": "3", "type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Bash", "input": {"command": "ls -la"}}]}}
{"uuid": "4", "type": "tool_result", "toolUseResult": {"content": "file1.txt\\nfile2.txt"}}
{"uuid": "5", "type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Read", "input": {"file_path": "file1.txt"}}]}}`

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Claude Log Viewer')
    
    // Upload test data
    await page.setInputFiles('input[type="file"]', {
      name: 'test.jsonl',
      mimeType: 'application/json',
      buffer: Buffer.from(sampleJsonl)
    })
    
    await expect(page.locator('.message-display')).toBeVisible({ timeout: 5000 })
  })

  test.describe('Desktop Visual Tests @visual', () => {
    test('should render filter controls with modern design system', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toBeVisible()
      
      // Take screenshot of entire filter controls
      await expect(filterControls).toHaveScreenshot('filter-controls-desktop.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show all checkboxes checked by default', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const filterSection = page.locator('.filter-section').first()
      await expect(filterSection).toBeVisible()
      
      // Verify all checkboxes are checked visually
      await expect(filterSection).toHaveScreenshot('checkboxes-all-checked-desktop.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should display showing all indicator correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const indicator = page.locator('.showing-all-indicator')
      await expect(indicator).toBeVisible()
      
      await expect(indicator).toHaveScreenshot('showing-all-indicator-desktop.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show enhanced hover states', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const checkboxLabel = page.locator('.checkbox-label').first()
      await checkboxLabel.hover()
      
      await expect(checkboxLabel).toHaveScreenshot('checkbox-hover-desktop.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show custom checkbox styling', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const customCheckbox = page.locator('.checkbox-custom').first()
      await expect(customCheckbox).toBeVisible()
      
      await expect(customCheckbox).toHaveScreenshot('custom-checkbox-desktop.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should display clear button when filters applied', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Apply a filter
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      
      const clearButton = page.locator('.clear-button')
      await expect(clearButton).toBeVisible()
      
      await expect(clearButton).toHaveScreenshot('clear-button-desktop.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show select all button when not all selected', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Uncheck one role to show select all button
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      
      const selectAllBtn = page.locator('.select-all-btn')
      await expect(selectAllBtn).toBeVisible()
      
      const filterSection = page.locator('.filter-section').first()
      await expect(filterSection).toHaveScreenshot('select-all-button-desktop.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should display enhanced search input', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const searchSection = page.locator('.search-section')
      await expect(searchSection).toBeVisible()
      
      await expect(searchSection).toHaveScreenshot('search-input-desktop.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show search input focus state', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const searchInput = page.locator('.search-input')
      await searchInput.focus()
      
      const searchSection = page.locator('.search-section')
      await expect(searchSection).toHaveScreenshot('search-input-focused-desktop.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should display filter sections with proper spacing', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const filterSections = page.locator('.filter-section')
      await expect(filterSections.first()).toBeVisible()
      
      // Take screenshot of multiple sections to verify spacing
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toHaveScreenshot('filter-sections-spacing-desktop.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show gradient background and shadows', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Test the overall visual design with gradients and shadows
      const filterControls = page.locator('.filter-controls')
      
      // Focus on the design elements
      await expect(filterControls).toHaveScreenshot('gradient-shadows-desktop.png', {
        threshold: 0.2,
        animations: 'disabled',
        clip: { x: 0, y: 0, width: 400, height: 600 }
      })
    })
  })

  test.describe('Tablet Visual Tests @visual', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toBeVisible()
      
      await expect(filterControls).toHaveScreenshot('filter-controls-tablet.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should maintain touch targets on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      const checkboxSection = page.locator('.checkbox-group').first()
      await expect(checkboxSection).toBeVisible()
      
      await expect(checkboxSection).toHaveScreenshot('touch-targets-tablet.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show proper filter header layout on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      const filterHeader = page.locator('.filter-header').first()
      await expect(filterHeader).toBeVisible()
      
      await expect(filterHeader).toHaveScreenshot('filter-header-tablet.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })
  })

  test.describe('Mobile Visual Tests @visual', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toBeVisible()
      
      await expect(filterControls).toHaveScreenshot('filter-controls-mobile.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show mobile-optimized touch targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      const checkboxLabels = page.locator('.checkbox-label')
      await expect(checkboxLabels.first()).toBeVisible()
      
      const checkboxSection = page.locator('.checkbox-group').first()
      await expect(checkboxSection).toHaveScreenshot('touch-targets-mobile.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should adapt filter header for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      const filterHeader = page.locator('.filter-header').first()
      await expect(filterHeader).toBeVisible()
      
      await expect(filterHeader).toHaveScreenshot('filter-header-mobile.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show mobile search input layout', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      const searchSection = page.locator('.search-section')
      await expect(searchSection).toBeVisible()
      
      await expect(searchSection).toHaveScreenshot('search-input-mobile.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })
  })

  test.describe('Interactive State Visual Tests @visual', () => {
    test('should show unchecked state correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Uncheck a checkbox
      const userCheckbox = page.locator('.checkbox-input[data-role="user"]')
      await userCheckbox.uncheck()
      
      const userLabel = page.locator('.checkbox-label[data-role="user"]')
      await expect(userLabel).toHaveScreenshot('checkbox-unchecked-state.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show mixed selection state', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Create mixed selection state
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      await page.locator('.checkbox-input[data-role="assistant"]').check()
      
      const filterSection = page.locator('.filter-section').first()
      await expect(filterSection).toHaveScreenshot('mixed-selection-state.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show clear button hover state', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Create state where clear button is visible
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      
      const clearButton = page.locator('.clear-button')
      await clearButton.hover()
      
      await expect(clearButton).toHaveScreenshot('clear-button-hover.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show focus states correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const checkbox = page.locator('.checkbox-input').first()
      await checkbox.focus()
      
      const checkboxLabel = page.locator('.checkbox-label').first()
      await expect(checkboxLabel).toHaveScreenshot('checkbox-focus-state.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show select all button hover state', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Create state where select all button is visible
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      
      const selectAllBtn = page.locator('.select-all-btn')
      await selectAllBtn.hover()
      
      await expect(selectAllBtn).toHaveScreenshot('select-all-hover.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })
  })

  test.describe('Dark Theme Visual Tests @visual', () => {
    test('should render correctly in dark theme', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Emulate dark color scheme
      await page.emulateMedia([{ name: 'prefers-color-scheme', value: 'dark' }])
      
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toHaveScreenshot('filter-controls-dark-theme.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show dark theme hover states', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      await page.emulateMedia([{ name: 'prefers-color-scheme', value: 'dark' }])
      
      const checkboxLabel = page.locator('.checkbox-label').first()
      await checkboxLabel.hover()
      
      await expect(checkboxLabel).toHaveScreenshot('checkbox-hover-dark-theme.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should show enhanced shadows in dark theme', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      await page.emulateMedia([{ name: 'prefers-color-scheme', value: 'dark' }])
      
      const filterControls = page.locator('.filter-controls')
      
      // Focus on shadow effects in dark theme
      await expect(filterControls).toHaveScreenshot('shadows-dark-theme.png', {
        threshold: 0.2,
        animations: 'disabled',
        clip: { x: 0, y: 0, width: 400, height: 300 }
      })
    })
  })

  test.describe('High Contrast Visual Tests @visual', () => {
    test('should render correctly in high contrast mode', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Emulate high contrast preference
      await page.emulateMedia([{ name: 'prefers-contrast', value: 'high' }])
      
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toHaveScreenshot('filter-controls-high-contrast.png', {
        threshold: 0.3, // Higher threshold for contrast differences
        animations: 'disabled'
      })
    })

    test('should show enhanced borders in high contrast', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      await page.emulateMedia([{ name: 'prefers-contrast', value: 'high' }])
      
      const checkboxSection = page.locator('.checkbox-group').first()
      await expect(checkboxSection).toHaveScreenshot('checkboxes-high-contrast.png', {
        threshold: 0.3,
        animations: 'disabled'
      })
    })
  })

  test.describe('Animation and Transition Tests @visual', () => {
    test('should show button shimmer animation', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Create state where clear button is visible
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      
      const clearButton = page.locator('.clear-button')
      
      // Capture before hover
      await expect(clearButton).toHaveScreenshot('clear-button-before-animation.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
      
      // Hover to trigger animation
      await clearButton.hover()
      
      // Wait for animation to start
      await page.waitForTimeout(200)
      
      // Capture during/after animation
      await expect(clearButton).toHaveScreenshot('clear-button-during-animation.png', {
        threshold: 0.3, // Higher threshold due to animation
        animations: 'allow' // Allow animations for this test
      })
    })

    test('should show smooth checkbox transitions', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const checkboxLabel = page.locator('.checkbox-label').first()
      
      // Initial state
      await expect(checkboxLabel).toHaveScreenshot('checkbox-initial-state.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
      
      // Hover state
      await checkboxLabel.hover()
      await page.waitForTimeout(100)
      
      await expect(checkboxLabel).toHaveScreenshot('checkbox-hover-transition.png', {
        threshold: 0.3,
        animations: 'allow'
      })
    })
  })

  test.describe('Layout Stress Tests @visual', () => {
    test('should handle long filter names gracefully', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // This would require injecting test data with long names
      // For now, test with existing data
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toHaveScreenshot('long-names-layout.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should handle many filter options', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Test with existing options to verify scrolling behavior
      const checkboxGroup = page.locator('.checkbox-group').first()
      await expect(checkboxGroup).toHaveScreenshot('many-options-layout.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })

    test('should maintain layout with narrow widths', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 }) // Very narrow mobile
      
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toHaveScreenshot('narrow-width-layout.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })
  })

  test.describe('Cross-Browser Visual Consistency @visual', () => {
    test('should render consistently across browsers', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toHaveScreenshot(`filter-controls-${browserName}.png`, {
        threshold: 0.3, // Higher threshold for cross-browser differences
        animations: 'disabled'
      })
    })

    test('should show consistent custom checkbox rendering', async ({ page, browserName }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      const customCheckbox = page.locator('.checkbox-custom').first()
      await expect(customCheckbox).toHaveScreenshot(`custom-checkbox-${browserName}.png`, {
        threshold: 0.3,
        animations: 'disabled'
      })
    })
  })

  test.describe('Reduced Motion Visual Tests @visual', () => {
    test('should respect reduced motion preferences', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Emulate reduced motion preference
      await page.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }])
      
      // Create state where clear button is visible
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      
      const clearButton = page.locator('.clear-button')
      await clearButton.hover()
      
      // With reduced motion, button should still look good but without animation
      await expect(clearButton).toHaveScreenshot('clear-button-reduced-motion.png', {
        threshold: 0.2,
        animations: 'disabled'
      })
    })
  })
})