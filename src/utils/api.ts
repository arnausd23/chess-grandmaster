import type { TitledPlayersResponse, PlayerProfile } from '../types/chess';
import { requestQueue } from './requestQueue';
import { retryWithBackoff, RateLimitError, RetryError } from './retryWithBackoff';

const API_BASE_URL = 'https://api.chess.com/pub';

async function fetchWithRateLimit(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return requestQueue.add(() =>
    retryWithBackoff(
      () => fetch(url, options),
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      }
    )
  );
}

export async function fetchGrandmasters(): Promise<string[]> {
  try {
    const response = await fetchWithRateLimit(`${API_BASE_URL}/titled/GM`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch grandmasters: ${response.statusText}`);
    }
    
    const data: TitledPlayersResponse | string[] = await response.json();
    
    if (Array.isArray(data)) {
      return data;
    }
    return data.players || [];
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error('Rate limit exceeded when fetching grandmasters:', error);
      throw new Error(
        `Chess.com API rate limit exceeded. Please try again in a few moments.`
      );
    }
    
    if (error instanceof RetryError) {
      console.error('Failed after retries when fetching grandmasters:', error);
      throw new Error(
        `Failed to fetch grandmasters after ${error.attempts} attempts. Please check your connection.`
      );
    }
    
    console.error('Error fetching grandmasters:', error);
    throw error;
  }
}

export async function fetchPlayerProfile(username: string): Promise<PlayerProfile> {
  try {
    const response = await fetchWithRateLimit(
      `${API_BASE_URL}/player/${username}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch player profile: ${response.statusText}`);
    }
    
    const data: PlayerProfile = await response.json();
    return data;
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error(`Rate limit exceeded for player ${username}:`, error);
      throw new Error(
        `Chess.com API rate limit exceeded. Please try again in a few moments.`
      );
    }
    
    if (error instanceof RetryError) {
      console.error(`Failed after retries for player ${username}:`, error);
      throw new Error(
        `Failed to fetch profile for ${username} after ${error.attempts} attempts.`
      );
    }
    
    console.error(`Error fetching player profile for ${username}:`, error);
    throw error;
  }
}

export function getQueueStatus() {
  return {
    queueSize: requestQueue.getQueueSize(),
    runningRequests: requestQueue.getRunningCount(),
  };
}

