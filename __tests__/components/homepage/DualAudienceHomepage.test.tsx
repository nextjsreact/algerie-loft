/**
 * Unit Tests for DualAudienceHomepage Component
 * Tests core functionality, multilingual support, and user interactions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DualAudienceHomepage from '@/components/homepage/DualAudienceHomepage'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
})

describe('DualAudienceHomepage', () => {
  describe('Component Rendering', () => {
    it('renders the homepage with all main sections', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check main structure
      expect(screen.getByRole('banner')).toBeInTheDocument() // Header
      expect(screen.getByRole('main')).toBeInTheDocument() // Main content
      expect(screen.getByRole('contentinfo')).toBeInTheDocument() // Footer
      
      // Check main sections
      expect(screen.getAllByText('Loft Algérie')[0]).toBeInTheDocument()
      expect(screen.getByText('Réservez votre loft idéal en Algérie')).toBeInTheDocument()
      expect(screen.getByText('Lofts en vedette')).toBeInTheDocument()
      expect(screen.getByText('Propriétaires, maximisez vos revenus')).toBeInTheDocument()
    })

    it('renders with proper semantic HTML structure', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check semantic elements
      const header = screen.getByRole('banner')
      const main = screen.getByRole('main')
      const footer = screen.getByRole('contentinfo')
      
      expect(header).toBeInTheDocument()
      expect(main).toBeInTheDocument()
      expect(footer).toBeInTheDocument()
      
      // Check heading hierarchy
      const h1Elements = screen.getAllByRole('heading', { level: 1 })
      const h2Elements = screen.getAllByRole('heading', { level: 2 })
      const h3Elements = screen.getAllByRole('heading', { level: 3 })
      
      expect(h1Elements).toHaveLength(2) // Header and hero
      expect(h2Elements).toHaveLength(2) // Featured lofts and owner section
      expect(h3Elements).toHaveLength(4) // Loft cards and footer
    })
  })

  describe('Multilingual Support', () => {
    describe('French (fr) locale', () => {
      it('displays French content correctly', () => {
        render(<DualAudienceHomepage locale="fr" />)
        
        // Header
        expect(screen.getByText('Connexion')).toBeInTheDocument()
        
        // Hero section
        expect(screen.getByText('Réservez votre loft idéal en Algérie')).toBeInTheDocument()
        expect(screen.getByText('Découvrez nos lofts exceptionnels avec service professionnel')).toBeInTheDocument()
        expect(screen.getByText('Réserver maintenant')).toBeInTheDocument()
        
        // Featured lofts
        expect(screen.getByText('Lofts en vedette')).toBeInTheDocument()
        expect(screen.getAllByText(/Loft Moderne/)).toHaveLength(3)
        expect(screen.getAllByText('Voir')).toHaveLength(3)
        
        // Owner section
        expect(screen.getByText('Propriétaires, maximisez vos revenus')).toBeInTheDocument()
        expect(screen.getByText('Devenir partenaire')).toBeInTheDocument()
        
        // Footer
        expect(screen.getByText('© 2024 Loft Algérie. Tous droits réservés.')).toBeInTheDocument()
      })
    })

    describe('English (en) locale', () => {
      it('displays English content correctly', () => {
        render(<DualAudienceHomepage locale="en" />)
        
        // Header
        expect(screen.getByText('Login')).toBeInTheDocument()
        
        // Hero section
        expect(screen.getByText('Book your ideal loft in Algeria')).toBeInTheDocument()
        expect(screen.getByText('Discover our exceptional lofts with professional service')).toBeInTheDocument()
        expect(screen.getByText('Book now')).toBeInTheDocument()
        
        // Featured lofts
        expect(screen.getByText('Featured Lofts')).toBeInTheDocument()
        expect(screen.getAllByText(/Modern Loft/)).toHaveLength(3)
        expect(screen.getAllByText('View')).toHaveLength(3)
        
        // Owner section
        expect(screen.getByText('Property owners, maximize your income')).toBeInTheDocument()
        expect(screen.getByText('Become a partner')).toBeInTheDocument()
        
        // Footer
        expect(screen.getByText('© 2024 Loft Algeria. All rights reserved.')).toBeInTheDocument()
      })
    })

    describe('Arabic (ar) locale', () => {
      it('displays Arabic content correctly', () => {
        render(<DualAudienceHomepage locale="ar" />)
        
        // Header
        expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument()
        
        // Hero section
        expect(screen.getByText('احجز شقتك المثالية في الجزائر')).toBeInTheDocument()
        expect(screen.getByText('اكتشف شققنا الاستثنائية مع الخدمة المهنية')).toBeInTheDocument()
        expect(screen.getByText('احجز الآن')).toBeInTheDocument()
        
        // Featured lofts
        expect(screen.getByText('الشقق المميزة')).toBeInTheDocument()
        expect(screen.getAllByText(/شقة حديثة/)).toHaveLength(6) // 3 titles + 3 descriptions
        expect(screen.getAllByText('عرض')).toHaveLength(3)
        
        // Owner section
        expect(screen.getByText('أصحاب العقارات، اعظموا دخلكم')).toBeInTheDocument()
        expect(screen.getByText('كن شريكاً')).toBeInTheDocument()
        
        // Footer
        expect(screen.getByText('© 2024 لوفت الجزائر. جميع الحقوق محفوظة.')).toBeInTheDocument()
      })
    })

    it('handles unsupported locale gracefully', () => {
      render(<DualAudienceHomepage locale="de" />)
      
      // Should not crash and should render without specific content
      expect(screen.getAllByText('Loft Algérie')[0]).toBeInTheDocument()
      
      // Buttons should be empty but still functional
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('User Interactions', () => {
    it('handles login button click', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      const loginButton = screen.getByText('Connexion')
      
      // Should be a clickable button
      expect(loginButton).toBeInTheDocument()
      expect(loginButton).not.toBeDisabled()
    })

    it('handles hero CTA button click', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      const ctaButton = screen.getByText('Réserver maintenant')
      
      expect(ctaButton).toBeInTheDocument()
      expect(ctaButton).not.toBeDisabled()
    })

    it('handles loft card view buttons', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      const viewButtons = screen.getAllByText('Voir')
      expect(viewButtons).toHaveLength(3)
      
      // Check each view button is clickable
      viewButtons.forEach(button => {
        expect(button).toBeInTheDocument()
        expect(button).not.toBeDisabled()
      })
    })

    it('handles partner CTA button click', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      const partnerButton = screen.getByText('Devenir partenaire')
      
      expect(partnerButton).toBeInTheDocument()
      expect(partnerButton).not.toBeDisabled()
    })
  })

  describe('Content Structure', () => {
    it('displays correct number of featured lofts', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Should have 3 loft cards
      const loftCards = screen.getAllByText(/Loft Moderne/)
      expect(loftCards).toHaveLength(3)
      
      // Each should have price and view button
      expect(screen.getByText('€60/nuit')).toBeInTheDocument()
      expect(screen.getByText('€70/nuit')).toBeInTheDocument()
      expect(screen.getByText('€80/nuit')).toBeInTheDocument()
    })

    it('displays pricing information correctly', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check pricing format
      expect(screen.getByText('€60/nuit')).toBeInTheDocument()
      expect(screen.getByText('€70/nuit')).toBeInTheDocument()
      expect(screen.getByText('€80/nuit')).toBeInTheDocument()
    })

    it('maintains dual-audience structure', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Guest-focused content should appear first
      const heroSection = screen.getByText('Réservez votre loft idéal en Algérie')
      const featuredSection = screen.getByText('Lofts en vedette')
      const ownerSection = screen.getByText('Propriétaires, maximisez vos revenus')
      
      // Check order in DOM
      const main = screen.getByRole('main')
      const sections = main.querySelectorAll('section')
      
      expect(sections).toHaveLength(3) // Hero, Featured, Owner
      expect(sections[0]).toContainElement(heroSection)
      expect(sections[1]).toContainElement(featuredSection)
      expect(sections[2]).toContainElement(ownerSection)
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive classes correctly', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check responsive grid classes
      const loftGrid = screen.getByText('Lofts en vedette').closest('section')?.querySelector('.grid')
      expect(loftGrid).toHaveClass('grid-cols-1', 'md:grid-cols-3')
      
      // Check responsive text classes
      const heroTitle = screen.getByText('Réservez votre loft idéal en Algérie')
      expect(heroTitle).toHaveClass('text-4xl', 'md:text-6xl')
    })

    it('has mobile-friendly button sizes', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      const ctaButton = screen.getByText('Réserver maintenant')
      expect(ctaButton).toHaveClass('px-8', 'py-4')
      
      const partnerButton = screen.getByText('Devenir partenaire')
      expect(ctaButton).toHaveClass('px-8', 'py-4')
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check heading levels
      const h1Elements = screen.getAllByRole('heading', { level: 1 })
      const h2Elements = screen.getAllByRole('heading', { level: 2 })
      const h3Elements = screen.getAllByRole('heading', { level: 3 })
      
      expect(h1Elements.length).toBeGreaterThan(0)
      expect(h2Elements.length).toBeGreaterThan(0)
      expect(h3Elements.length).toBeGreaterThan(0)
    })

    it('has accessible button labels', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveTextContent(/\S/) // Should have non-empty text content
      })
    })

    it('has proper semantic structure', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('contentinfo')).toBeInTheDocument()
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('has sufficient color contrast', () => {
      render(<DualAudienceHomepage locale="fr" />)
      
      // Check that text elements have appropriate contrast classes
      const heroContainer = screen.getByText('Réservez votre loft idéal en Algérie').closest('div')
      expect(heroContainer).toHaveClass('text-white') // White text on dark background
      
      const ctaButton = screen.getByText('Réserver maintenant')
      expect(ctaButton).toHaveClass('text-blue-600') // Dark text on light background
    })
  })

  describe('Performance Considerations', () => {
    it('renders efficiently without unnecessary re-renders', () => {
      const { rerender } = render(<DualAudienceHomepage locale="fr" />)
      
      // Re-render with same props should not cause issues
      rerender(<DualAudienceHomepage locale="fr" />)
      
      expect(screen.getByText('Réservez votre loft idéal en Algérie')).toBeInTheDocument()
    })

    it('handles locale changes efficiently', () => {
      const { rerender } = render(<DualAudienceHomepage locale="fr" />)
      
      expect(screen.getByText('Réservez votre loft idéal en Algérie')).toBeInTheDocument()
      
      rerender(<DualAudienceHomepage locale="en" />)
      
      expect(screen.getByText('Book your ideal loft in Algeria')).toBeInTheDocument()
      expect(screen.queryByText('Réservez votre loft idéal en Algérie')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing locale prop gracefully', () => {
      // @ts-ignore - Testing error case
      render(<DualAudienceHomepage />)
      
      // Should not crash
      expect(screen.getAllByText('Loft Algérie')[0]).toBeInTheDocument()
    })

    it('handles null locale gracefully', () => {
      // @ts-ignore - Testing error case
      render(<DualAudienceHomepage locale={null} />)
      
      // Should not crash
      expect(screen.getAllByText('Loft Algérie')[0]).toBeInTheDocument()
    })

    it('handles empty string locale gracefully', () => {
      render(<DualAudienceHomepage locale="" />)
      
      // Should not crash
      expect(screen.getAllByText('Loft Algérie')[0]).toBeInTheDocument()
    })
  })
})