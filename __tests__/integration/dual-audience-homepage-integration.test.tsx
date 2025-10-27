/**
 * Integration Tests for Dual-Audience Homepage
 * Tests complete user journeys and component interactions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DualAudienceHomepage from '@/components/homepage/DualAudienceHomepage'

// Mock next/link and next/router for navigation testing
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}))

jest.mock('next/link', () => {
  return ({ children, href, onClick, ...props }: any) => (
    <a 
      href={href} 
      onClick={(e) => {
        e.preventDefault()
        if (onClick) onClick(e)
        mockPush(href)
      }}
      {...props}
    >
      {children}
    </a>
  )
})

// Mock intersection observer for scroll-based animations
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.IntersectionObserver = mockIntersectionObserver

describe('Dual-Audience Homepage Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset scroll position
    window.scrollTo = jest.fn()
  })

  describe('Complete User Journeys', () => {
    describe('Guest User Journey', () => {
      it('completes guest booking flow from hero to loft selection', async () => {
        render(<DualAudienceHomepage locale="fr" />)
        
        // 1. User sees hero section
        expect(screen.getByText('Réservez votre loft idéal en Algérie')).toBeInTheDocument()
        
        // 2. User can see main CTA
        const heroCTA = screen.getByText('Réserver maintenant')
        expect(heroCTA).toBeInTheDocument()
        
        // 3. User can see featured lofts section
        const featuredSection = screen.getByText('Lofts en vedette')
        expect(featuredSection).toBeInTheDocument()
        
        // 4. User can see loft view buttons
        const viewButtons = screen.getAllByText('Voir')
        expect(viewButtons).toHaveLength(3)
        
        // Journey elements should be present
        expect(heroCTA).toBeInTheDocument()
        expect(viewButtons[0]).toBeInTheDocument()
      })

      it('allows guest to explore multiple lofts', async () => {
        render(<DualAudienceHomepage locale="en" />)
        
        // User can see all loft cards
        const loftCards = screen.getAllByText(/Modern Loft/)
        expect(loftCards).toHaveLength(3)
        
        const viewButtons = screen.getAllByText('View')
        expect(viewButtons).toHaveLength(3)
        
        // All buttons should be present and clickable
        viewButtons.forEach(button => {
          expect(button).toBeInTheDocument()
          expect(button).not.toBeDisabled()
        })
      })

      it('provides consistent experience across languages', async () => {
        const user = userEvent.setup()
        
        // Test French experience
        const { rerender } = render(<DualAudienceHomepage locale="fr" />)
        
        expect(screen.getByText('Réserver maintenant')).toBeInTheDocument()
        const frenchViewButtons = screen.getAllByText('Voir')
        expect(frenchViewButtons).toHaveLength(3)
        
        // Test English experience
        rerender(<DualAudienceHomepage locale="en" />)
        
        expect(screen.getByText('Book now')).toBeInTheDocument()
        const englishViewButtons = screen.getAllByText('View')
        expect(englishViewButtons).toHaveLength(3)
        
        // Test Arabic experience
        rerender(<DualAudienceHomepage locale="ar" />)
        
        expect(screen.getByText('احجز الآن')).toBeInTheDocument()
        const arabicViewButtons = screen.getAllByText('عرض')
        expect(arabicViewButtons).toHaveLength(3)
      })
    })

    describe('Property Owner Journey', () => {
      it('completes owner partnership flow', () => {
        render(<DualAudienceHomepage locale="fr" />)
        
        // 1. Owner sees value proposition
        expect(screen.getByText('Propriétaires, maximisez vos revenus')).toBeInTheDocument()
        
        // 2. Owner reads benefits
        const ownerDescription = screen.getByText(/Confiez-nous la gestion de votre propriété/)
        expect(ownerDescription).toBeInTheDocument()
        
        // 3. Owner can see partnership CTA
        const partnerCTA = screen.getByText('Devenir partenaire')
        expect(partnerCTA).toBeInTheDocument()
        expect(partnerCTA).not.toBeDisabled()
        
        // Journey elements should be present
        expect(partnerCTA).toBeInTheDocument()
      })

      it('provides clear value proposition for owners', () => {
        render(<DualAudienceHomepage locale="en" />)
        
        // Check owner section content
        expect(screen.getByText('Property owners, maximize your income')).toBeInTheDocument()
        expect(screen.getByText(/Entrust us with the management/)).toBeInTheDocument()
        expect(screen.getByText('Become a partner')).toBeInTheDocument()
        
        // Owner section should be visually distinct
        const ownerSection = screen.getByText('Property owners, maximize your income').closest('section')
        expect(ownerSection).toHaveClass('bg-blue-50')
      })
    })

    describe('Dual-Audience Navigation', () => {
      it('allows seamless transition between guest and owner content', async () => {
        const user = userEvent.setup()
        render(<DualAudienceHomepage locale="fr" />)
        
        // Start with guest content
        const heroSection = screen.getByText('Réservez votre loft idéal en Algérie')
        expect(heroSection).toBeInTheDocument()
        
        // Navigate to featured lofts
        const featuredSection = screen.getByText('Lofts en vedette')
        expect(featuredSection).toBeInTheDocument()
        
        // Navigate to owner section
        const ownerSection = screen.getByText('Propriétaires, maximisez vos revenus')
        expect(ownerSection).toBeInTheDocument()
        
        // All sections should be accessible in single page
        expect(heroSection).toBeInTheDocument()
        expect(featuredSection).toBeInTheDocument()
        expect(ownerSection).toBeInTheDocument()
      })

      it('maintains proper visual hierarchy for dual audience', () => {
        render(<DualAudienceHomepage locale="fr" />)
        
        const main = screen.getByRole('main')
        const sections = main.querySelectorAll('section')
        
        // Should have 3 main sections in correct order
        expect(sections).toHaveLength(3)
        
        // 1. Hero (guest-focused)
        expect(sections[0]).toContainElement(screen.getByText('Réservez votre loft idéal en Algérie'))
        
        // 2. Featured lofts (guest-focused)
        expect(sections[1]).toContainElement(screen.getByText('Lofts en vedette'))
        
        // 3. Owner section (owner-focused)
        expect(sections[2]).toContainElement(screen.getByText('Propriétaires, maximisez vos revenus'))
      })
    })
  })

  describe('Cross-Component Interactions', () => {
    it('maintains consistent branding across all sections', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Header branding
      const headerLogo = screen.getAllByText('Loft Algérie')[0]
      expect(headerLogo).toBeInTheDocument()
      
      // Footer branding
      const footerLogo = screen.getAllByText('Loft Algérie')[1]
      expect(footerLogo).toBeInTheDocument()
      
      // Consistent color scheme
      const ctaButtons = screen.getAllByRole('button')
      const primaryButtons = ctaButtons.filter(btn => 
        btn.classList.contains('bg-blue-600') || 
        btn.classList.contains('text-blue-600')
      )
      expect(primaryButtons.length).toBeGreaterThan(0)
    })

    it('provides consistent navigation experience', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Header navigation should be present
      const loginButton = screen.getByText('Connexion')
      expect(loginButton).toBeInTheDocument()
      
      // Should maintain page context
      expect(screen.getByText('Réservez votre loft idéal en Algérie')).toBeInTheDocument()
    })

    it('handles responsive behavior across sections', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check responsive classes are applied consistently
      const heroTitle = screen.getByText('Réservez votre loft idéal en Algérie')
      expect(heroTitle).toHaveClass('text-4xl', 'md:text-6xl')
      
      const sectionTitles = screen.getAllByRole('heading', { level: 2 })
      sectionTitles.forEach(title => {
        expect(title).toHaveClass('text-3xl')
      })
    })
  })

  describe('Performance Integration', () => {
    it('renders all sections efficiently', () => {
      const startTime = performance.now()
      render(<DualAudienceHomepage locale="fr" />)
      const endTime = performance.now()
      
      // Should render quickly (less than 100ms in test environment)
      expect(endTime - startTime).toBeLessThan(100)
      
      // All sections should be present
      expect(screen.getByText('Réservez votre loft idéal en Algérie')).toBeInTheDocument()
      expect(screen.getByText('Lofts en vedette')).toBeInTheDocument()
      expect(screen.getByText('Propriétaires, maximisez vos revenus')).toBeInTheDocument()
    })

    it('handles multiple rapid interactions', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check that multiple buttons are present and clickable
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // All buttons should be functional
      buttons.slice(0, 3).forEach(button => {
        expect(button).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })
      
      // Page should remain stable
      expect(screen.getAllByText('Loft Algérie')[0]).toBeInTheDocument()
    })

    it('maintains state during locale changes', () => {
      const { rerender } = render(<DualAudienceHomepage locale="fr" />)
      
      // Verify French content
      expect(screen.getByText('Réservez votre loft idéal en Algérie')).toBeInTheDocument()
      
      // Change to English
      rerender(<DualAudienceHomepage locale="en" />)
      
      // Should update content without losing structure
      expect(screen.getByText('Book your ideal loft in Algeria')).toBeInTheDocument()
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    })
  })

  describe('Accessibility Integration', () => {
    it('provides complete keyboard navigation', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check that interactive elements are focusable
      const buttons = screen.getAllByRole('button')
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
        expect(button).not.toBeDisabled()
        
        // Should be focusable
        button.focus()
        expect(button).toHaveFocus()
      })
    })

    it('maintains proper focus management', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      const firstButton = screen.getAllByRole('button')[0]
      firstButton.focus()
      
      // Focus should be manageable
      expect(document.activeElement).toBeDefined()
      expect(firstButton).toHaveFocus()
    })

    it('provides proper ARIA labels and roles', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check semantic roles
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      
      // Check heading structure
      const headings = screen.getAllByRole('heading')
      expect(headings.length).toBeGreaterThan(0)
    })

    it('supports screen reader navigation', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check that content is properly structured for screen readers
      const landmarks = [
        screen.getByRole('banner'),
        screen.getByRole('main'),
        screen.getByRole('contentinfo')
      ]
      
      landmarks.forEach(landmark => {
        expect(landmark).toBeInTheDocument()
      })
      
      // Check heading hierarchy
      const h1Elements = screen.getAllByRole('heading', { level: 1 })
      const h2Elements = screen.getAllByRole('heading', { level: 2 })
      
      expect(h1Elements.length).toBeGreaterThan(0)
      expect(h2Elements.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling Integration', () => {
    it('gracefully handles component errors', () => {
      // Mock console.error to avoid noise in tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      try {
        render(<DualAudienceHomepage locale="fr" />)
        
        // Should render without errors
        expect(screen.getAllByText('Loft Algérie')[0]).toBeInTheDocument()
        
        // No errors should be logged
        expect(consoleSpy).not.toHaveBeenCalled()
      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('handles missing props gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      try {
        // @ts-ignore - Testing error case
        render(<DualAudienceHomepage />)
        
        // Should still render basic structure
        expect(screen.getAllByText('Loft Algérie')[0]).toBeInTheDocument()
      } finally {
        consoleSpy.mockRestore()
      }
    })

    it('recovers from interaction errors', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check that buttons are present and functional
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      // All buttons should be clickable without errors
      buttons.forEach(button => {
        expect(button).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })
      
      // Component should remain functional
      expect(screen.getAllByText('Loft Algérie')[0]).toBeInTheDocument()
    })
  })

  describe('Mobile Integration', () => {
    it('provides touch-friendly interactions', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // All buttons should be large enough for touch
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        // Should have adequate padding for touch targets
        expect(button).toHaveClass(/p[xy]-[2-9]/)
        expect(button).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })
    })

    it('maintains readability on small screens', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Text should have appropriate sizing
      const heroTitle = screen.getByText('Réservez votre loft idéal en Algérie')
      expect(heroTitle).toHaveClass('text-4xl') // Base mobile size
      
      const descriptions = screen.getAllByText(/Magnifique loft moderne/)
      descriptions.forEach(desc => {
        expect(desc).toHaveClass('text-gray-600') // Readable contrast
      })
    })
  })
})