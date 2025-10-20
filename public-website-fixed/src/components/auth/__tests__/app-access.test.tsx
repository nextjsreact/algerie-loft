/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import { AppAccessClient } from '../app-access-client';
import { useSession } from '@/hooks/use-session';
import { NextIntlClientProvider } from 'next-intl';

// Mock the useSession hook
jest.mock('@/hooks/use-session');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

// Mock translations
const messages = {
  'app.access.title': 'Application Access',
  'common.loading': 'Loading...',
  'common.retry': 'Retry',
  'app.access.login.button': 'Log In',
};

const renderWithIntl = (component: React.ReactElement) => {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {component}
    </NextIntlClientProvider>
  );
};

describe('AppAccessClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      session: null,
      isLoading: true,
      error: null,
      checkSession: jest.fn(),
      logout: jest.fn(),
      transitionToApp: jest.fn(),
    });

    renderWithIntl(<AppAccessClient locale="en" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      session: null,
      isLoading: false,
      error: 'Connection failed',
      checkSession: jest.fn(),
      logout: jest.fn(),
      transitionToApp: jest.fn(),
    });

    renderWithIntl(<AppAccessClient locale="en" />);

    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows login redirect when not authenticated', () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: false,
      session: null,
      isLoading: false,
      error: null,
      checkSession: jest.fn(),
      logout: jest.fn(),
      transitionToApp: jest.fn(),
    });

    renderWithIntl(<AppAccessClient locale="en" />);

    expect(screen.getByText('Log In')).toBeInTheDocument();
  });

  it('shows authenticated access when user is logged in', () => {
    const mockSession = {
      user: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'admin',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
      },
      token: 'mock-token',
    };

    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      session: mockSession,
      isLoading: false,
      error: null,
      checkSession: jest.fn(),
      logout: jest.fn(),
      transitionToApp: jest.fn(),
    });

    renderWithIntl(<AppAccessClient locale="en" />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});