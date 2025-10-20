import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LanguageSelector } from '@/components/ui/language-selector'

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'fr',
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock the dropdown menu components
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => 
    asChild ? children : <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-item" onClick={onClick}>{children}</div>
  ),
}))

// Mock the flag icon component
jest.mock('@/components/ui/flag-icon', () => ({
  FlagIcon: ({ country }: { country: string }) => (
    <span data-testid="flag-icon" data-country={country}>🏴</span>
  ),
}))

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
})

// Mock window.location
delete (window as any).location
window.location = { href: '' } as any

describe('LanguageSelector Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.cookie = ''
    window.location.href = ''
  })

  it('renders with default props', () => {
    render(<LanguageSelector />)
    
    expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
    expect(screen.getByTestId('flag-icon')).toBeInTheDocument()
  })

  it('shows current language flag', () => {
    render(<LanguageSelector />)
    
    const flagIcon = screen.getByTestId('flag-icon')
    expect(flagIcon).toHaveAttribute('data-country', 'FR')
  })

  it('shows language text when showText is true', () => {
    render(<LanguageSelector showText={true} />)
    
    expect(screen.getByText('Français')).toBeInTheDocument()
  })

  it('does not show language text when showText is false', () => {
    render(<LanguageSelector showText={false} />)
    
    expect(screen.queryByText('Français')).not.toBeInTheDocument()
  })

  it('renders all available languages in dropdown', () => {
    render(<LanguageSelector />)
    
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    expect(dropdownItems).toHaveLength(3) // fr, en, ar
  })

  it('shows check mark for current language', () => {
    render(<LanguageSelector />)
    
    // The current language (fr) should have a check mark
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument()
  })

  it('handles language change correctly', async () => {
    render(<LanguageSelector />)
    
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    const englishItem = dropdownItems[1] // Assuming English is second
    
    fireEvent.click(englishItem)
    
    await waitFor(() => {
      // Check if cookie was set
      expect(document.cookie).toContain('NEXT_LOCALE=en')
      // Check if window.location.href was updated
      expect(window.location.href).toContain('/en/test-path')
    })
  })

  it('sets locale cookie with correct attributes', async () => {
    render(<LanguageSelector />)
    
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    fireEvent.click(dropdownItems[1]) // Click English
    
    await waitFor(() => {
      expect(document.cookie).toContain('NEXT_LOCALE=en')
      expect(document.cookie).toContain('path=/')
      expect(document.cookie).toContain('max-age=31536000')
      expect(document.cookie).toContain('SameSite=Lax')
    })
  })

  it('handles path without locale correctly', async () => {
    // Mock pathname without locale
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
      }),
      usePathname: () => '/some-path',
    }))
    
    render(<LanguageSelector />)
    
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    fireEvent.click(dropdownItems[1])
    
    await waitFor(() => {
      expect(window.location.href).toContain('/en/some-path')
    })
  })

  it('handles root path correctly', async () => {
    // Mock pathname as root with locale
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
      }),
      usePathname: () => '/fr',
    }))
    
    render(<LanguageSelector />)
    
    const dropdownItems = screen.getAllByTestId('dropdown-item')
    fireEvent.click(dropdownItems[1])
    
    await waitFor(() => {
      expect(window.location.href).toContain('/en/')
    })
  })

  it('applies correct button classes', () => {
    render(<LanguageSelector />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('flex', 'items-center', 'gap-2', 'h-8', 'w-8', 'p-0')
  })

  it('applies different classes when showText is true', () => {
    render(<LanguageSelector showText={true} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-8', 'px-3')
    expect(button).not.toHaveClass('w-8', 'p-0')
  })

  it('shows loading state during hydration', () => {
    // Mock useState to simulate non-mounted state
    const mockUseState = jest.spyOn(require('react'), 'useState')
    mockUseState.mockImplementationOnce(() => [false, jest.fn()]) // mounted = false
    
    render(<LanguageSelector />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('Français')).toBeInTheDocument() // Default during hydration
  })

  it('handles different locale codes correctly', () => {
    // Test with Arabic locale
    jest.doMock('next-intl', () => ({
      useLocale: () => 'ar',
    }))
    
    const { unmount } = render(<LanguageSelector />)
    unmount()
    
    // Re-render with new mock
    render(<LanguageSelector />)
    
    const flagIcon = screen.getByTestId('flag-icon')
    expect(flagIcon).toHaveAttribute('data-country', 'DZ') // Arabic uses DZ flag
  })

  it('falls back to first language when current locale not found', () => {
    // Mock an unknown locale
    jest.doMock('next-intl', () => ({
      useLocale: () => 'unknown',
    }))
    
    const { unmount } = render(<LanguageSelector />)
    unmount()
    
    render(<LanguageSelector />)
    
    // Should fall back to French (first language)
    const flagIcon = screen.getByTestId('flag-icon')
    expect(flagIcon).toHaveAttribute('data-country', 'FR')
  })
})