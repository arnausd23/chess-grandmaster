import { useQuery } from '@tanstack/react-query';
import { fetchGrandmasters } from '../utils/api';

export function useGrandmasters() {
  return useQuery({
    queryKey: ['grandmasters'],
    queryFn: fetchGrandmasters,
    staleTime: 1000 * 60 * 60, // 1 hour - data is considered fresh for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours (formerly cacheTime)
  });
}

