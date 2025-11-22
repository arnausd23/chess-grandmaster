import { useQuery } from '@tanstack/react-query';
import { fetchGrandmasters } from '../utils/api';

export function useGrandmasters() {
  return useQuery({
    queryKey: ['grandmasters'],
    queryFn: fetchGrandmasters,
    staleTime: 1000 * 60 * 60, 
    gcTime: 1000 * 60 * 60 * 24, 
  });
}

