import { useQuery } from '@tanstack/react-query';

interface CountryData {
  name: string;
  code?: string;
  [key: string]: unknown;
}

async function fetchCountry(countryUrl: string): Promise<CountryData> {
  const response = await fetch(countryUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch country data: ${response.statusText}`);
  }

  const data: CountryData = await response.json();
  return data;
}

export function useCountry(countryUrl: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['country', countryUrl],
    queryFn: () => fetchCountry(countryUrl!),
    enabled: !!countryUrl && enabled,
    staleTime: 1000 * 60 * 60 * 24, 
    gcTime: 1000 * 60 * 60 * 24 * 7, 
  });
}

