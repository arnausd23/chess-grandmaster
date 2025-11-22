import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GrandmasterList from '../List';
import { useGrandmasters } from '../../../hooks/useGrandmasters';
import { usePlayerProfile } from '../../../hooks/usePlayerProfile';

// Mock the hooks
jest.mock('../../../hooks/useGrandmasters');
jest.mock('../../../hooks/usePlayerProfile');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
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

describe('GrandmasterList', () => {
  const mockGrandmasters = ['player1', 'player2', 'player3', 'player4', 'player5'];

  beforeEach(() => {
    jest.clearAllMocks();
    (useGrandmasters as jest.Mock).mockReturnValue({
      data: mockGrandmasters,
      isLoading: false,
      error: null,
    });
    (usePlayerProfile as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  it('should display the title', () => {
    render(<GrandmasterList />, { wrapper: createWrapper() });
    expect(screen.getByText('Chess Grandmasters')).toBeInTheDocument();
  });

  it('should display the count of grandmasters', () => {
    render(<GrandmasterList />, { wrapper: createWrapper() });
    expect(screen.getByText(/Showing 5 of 5 grandmasters/i)).toBeInTheDocument();
  });

  it('should display all grandmaster usernames', () => {
    render(<GrandmasterList />, { wrapper: createWrapper() });
    mockGrandmasters.forEach((username) => {
      expect(screen.getByText(username)).toBeInTheDocument();
    });
  });

  it('should display "Grandmaster" label for each player', () => {
    render(<GrandmasterList />, { wrapper: createWrapper() });
    const grandmasterLabels = screen.getAllByText('Grandmaster');
    expect(grandmasterLabels.length).toBeGreaterThan(0);
  });

  it('should display "View Profile" buttons', () => {
    render(<GrandmasterList />, { wrapper: createWrapper() });
    const viewProfileButtons = screen.getAllByText('View Profile');
    expect(viewProfileButtons.length).toBe(mockGrandmasters.length);
  });

  it('should show loading skeleton when loading', () => {
    (useGrandmasters as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    render(<GrandmasterList />, { wrapper: createWrapper() });
    expect(screen.queryByText('Chess Grandmasters')).not.toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    (useGrandmasters as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Failed to load'),
    });

    render(<GrandmasterList />, { wrapper: createWrapper() });
    expect(screen.getByText(/Error loading grandmasters/i)).toBeInTheDocument();
  });

  it('should show "No grandmasters found" when list is empty', () => {
    (useGrandmasters as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<GrandmasterList />, { wrapper: createWrapper() });
    expect(screen.getByText(/No grandmasters found/i)).toBeInTheDocument();
  });

  it('should display ranks for grandmasters', () => {
    render(<GrandmasterList />, { wrapper: createWrapper() });

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should limit displayed grandmasters to initial count', () => {
    const manyGrandmasters = Array.from({ length: 100 }, (_, i) => `player${i + 1}`);
    (useGrandmasters as jest.Mock).mockReturnValue({
      data: manyGrandmasters,
      isLoading: false,
      error: null,
    });

    render(<GrandmasterList />, { wrapper: createWrapper() });
    expect(screen.getByText(/Showing 50 of 100 grandmasters/i)).toBeInTheDocument();
  });
});

