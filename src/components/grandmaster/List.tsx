import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGrandmasters } from '../../hooks/useGrandmasters';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import GrandmasterCard from './Card';
import { SkeletonCard } from '../Skeleton';

const INITIAL_DISPLAY_COUNT = 50;
const LOAD_MORE_COUNT = 50;

export default function GrandmasterList() {
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    setDisplayCount(INITIAL_DISPLAY_COUNT);
  }, [searchQuery]);

  const { data: grandmasters = [], isLoading, error } = useGrandmasters();

  const filteredGrandmasters = useMemo(() => {
    if (!searchQuery) {
      return grandmasters;
    }
    return grandmasters.filter((username) =>
      username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [grandmasters, searchQuery]);

  const displayedGrandmasters = useMemo(() => {
    return filteredGrandmasters.slice(0, displayCount);
  }, [filteredGrandmasters, displayCount]);

  const hasMore = filteredGrandmasters.length > displayCount;

  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setDisplayCount((prev) => prev + LOAD_MORE_COUNT);
        }
      },
      { rootMargin: '100px' }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading, isLoadingMore]);


  useEffect(() => {
    if (isLoadingMore && displayedGrandmasters.length > 0) {
      const timer = setTimeout(() => {
        setIsLoadingMore(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoadingMore, displayedGrandmasters.length]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="animate-pulse">
            <div className="h-9 bg-gray-300 rounded w-64 mb-2"></div>
            <div className="h-5 bg-gray-300 rounded w-48"></div>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">
          Error loading grandmasters. Please try again later.
        </div>
      </div>
    );
  }

  if (filteredGrandmasters.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-600">
          {searchQuery ? 'No grandmasters found matching your search.' : 'No grandmasters found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Chess Grandmasters</h2>
        <p className="text-gray-600">
          Showing {displayedGrandmasters.length} of {filteredGrandmasters.length} grandmasters
        </p>
      </div>

      <div className="space-y-4">
        {displayedGrandmasters.map((username, index) => {
          const actualRank = index + 1;
          return (
            <GrandmasterCardWithProfile
              key={username}
              username={username}
              rank={actualRank}
            />
          );
        })}
      </div>

      {hasMore && (
        <div ref={loadMoreRef} className="mt-8 text-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading more grandmasters...</span>
            </div>
          ) : (
            <div className="h-1"></div>
          )}
        </div>
      )}
    </div>
  );
}

// Component to fetch profile data for avatar only when visible
function GrandmasterCardWithProfile({
  username,
  rank,
}: {
  username: string;
  rank: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: profile } = usePlayerProfile(username, isVisible);

  useEffect(() => {
    const currentRef = cardRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(currentRef);

    return () => observer.disconnect();
  }, []);

  return (
    <GrandmasterCard 
      username={username} 
      rank={rank} 
      avatar={profile?.avatar}
      cardRef={cardRef}
      isVisible={isVisible}
    />
  );
}

