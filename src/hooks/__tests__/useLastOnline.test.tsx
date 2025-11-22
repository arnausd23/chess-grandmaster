import { renderHook, act } from '@testing-library/react';
import { useLastOnline } from '../useLastOnline';

describe('useLastOnline', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.clearAllTimers();
    });
    jest.useRealTimers();
  });

  it('should calculate time difference correctly', async () => {
    const now = Math.floor(Date.now() / 1000);
    const fiveMinutesAgo = now - 300; 

    const { result } = renderHook(() => useLastOnline(fiveMinutesAgo));

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve(); // Allow state updates to flush
    });

    expect(result.current).toBe('00:05:00');
  });

  it('should return 00:00:00 for zero timestamp', async () => {
    const { result } = renderHook(() => useLastOnline(0));

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current).toBe('00:00:00');
  });

  it('should return 00:00:00 for invalid timestamp', async () => {
    const { result } = renderHook(() => useLastOnline(undefined as any));

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current).toBe('00:00:00');
  });

  it('should return 00:00:00 for negative difference', async () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future

    const { result } = renderHook(() => useLastOnline(futureTimestamp));

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current).toBe('00:00:00');
  });

  it('should format time correctly with padding', async () => {
    const now = Math.floor(Date.now() / 1000);
    const oneHourTwoMinutesThreeSecondsAgo = now - (3600 + 123); // 1:02:03

    const { result } = renderHook(() =>
      useLastOnline(oneHourTwoMinutesThreeSecondsAgo)
    );

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current).toBe('01:02:03');
  });

  it('should format single digit values with padding', async () => {
    const now = Math.floor(Date.now() / 1000);
    const oneHourOneMinuteOneSecondAgo = now - (3600 + 61); // 1:01:01

    const { result } = renderHook(() =>
      useLastOnline(oneHourOneMinuteOneSecondAgo)
    );

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current).toBe('01:01:01');
  });

  it('should update every second', async () => {
    const now = Math.floor(Date.now() / 1000);
    const timestamp = now - 5;

    const { result } = renderHook(() => useLastOnline(timestamp));

    // Flush initial effect (just flush, don't run all timers to avoid infinite loop)
    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current).toBe('00:00:05');

    // Advance by 1 second to trigger interval
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current).toBe('00:00:06');

    // Advance by another second
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current).toBe('00:00:07');
  });

  it('should handle hours correctly', async () => {
    const now = Math.floor(Date.now() / 1000);
    const twoHoursAgo = now - 7200; // 2 hours = 7200 seconds

    const { result } = renderHook(() => useLastOnline(twoHoursAgo));

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current).toBe('02:00:00');
  });

  it('should handle minutes correctly', async () => {
    const now = Math.floor(Date.now() / 1000);
    const thirtyMinutesAgo = now - 1800; // 30 minutes = 1800 seconds

    const { result } = renderHook(() => useLastOnline(thirtyMinutesAgo));

    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current).toBe('00:30:00');
  });

  it('should cleanup interval on unmount', async () => {
    const now = Math.floor(Date.now() / 1000);
    const timestamp = now - 10;

    const { unmount } = renderHook(() => useLastOnline(timestamp));

    // Flush initial effect to set up interval
    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    await act(async () => {
      unmount();
      await Promise.resolve();
    });

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('should update when timestamp changes', async () => {
    const now = Math.floor(Date.now() / 1000);
    const firstTimestamp = now - 10;
    const secondTimestamp = now - 20;

    const { result, rerender } = renderHook(
      ({ timestamp }) => useLastOnline(timestamp),
      {
        initialProps: { timestamp: firstTimestamp },
      }
    );

    // Flush initial effect
    await act(async () => {
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current).toBe('00:00:10');

    await act(async () => {
      rerender({ timestamp: secondTimestamp });
      jest.advanceTimersByTime(0);
      await Promise.resolve();
    });

    expect(result.current).toBe('00:00:20');
  });
});

