import { useQuery } from '@tanstack/react-query';
import { fetchPlayerProfile } from '../utils/api';

export function usePlayerProfile(username: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['player', username],
    queryFn: () => fetchPlayerProfile(username),
    enabled: !!username && enabled,
    staleTime: 1000 * 60 * 60,  
    gcTime: 1000 * 60 * 60 * 24, 
  });
}

