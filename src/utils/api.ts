import type { TitledPlayersResponse, PlayerProfile } from '../types/chess';

const API_BASE_URL = 'https://api.chess.com/pub';

export async function fetchGrandmasters(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/titled/GM`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch grandmasters: ${response.statusText}`);
  }
  
  const data: TitledPlayersResponse | string[] = await response.json();
  
  if (Array.isArray(data)) {
    return data;
  }
  return data.players || [];
}

export async function fetchPlayerProfile(username: string): Promise<PlayerProfile> {
  const response = await fetch(`${API_BASE_URL}/player/${username}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch player profile: ${response.statusText}`);
  }
  
  const data: PlayerProfile = await response.json();
  return data;
}

