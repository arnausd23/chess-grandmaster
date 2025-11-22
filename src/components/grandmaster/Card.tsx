import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLANK_IMAGE, handleImageError } from '../../utils/imageUtils';

interface GrandmasterCardProps {
  username: string;
  rank: number;
  avatar?: string;
  cardRef?: React.RefObject<HTMLDivElement>;
  isVisible?: boolean;
}

export default function GrandmasterCard({ 
  username, 
  rank, 
  avatar,
  cardRef,
  isVisible: externalIsVisible 
}: GrandmasterCardProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(externalIsVisible || false);
  const internalCardRef = useRef<HTMLDivElement>(null);
  const ref = cardRef || internalCardRef;

  useEffect(() => {
    if (externalIsVisible !== undefined) {
      setIsVisible(externalIsVisible);
      return;
    }
  }, [externalIsVisible]);

  useEffect(() => {
    if (externalIsVisible !== undefined) {
      return;
    }

    const currentRef = ref.current;
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
      { rootMargin: '50px' }
    );

    observer.observe(currentRef);

    return () => observer.disconnect();
  }, [externalIsVisible]);

  const handleClick = () => {
    navigate(`/player/${username}`);
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center text-yellow-600">
          <img 
            src="/assets/images/first.png" 
            alt="First place" 
            className="h-9 w-auto object-contain"
          />
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center text-gray-400">
          <img 
            src="/assets/images/second.png" 
            alt="Second place" 
            className="h-9 w-auto object-contain"
          />
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center text-amber-600">
          <img 
            src="/assets/images/third.png" 
            alt="Third place" 
            className="h-9 w-auto object-contain"
          />
        </div>
      );
    }
    return <span className="text-2xl font-bold text-gray-700">{rank}</span>;
  };

  return (
    <div className="flex items-center gap-6">
      <div className="flex-shrink-0 w-16 text-center">{getRankDisplay(rank)}</div>
      <div
        ref={ref}
        onClick={handleClick}
        className="bg-white rounded-lg shadow-md w-full p-6 mb-4 cursor-pointer hover:shadow-xl hover:bg-gray-100 hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-gray-200 flex flex-col md:flex-row items-center gap-6"
      >

        <div className="flex-shrink-0">
          {isVisible ? (
            <img
              src={avatar || BLANK_IMAGE}
              alt={username}
              className="w-20 h-20 rounded-full border-2 border-gray-200 object-cover"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-20 h-20 rounded-full border-2 border-gray-200 bg-gray-100" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{username}</h3>
          <p className="text-sm text-gray-600 truncate">Grandmaster</p>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="px-4 py-2 text-white rounded-lg transition-colors font-medium bg-button-primary hover:bg-button-primary-hover"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
}

