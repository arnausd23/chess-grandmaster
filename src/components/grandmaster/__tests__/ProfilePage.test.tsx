import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfilePage from '../ProfilePage';
import { usePlayerProfile } from '../../../hooks/usePlayerProfile';
import { useLastOnline } from '../../../hooks/useLastOnline';
import { useCountry } from '../../../hooks/useCountry';

// Mock the hooks
jest.mock('../../../hooks/usePlayerProfile');
jest.mock('../../../hooks/useLastOnline');
jest.mock('../../../hooks/useCountry');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ username: 'testplayer' }),
  useNavigate: () => jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ProfilePage', () => {
  const mockProfile = {
    player_id: 123,
    username: 'testplayer',
    url: 'https://www.chess.com/member/testplayer',
    name: 'Test Player',
    title: 'GM',
    followers: 1000,
    country: 'https://api.chess.com/pub/country/US',
    location: 'New York',
    last_online: Math.floor(Date.now() / 1000) - 3600,
    joined: 1234567890,
    is_streamer: false,
    verified: true,
    avatar: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePlayerProfile as jest.Mock).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
    });
    (useLastOnline as jest.Mock).mockReturnValue('01:00:00');
    (useCountry as jest.Mock).mockReturnValue({
      data: { name: 'United States', code: 'US' },
      isLoading: false,
    });
  });

  it('should display profile username', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('testplayer')).toBeInTheDocument();
  });

  it('should display profile name when available', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Test Player')).toBeInTheDocument();
  });

  it('should display title when available', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('GM')).toBeInTheDocument();
  });

  it('should display last online time', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Last Online')).toBeInTheDocument();
    expect(screen.getByText('01:00:00')).toBeInTheDocument();
  });

  it('should display followers count', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Followers')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('should display location when available', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
  });

  it('should display country when available', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
  });

  it('should display joined date', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Joined')).toBeInTheDocument();
  });

  it('should display "View on Chess.com" link', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    const link = screen.getByText('View on Chess.com');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', mockProfile.url);
    expect(link.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('should display back button', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText('Back to List')).toBeInTheDocument();
  });

  it('should display profile avatar', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });
    const avatar = screen.getByAltText('testplayer');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', mockProfile.avatar);
  });

  it('should show loading skeleton when loading', () => {
    (usePlayerProfile as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(screen.queryByText('testplayer')).not.toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    (usePlayerProfile as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    render(<ProfilePage />, { wrapper: createWrapper() });
    expect(screen.getByText(/Error loading profile/i)).toBeInTheDocument();
    expect(screen.getByText('Back to List')).toBeInTheDocument();
  });
});

