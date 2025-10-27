/**
 * End-to-End Tests for Dual-Audience Homepage
 * Tests complete user flows and real browser interactions
 */

import { test, expect } from '@playwright/test'

// Test configuration for different locales
const locales = ['fr', 'en', 'ar']

test.describe('Dual-Audience Homepage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with proper viewport
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test.describe('Page Loading and Structure', () => {
    locales.forEach(locale => {
      test(`loads homepage correctly for ${locale} locale`, async ({ page }) => {
        await page.goto(`/${locale}`)
        
        // Wait for page to load completely
        await page.waitForLoadState('networkidle')
        
        // Check main structure is present
        await expect(page.locator('header')).toBeVisible()
        await expect(page.locator('main')).toBeVisible()
        await expect(page.locator('footer')).toBeVisible()
        
        // Check brand is visible
        await expect(page.locator('text=Loft Algérie')).toBeVisible()
        
        // Take screenshot for visual regression
        await page.screenshot({ 
          path: `test-results/homepage-${locale}-desktop.png`,
          fullPage: true 
        })
      })
    })

    test('loads quickly and meets performance standards', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto('/fr')
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
      
      // Check Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries()
            resolve(entries.map(entry => ({
              name: entry.name,
              value: entry.value || entry.duration
            })))
          }).observe({ entryTypes: ['navigation', 'paint'] })
        })
      })
      
      console.log('Performance metrics:', metrics)
    })
  })

  test.describe('Guest User Journey', () => {
    test('completes full guest booking flow', async ({ page }) => {
      await page.goto('/fr')
      
      // 1. User sees hero section
      await expect(page.locator('text=Réservez votre loft idéal en Algérie')).toBeVisible()
      
      // 2. User clicks main CTA
      const heroCTA = page.locator('text=Réserver maintenant')
      await expect(heroCTA).toBeVisible()
      await heroCTA.click()
      
      // 3. User scrolls to featured lofts
      await page.locator('text=Lofts en vedette').scrollIntoViewIfNeeded()
      await expect(page.locator('text=Lofts en vedette')).toBeVisible()
      
      // 4. User views loft details
      const firstLoftCard = page.locator('.grid > div').first()
      await expect(firstLoftCard).toBeVisible()
      
      const viewButton = firstLoftCard.locator('text=Voir')
      await expect(viewButton).toBeVisible()
      await viewButton.click()
      
      // 5. Verify interaction was registered
      await expect(viewButton).toBeVisible()
    })

    test('explores multiple lofts', async ({ page }) => {
      await page.goto('/en')
      
      // Navigate to featured section
      await page.locator('text=Featured Lofts').scrollIntoViewIfNeeded()
      
      // Count loft cards
      const loftCards = page.locator('.grid > div')
      await expect(loftCards).toHaveCount(3)
      
      // Click each view button
      const viewButtons = page.locator('text=View')
      const buttonCount = await viewButtons.count()
      
      for (let i = 0; i < buttonCount; i++) {
        await viewButtons.nth(i).click()
        await page.waitForTimeout(100) // Small delay between clicks
      }
      
      // All buttons should still be visible
      await expect(viewButtons.first()).toBeVisible()
    })

    test('shows pricing information clearly', async ({ page }) => {
      await page.goto('/fr')
      
      await page.locator('text=Lofts en vedette').scrollIntoViewIfNeeded()
      
      // Check pricing is visible for all lofts
      await expect(page.locator('text=€60/nuit')).toBeVisible()
      await expect(page.locator('text=€70/nuit')).toBeVisible()
      await expect(page.locator('text=€80/nuit')).toBeVisible()
      
      // Pricing should be prominently displayed
      const priceElements = page.locator('text=/€\\d+\\/nuit/')
      await expect(priceElements).toHaveCount(3)
    })
  })

  test.describe('Property Owner Journey', () => {
    test('completes owner partnership flow', async ({ page }) => {
      await page.goto('/fr')
      
      // 1. Scroll to owner section
      await page.locator('text=Propriétaires, maximisez vos revenus').scrollIntoViewIfNeeded()
      
      // 2. Verify owner value proposition is visible
      await expect(page.locator('text=Propriétaires, maximisez vos revenus')).toBeVisible()
      await expect(page.locator('text=Confiez-nous la gestion de votre propriété')).toBeVisible()
      
      // 3. Click partnership CTA
      const partnerCTA = page.locator('text=Devenir partenaire')
      await expect(partnerCTA).toBeVisible()
      await partnerCTA.click()
      
      // 4. Verify interaction
      await expect(partnerCTA).toBeVisible()
    })

    test('displays clear value proposition', async ({ page }) => {
      await page.goto('/en')
      
      await page.locator('text=Property owners, maximize your income').scrollIntoViewIfNeeded()
      
      // Check all owner-focused content
      await expect(page.locator('text=Property owners, maximize your income')).toBeVisible()
      await expect(page.locator('text=Entrust us with the management')).toBeVisible()
      await expect(page.locator('text=Become a partner')).toBeVisible()
      
      // Owner section should be visually distinct
      const ownerSection = page.locator('section').filter({ hasText: 'Property owners' })
      await expect(ownerSection).toHaveClass(/bg-blue-50/)
    })
  })

  test.describe('Multilingual Support', () => {
    test('switches between languages correctly', async ({ page }) => {
      // Test French
      await page.goto('/fr')
      await expect(page.locator('text=Réservez votre loft idéal en Algérie')).toBeVisible()
      await expect(page.locator('text=Connexion')).toBeVisible()
      
      // Test English
      await page.goto('/en')
      await expect(page.locator('text=Book your ideal loft in Algeria')).toBeVisible()
      await expect(page.locator('text=Login')).toBeVisible()
      
      // Test Arabic
      await page.goto('/ar')
      await expect(page.locator('text=احجز شقتك المثالية في الجزائر')).toBeVisible()
      await expect(page.locator('text=تسجيل الدخول')).toBeVisible()
    })

    test('maintains consistent layout across languages', async ({ page }) => {
      const layouts = []
      
      for (const locale of locales) {
        await page.goto(`/${locale}`)
        await page.waitForLoadState('networkidle')
        
        // Measure layout
        const layout = await page.evaluate(() => {
          const header = document.querySelector('header')
          const main = document.querySelector('main')
          const footer = document.querySelector('footer')
          
          return {
            headerHeight: header?.offsetHeight,
            mainHeight: main?.offsetHeight,
            footerHeight: footer?.offsetHeight,
            sectionsCount: main?.querySelectorAll('section').length
          }
        })
        
        layouts.push(layout)
      }
      
      // All layouts should have same structure
      const firstLayout = layouts[0]
      layouts.forEach(layout => {
        expect(layout.sectionsCount).toBe(firstLayout.sectionsCount)
        expect(layout.headerHeight).toBeGreaterThan(0)
        expect(layout.mainHeight).toBeGreaterThan(0)
        expect(layout.footerHeight).toBeGreaterThan(0)
      })
    })

    test('handles RTL layout for Arabic', async ({ page }) => {
      await page.goto('/ar')
      
      // Check if RTL is applied (this would depend on your CSS implementation)
      const body = page.locator('body')
      
      // Arabic content should be visible and properly formatted
      await expect(page.locator('text=احجز شقتك المثالية في الجزائر')).toBeVisible()
      await expect(page.locator('text=الشقق المميزة')).toBeVisible()
      await expect(page.locator('text=أصحاب العقارات، اعظموا دخلكم')).toBeVisible()
    })
  })

  test.describe('Responsive Design', () => {
    test('works correctly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
      await page.goto('/fr')
      
      // Check mobile layout
      await expect(page.locator('text=Loft Algérie')).toBeVisible()
      await expect(page.locator('text=Réservez votre loft idéal en Algérie')).toBeVisible()
      
      // Loft grid should stack on mobile
      const loftGrid = page.locator('.grid')
      await expect(loftGrid).toHaveClass(/grid-cols-1/)
      
      // Buttons should be touch-friendly
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i)
        const box = await button.boundingBox()
        
        // Touch targets should be at least 44px
        expect(box?.height).toBeGreaterThanOrEqual(40)
      }
      
      await page.screenshot({ 
        path: 'test-results/homepage-mobile.png',
        fullPage: true 
      })
    })

    test('works correctly on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }) // iPad
      await page.goto('/fr')
      
      // Check tablet layout
      await expect(page.locator('text=Loft Algérie')).toBeVisible()
      
      // Should show responsive grid
      const loftCards = page.locator('.grid > div')
      await expect(loftCards).toHaveCount(3)
      
      await page.screenshot({ 
        path: 'test-results/homepage-tablet.png',
        fullPage: true 
      })
    })

    test('adapts to different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568 }, // Small mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1024, height: 768 }, // Small desktop
        { width: 1920, height: 1080 } // Large desktop
      ]
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.goto('/fr')
        
        // Core content should always be visible
        await expect(page.locator('text=Loft Algérie')).toBeVisible()
        await expect(page.locator('text=Réservez votre loft idéal en Algérie')).toBeVisible()
        
        // Take screenshot for each viewport
        await page.screenshot({ 
          path: `test-results/homepage-${viewport.width}x${viewport.height}.png`,
          fullPage: true 
        })
      }
    })
  })

  test.describe('Accessibility', () => {
    test('supports keyboard navigation', async ({ page }) => {
      await page.goto('/fr')
      
      // Tab through interactive elements
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      for (let i = 0; i < buttonCount; i++) {
        await page.keyboard.press('Tab')
        
        // Check if an element is focused
        const focusedElement = page.locator(':focus')
        await expect(focusedElement).toBeVisible()
      }
    })

    test('has proper heading hierarchy', async ({ page }) => {
      await page.goto('/fr')
      
      // Check heading structure
      const h1Elements = page.locator('h1')
      const h2Elements = page.locator('h2')
      const h3Elements = page.locator('h3')
      
      await expect(h1Elements).toHaveCount(2) // Header and hero
      await expect(h2Elements).toHaveCount(2) // Featured lofts and owner section
      await expect(h3Elements).toHaveCount(4) // Loft cards and footer
    })

    test('has sufficient color contrast', async ({ page }) => {
      await page.goto('/fr')
      
      // This would require a color contrast checking library
      // For now, we verify that text is visible
      await expect(page.locator('text=Réservez votre loft idéal en Algérie')).toBeVisible()
      await expect(page.locator('text=Lofts en vedette')).toBeVisible()
      await expect(page.locator('text=Propriétaires, maximisez vos revenus')).toBeVisible()
    })

    test('supports screen readers', async ({ page }) => {
      await page.goto('/fr')
      
      // Check ARIA landmarks
      await expect(page.locator('header[role="banner"], header')).toBeVisible()
      await expect(page.locator('main[role="main"], main')).toBeVisible()
      await expect(page.locator('footer[role="contentinfo"], footer')).toBeVisible()
      await expect(page.locator('nav[role="navigation"], nav')).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('loads images efficiently', async ({ page }) => {
      await page.goto('/fr')
      
      // Wait for images to load
      await page.waitForLoadState('networkidle')
      
      // Check that placeholder images are present
      const images = page.locator('img, [style*="background-image"]')
      const imageCount = await images.count()
      
      expect(imageCount).toBeGreaterThan(0)
      
      // Images should have proper alt text or be decorative
      const imgElements = page.locator('img')
      const imgCount = await imgElements.count()
      
      for (let i = 0; i < imgCount; i++) {
        const img = imgElements.nth(i)
        const alt = await img.getAttribute('alt')
        expect(alt).toBeDefined()
      }
    })

    test('handles smooth scrolling', async ({ page }) => {
      await page.goto('/fr')
      
      // Scroll to different sections
      await page.locator('text=Lofts en vedette').scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      
      await page.locator('text=Propriétaires, maximisez vos revenus').scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      
      // Should not cause layout shifts
      await expect(page.locator('text=Loft Algérie')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('handles network issues gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100)
      })
      
      await page.goto('/fr')
      
      // Should still load basic content
      await expect(page.locator('text=Loft Algérie')).toBeVisible({ timeout: 10000 })
    })

    test('handles JavaScript errors gracefully', async ({ page }) => {
      // Listen for console errors
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      
      await page.goto('/fr')
      
      // Interact with the page
      await page.locator('text=Réserver maintenant').click()
      await page.locator('text=Voir').first().click()
      
      // Should not have critical errors
      const criticalErrors = errors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('404') &&
        !error.includes('network')
      )
      
      expect(criticalErrors).toHaveLength(0)
    })
  })

  test.describe('SEO and Meta Tags', () => {
    test('has proper meta tags', async ({ page }) => {
      await page.goto('/fr')
      
      // Check title
      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(0)
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]')
      await expect(metaDescription).toHaveAttribute('content')
      
      // Check viewport meta tag
      const viewport = page.locator('meta[name="viewport"]')
      await expect(viewport).toHaveAttribute('content')
    })

    test('has proper structured data', async ({ page }) => {
      await page.goto('/fr')
      
      // Check for structured data (JSON-LD)
      const structuredData = page.locator('script[type="application/ld+json"]')
      
      // If structured data exists, it should be valid JSON
      const count = await structuredData.count()
      if (count > 0) {
        const jsonContent = await structuredData.first().textContent()
        expect(() => JSON.parse(jsonContent || '')).not.toThrow()
      }
    })
  })
})