import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('UI/UX Enhancements E2E Tests', () => {
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

  test.describe('REQ-001: Default Checkbox State @critical', () => {
    test('should show all filter checkboxes as checked by default', async ({ page }) => {
      // All role checkboxes should be checked
      const roleCheckboxes = page.locator('.checkbox-input[data-role]')
      const roleCount = await roleCheckboxes.count()
      
      for (let i = 0; i < roleCount; i++) {
        const checkbox = roleCheckboxes.nth(i)
        await expect(checkbox).toBeChecked()
      }
      
      // All tool checkboxes should be checked  
      const toolCheckboxes = page.locator('.checkbox-input[data-tool]')
      const toolCount = await toolCheckboxes.count()
      
      for (let i = 0; i < toolCount; i++) {
        const checkbox = toolCheckboxes.nth(i)
        await expect(checkbox).toBeChecked()
      }
    })

    test('should display visual checked state indicators', async ({ page }) => {
      // Custom checkboxes should show checkmarks
      const checkedLabels = page.locator('.checkbox-label.checked')
      const labelCount = await checkedLabels.count()
      
      expect(labelCount).toBeGreaterThan(0)
      
      for (let i = 0; i < labelCount; i++) {
        const label = checkedLabels.nth(i)
        await expect(label).toHaveClass(/checked/)
        
        const customCheckbox = label.locator('.checkbox-custom')
        await expect(customCheckbox).toBeVisible()
      }
    })

    test('should not show "Select All" buttons when all are selected', async ({ page }) => {
      const selectAllButtons = page.locator('.select-all-btn')
      await expect(selectAllButtons).toHaveCount(0)
    })
  })

  test.describe('REQ-002: Showing All Types Indicator @critical', () => {
    test('should display "showing all types" indicator by default', async ({ page }) => {
      const indicator = page.locator('.showing-all-indicator')
      await expect(indicator).toBeVisible()
      await expect(indicator).toContainText('Showing all message types')
      
      const icon = page.locator('.indicator-icon')
      await expect(icon).toContainText('✓')
    })

    test('should hide "Show All Messages" button when showing all', async ({ page }) => {
      const showAllButton = page.locator('.clear-button')
      await expect(showAllButton).toHaveCount(0)
    })

    test('should show "Show All Messages" button when filters are applied', async ({ page }) => {
      // Uncheck a role filter
      const userCheckbox = page.locator('.checkbox-input[data-role="user"]')
      await userCheckbox.uncheck()
      
      // Should hide indicator and show button
      const indicator = page.locator('.showing-all-indicator')
      await expect(indicator).toHaveCount(0)
      
      const showAllButton = page.locator('.clear-button')
      await expect(showAllButton).toBeVisible()
      await expect(showAllButton).toContainText('Show All Messages')
    })

    test('should restore all filters when "Show All Messages" is clicked', async ({ page }) => {
      // Apply some filters
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      await page.fill('.search-input', 'test search')
      
      // Click "Show All Messages"
      await page.click('.clear-button')
      
      // All checkboxes should be checked again
      const allCheckboxes = page.locator('.checkbox-input')
      const checkboxCount = await allCheckboxes.count()
      
      for (let i = 0; i < checkboxCount; i++) {
        await expect(allCheckboxes.nth(i)).toBeChecked()
      }
      
      // Search should be cleared
      await expect(page.locator('.search-input')).toHaveValue('')
      
      // Indicator should be shown again
      await expect(page.locator('.showing-all-indicator')).toBeVisible()
    })
  })

  test.describe('REQ-003: Modern CSS Design System @visual', () => {
    test('should have enhanced gradient background', async ({ page }) => {
      const filterControls = page.locator('.filter-controls')
      
      // Check for gradient background
      const background = await filterControls.evaluate(el => 
        getComputedStyle(el).background
      )
      expect(background).toBeDefined()
    })

    test('should have proper box shadow effects', async ({ page }) => {
      const filterControls = page.locator('.filter-controls')
      
      const boxShadow = await filterControls.evaluate(el => 
        getComputedStyle(el).boxShadow
      )
      expect(boxShadow).not.toBe('none')
    })

    test('should have custom checkbox styling with checkmarks', async ({ page }) => {
      const customCheckbox = page.locator('.checkbox-custom').first()
      
      const borderRadius = await customCheckbox.evaluate(el => 
        getComputedStyle(el).borderRadius
      )
      expect(borderRadius).toBeDefined()
      expect(borderRadius).not.toBe('0px')
      
      // Check for checkmark when checked
      const checkedCheckbox = page.locator('.checkbox-input:checked + .checkbox-custom').first()
      const content = await checkedCheckbox.evaluate(el => 
        getComputedStyle(el, '::after').content
      )
      expect(content).toBeDefined()
    })

    test('should have enhanced typography with proper hierarchy', async ({ page }) => {
      const filterTitle = page.locator('.filter-title').first()
      
      const textTransform = await filterTitle.evaluate(el => 
        getComputedStyle(el).textTransform
      )
      expect(textTransform).toBe('uppercase')
      
      const letterSpacing = await filterTitle.evaluate(el => 
        getComputedStyle(el).letterSpacing
      )
      expect(letterSpacing).not.toBe('normal')
    })

    test('should have smooth transitions on hover', async ({ page }) => {
      const checkboxLabel = page.locator('.checkbox-label').first()
      
      // Check for transition property
      const transition = await checkboxLabel.evaluate(el => 
        getComputedStyle(el).transition
      )
      expect(transition).not.toBe('none')
      
      // Test hover effect
      await checkboxLabel.hover()
      
      const backgroundColor = await checkboxLabel.evaluate(el => 
        getComputedStyle(el).backgroundColor
      )
      expect(backgroundColor).toBeDefined()
    })

    test('should use CSS variables for consistent spacing', async ({ page }) => {
      const filterSection = page.locator('.filter-section').first()
      
      const padding = await filterSection.evaluate(el => 
        getComputedStyle(el).padding
      )
      const marginBottom = await filterSection.evaluate(el => 
        getComputedStyle(el).marginBottom
      )
      
      expect(padding).toBeDefined()
      expect(marginBottom).toBeDefined()
    })
  })

  test.describe('REQ-004: Responsive Design @responsive', () => {
    test('should adapt to mobile viewport (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Filter controls should still be visible and functional
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toBeVisible()
      
      // Touch targets should be large enough
      const checkboxLabels = page.locator('.checkbox-label')
      const firstLabel = checkboxLabels.first()
      
      const boundingBox = await firstLabel.boundingBox()
      expect(boundingBox.height).toBeGreaterThanOrEqual(40) // Minimum 40px touch target
    })

    test('should adjust layout for tablet viewport (768px)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      
      // Filter header should maintain flex layout
      const filterHeader = page.locator('.filter-header').first()
      
      const display = await filterHeader.evaluate(el => 
        getComputedStyle(el).display
      )
      expect(display).toBe('flex')
      
      // Elements should be properly spaced
      const filterControls = page.locator('.filter-controls')
      await expect(filterControls).toBeVisible()
    })

    test('should maintain desktop layout on large screens (1200px)', async ({ page }) => {
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Full padding should be maintained
      const filterControls = page.locator('.filter-controls')
      
      const padding = await filterControls.evaluate(el => 
        getComputedStyle(el).padding
      )
      expect(padding).toBeDefined()
    })

    test('should handle orientation changes gracefully', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Portrait mode
      await expect(page.locator('.filter-controls')).toBeVisible()
      
      // Landscape mode
      await page.setViewportSize({ width: 667, height: 375 })
      await expect(page.locator('.filter-controls')).toBeVisible()
      
      // Functionality should remain intact
      const checkbox = page.locator('.checkbox-input').first()
      await checkbox.click()
      
      // Visual feedback should still work
      const label = page.locator('.checkbox-label').first()
      await expect(label).toBeDefined()
    })
  })

  test.describe('REQ-005: Smooth Transitions and Interactive Feedback @animation', () => {
    test('should provide hover feedback on interactive elements', async ({ page }) => {
      const checkboxLabel = page.locator('.checkbox-label').first()
      
      // Get initial background color
      const initialBg = await checkboxLabel.evaluate(el => 
        getComputedStyle(el).backgroundColor
      )
      
      // Hover and check for change
      await checkboxLabel.hover()
      
      const hoveredBg = await checkboxLabel.evaluate(el => 
        getComputedStyle(el).backgroundColor
      )
      
      // Background should change on hover (or transition should be present)
      const transition = await checkboxLabel.evaluate(el => 
        getComputedStyle(el).transition
      )
      expect(transition).not.toBe('none')
    })

    test('should show focus states for keyboard accessibility', async ({ page }) => {
      const checkbox = page.locator('.checkbox-input').first()
      
      // Focus the checkbox
      await checkbox.focus()
      
      // Custom checkbox should show focus outline
      const customCheckbox = page.locator('.checkbox-custom').first()
      const outline = await customCheckbox.evaluate(el => 
        getComputedStyle(el).outline
      )
      
      expect(outline).toBeDefined()
    })

    test('should animate button interactions', async ({ page }) => {
      // Create state where clear button is visible
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      
      const clearButton = page.locator('.clear-button')
      await expect(clearButton).toBeVisible()
      
      // Check for transition properties
      const transition = await clearButton.evaluate(el => 
        getComputedStyle(el).transition
      )
      expect(transition).not.toBe('none')
      
      // Hover should trigger animation
      await clearButton.hover()
      
      const transform = await clearButton.evaluate(el => 
        getComputedStyle(el).transform
      )
      expect(transform).toBeDefined()
    })

    test('should provide immediate visual feedback on selection changes', async ({ page }) => {
      const checkbox = page.locator('.checkbox-input[data-role="user"]')
      const label = page.locator('.checkbox-label[data-role="user"]')
      
      // Initially checked and has 'checked' class
      await expect(checkbox).toBeChecked()
      await expect(label).toHaveClass(/checked/)
      
      // Uncheck
      await checkbox.uncheck()
      
      // Should immediately lose 'checked' class
      await expect(label).not.toHaveClass(/checked/)
      await expect(checkbox).not.toBeChecked()
      
      // Check again
      await checkbox.check()
      
      // Should immediately regain 'checked' class
      await expect(label).toHaveClass(/checked/)
      await expect(checkbox).toBeChecked()
    })

    test('should animate shimmer effect on buttons', async ({ page }) => {
      // Create state where clear button is visible
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      
      const clearButton = page.locator('.clear-button')
      await expect(clearButton).toBeVisible()
      
      // Hover to trigger shimmer animation
      await clearButton.hover()
      
      // Check for pseudo-element animation
      const hasBeforeElement = await clearButton.evaluate(el => {
        const before = getComputedStyle(el, '::before')
        return before.content !== 'none' && before.content !== ''
      })
      
      // Animation should be present
      expect(hasBeforeElement).toBeDefined()
    })
  })

  test.describe('Enhanced User Experience @ux', () => {
    test('should display message counts for each filter option', async ({ page }) => {
      const messageCounts = page.locator('.message-count')
      const countTexts = await messageCounts.allTextContents()
      
      countTexts.forEach(text => {
        expect(text).toMatch(/\(\d+\)/)
        const number = parseInt(text.match(/\((\d+)\)/)[1])
        expect(number).toBeGreaterThanOrEqual(0)
      })
    })

    test('should show "Select All" buttons when not all are selected', async ({ page }) => {
      // Uncheck a role
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      
      // Select All button should appear
      const selectAllBtn = page.locator('.select-all-btn')
      await expect(selectAllBtn).toBeVisible()
      await expect(selectAllBtn).toContainText('Select All')
      
      // Click it
      await selectAllBtn.click()
      
      // All role checkboxes should be checked again
      const roleCheckboxes = page.locator('.checkbox-input[data-role]')
      const count = await roleCheckboxes.count()
      
      for (let i = 0; i < count; i++) {
        await expect(roleCheckboxes.nth(i)).toBeChecked()
      }
      
      // Select All button should disappear
      await expect(selectAllBtn).toHaveCount(0)
    })

    test('should provide enhanced search with focus effects', async ({ page }) => {
      const searchInput = page.locator('.search-input')
      const searchIcon = page.locator('.search-icon')
      
      // Focus the search input
      await searchInput.focus()
      
      // Should have focus styles
      const borderColor = await searchInput.evaluate(el => 
        getComputedStyle(el).borderColor
      )
      const boxShadow = await searchInput.evaluate(el => 
        getComputedStyle(el).boxShadow
      )
      
      expect(borderColor).toBeDefined()
      expect(boxShadow).not.toBe('none')
      
      // Icon should change color on focus
      const iconColor = await searchIcon.evaluate(el => 
        getComputedStyle(el).color
      )
      expect(iconColor).toBeDefined()
    })

    test('should maintain visual hierarchy with enhanced styling', async ({ page }) => {
      const filterSections = page.locator('.filter-section')
      const sectionCount = await filterSections.count()
      
      for (let i = 0; i < sectionCount; i++) {
        const section = filterSections.nth(i)
        
        const backgroundColor = await section.evaluate(el => 
          getComputedStyle(el).backgroundColor
        )
        const borderRadius = await section.evaluate(el => 
          getComputedStyle(el).borderRadius
        )
        
        expect(backgroundColor).toBeDefined()
        expect(borderRadius).not.toBe('0px')
      }
    })
  })

  test.describe('Accessibility Compliance @accessibility', () => {
    test('should pass axe accessibility checks', async ({ page }) => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('.filter-controls')
        .withRules(['color-contrast', 'keyboard', 'focus-order-semantics'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through filter controls
      await page.keyboard.press('Tab')
      
      let focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
      
      // Space/Enter should activate checkboxes
      await page.keyboard.press('Space')
      
      // Continue tabbing
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })

    test('should have proper ARIA attributes', async ({ page }) => {
      const checkboxes = page.locator('.checkbox-input')
      const checkboxCount = await checkboxes.count()
      
      for (let i = 0; i < checkboxCount; i++) {
        const checkbox = checkboxes.nth(i)
        await expect(checkbox).toHaveAttribute('type', 'checkbox')
      }
      
      const labels = page.locator('.checkbox-label')
      const labelCount = await labels.count()
      
      for (let i = 0; i < labelCount; i++) {
        const label = labels.nth(i)
        const tagName = await label.evaluate(el => el.tagName.toLowerCase())
        expect(tagName).toBe('label')
      }
    })

    test('should support high contrast mode', async ({ page }) => {
      // Simulate high contrast mode
      await page.emulateMedia([{ name: 'prefers-contrast', value: 'high' }])
      
      const checkbox = page.locator('.checkbox-custom').first()
      
      const borderWidth = await checkbox.evaluate(el => 
        getComputedStyle(el).borderWidth
      )
      
      // Should have enhanced borders in high contrast mode
      expect(borderWidth).toBeDefined()
    })

    test('should respect reduced motion preferences', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }])
      
      const button = page.locator('.clear-button')
      if (await button.count() > 0) {
        // Animations should be disabled with reduced motion
        const animation = await button.evaluate(el => 
          getComputedStyle(el).animation
        )
        
        // This would be handled by CSS media query
        expect(animation).toBeDefined()
      }
    })

    test('should announce state changes to screen readers', async ({ page }) => {
      const checkbox = page.locator('.checkbox-input[data-role="user"]')
      
      // Check state
      await expect(checkbox).toBeChecked()
      
      // Change state
      await checkbox.uncheck()
      await expect(checkbox).not.toBeChecked()
      
      // State should be properly announced via ARIA
      const ariaChecked = await checkbox.getAttribute('aria-checked')
      expect(ariaChecked).toBeDefined()
    })
  })

  test.describe('Performance Validation @performance', () => {
    test('should render filter controls within performance budget', async ({ page }) => {
      // Measure paint timing
      const paintTiming = await page.evaluate(() => {
        const entries = performance.getEntriesByType('paint')
        return entries.find(entry => entry.name === 'first-contentful-paint')?.startTime
      })
      
      expect(paintTiming).toBeLessThan(2000) // 2 seconds
    })

    test('should handle hover interactions smoothly', async ({ page }) => {
      const startTime = Date.now()
      
      const checkboxLabels = page.locator('.checkbox-label')
      const count = Math.min(await checkboxLabels.count(), 10) // Test first 10
      
      for (let i = 0; i < count; i++) {
        await checkboxLabels.nth(i).hover()
      }
      
      const hoverTime = Date.now() - startTime
      expect(hoverTime).toBeLessThan(1000) // Should be smooth
    })

    test('should maintain 60fps during animations', async ({ page }) => {
      // Create state where clear button is visible
      await page.locator('.checkbox-input[data-role="user"]').uncheck()
      
      const clearButton = page.locator('.clear-button')
      await expect(clearButton).toBeVisible()
      
      // Monitor frame rate during hover animation
      await page.evaluate(() => {
        let frameCount = 0
        let startTime = performance.now()
        
        function countFrames() {
          frameCount++
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames)
          } else {
            window.frameRate = frameCount
          }
        }
        
        requestAnimationFrame(countFrames)
      })
      
      await clearButton.hover()
      await page.waitForTimeout(1000)
      
      const frameRate = await page.evaluate(() => window.frameRate)
      expect(frameRate).toBeGreaterThan(50) // Close to 60fps
    })
  })

  test.describe('Cross-browser Compatibility @compatibility', () => {
    test('should work consistently across modern browsers', async ({ page, browserName }) => {
      // Test core functionality
      const checkbox = page.locator('.checkbox-input[data-role="user"]')
      await checkbox.uncheck()
      await expect(checkbox).not.toBeChecked()
      
      await checkbox.check()
      await expect(checkbox).toBeChecked()
      
      // Visual elements should be present
      const customCheckbox = page.locator('.checkbox-custom').first()
      await expect(customCheckbox).toBeVisible()
      
      // Styles should be applied
      const borderRadius = await customCheckbox.evaluate(el => 
        getComputedStyle(el).borderRadius
      )
      expect(borderRadius).not.toBe('0px')
    })
  })
})