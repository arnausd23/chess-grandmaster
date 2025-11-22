import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { useLastOnline } from '../../hooks/useLastOnline';
import { useCountry } from '../../hooks/useCountry';
import { BLANK_IMAGE, handleImageError } from '../../utils/imageUtils';
import { SkeletonProfile } from '../Skeleton';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading, error } = usePlayerProfile(username || '');
  const lastOnlineTime = useLastOnline(profile?.last_online || 0);
  const { data: countryData } = useCountry(profile?.country, !!profile?.country);

  if (isLoading) {
    return <SkeletonProfile />;
  }

  if (error || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center text-red-600 mb-4">
          Error loading profile. Please try again later.
        </div>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium hover:bg-gray-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to List
        </button>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <button
        onClick={() => navigate('/')}
        className="mb-4 sm:mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium hover:bg-gray-300 flex items-center gap-2 w-fit"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to List
      </button>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8">
          {/* Profile Picture */}
          <div className="flex-shrink-0 flex justify-center sm:justify-start">
            <img
              src={profile.avatar || BLANK_IMAGE}
              alt={profile.username}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-teal-500 object-cover"
              onError={handleImageError}
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            {/* Username and Name */}
            <div className="mb-8 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
                {profile.username}
              </h1>
              {profile.name && (
                <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-2 sm:mb-3">
                  {profile.name}
                </p>
              )}
              <div className="flex items-center justify-center sm:justify-start gap-4 flex-wrap">
                {profile.title && (
                  <span className="inline-block px-3 py-1 bg-green-600 text-white rounded-md text-sm font-medium">
                    {profile.title}
                  </span>
                )}
                {profile.last_online && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-gray-500 font-bold">Last Online</p>
                    <p className="text-base text-gray-800 font-mono">{lastOnlineTime}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Info Grid - 2 columns on mobile */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Left Column */}
              <div className="space-y-3 sm:space-y-4">
                {profile.location && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1 font-bold">Location</p>
                    <p className="text-base text-gray-800">{profile.location}</p>
                  </div>
                )}
                {countryData?.name && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1 font-bold">Country</p>
                    <p className="text-base text-gray-800">{countryData.name}</p>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm text-gray-500 font-bold">Followers</p>
                  </div>
                  <p className="text-base text-gray-800 ml-6">{profile.followers.toLocaleString()}</p>
                </div>

                {profile.joined && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500 font-bold">Joined</p>
                    </div>
                    <p className="text-base text-gray-800 ml-6">{formatDate(profile.joined)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* View on Chess.com Button */}
            {profile.url && (
              <div className="flex justify-center sm:justify-start">
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg transition-colors font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  View on Chess.com
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

