import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { useLastOnline } from '../../hooks/useLastOnline';
import { BLANK_IMAGE, handleImageError } from '../../utils/imageUtils';
import { SkeletonProfile } from '../Skeleton';

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { data: profile, isLoading, error } = usePlayerProfile(username || '');
  const lastOnlineTime = useLastOnline(profile?.last_online || 0);

  if (isLoading) {
    return <SkeletonProfile />;
  }

  if (error || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">
          Error loading profile. Please try again later.
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 text-white rounded-lg transition-colors font-medium bg-button-primary hover:bg-button-primary-hover"
        >
          Back to List
        </button>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/')}
        className="mb-6 px-4 py-2 text-white rounded-lg transition-colors font-medium bg-button-primary hover:bg-button-primary-hover"
      >
        ← Back to List
      </button>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <img
              src={profile.avatar || BLANK_IMAGE}
              alt={profile.username}
              className="w-32 h-32 rounded-full border-4 border-teal-500 object-cover"
              onError={handleImageError}
            />
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{profile.username}</h1>
            {profile.name && (
              <p className="text-xl text-gray-600 mb-4">{profile.name}</p>
            )}
            
            <div className="space-y-4">
              {profile.title && (
                <div>
                  <span className="font-semibold text-gray-700">Title: </span>
                  <span className="text-gray-600">{profile.title}</span>
                </div>
              )}

              {profile.location && (
                <div>
                  <span className="font-semibold text-gray-700">Location: </span>
                  <span className="text-gray-600">{profile.location}</span>
                </div>
              )}

              <div>
                <span className="font-semibold text-gray-700">Followers: </span>
                <span className="text-gray-600">{profile.followers.toLocaleString()}</span>
              </div>

              {profile.joined && (
                <div>
                  <span className="font-semibold text-gray-700">Joined: </span>
                  <span className="text-gray-600">{formatDate(profile.joined)}</span>
                </div>
              )}

              {profile.last_online && (
                <div>
                  <span className="font-semibold text-gray-700">Last Online: </span>
                  <span className="text-gray-600 font-mono text-lg">{lastOnlineTime}</span>
                  <span className="text-gray-500 text-sm ml-2">(HH:MM:SS)</span>
                </div>
              )}

              {profile.status && (
                <div>
                  <span className="font-semibold text-gray-700">Status: </span>
                  <span className="text-gray-600">{profile.status}</span>
                </div>
              )}

              {profile.verified && (
                <div className="inline-block px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium">
                  ✓ Verified
                </div>
              )}

              {profile.is_streamer && (
                <div className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium ml-2">
                  📺 Streamer
                </div>
              )}
            </div>

            {profile.url && (
              <div className="mt-6">
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-white rounded-lg transition-colors font-medium inline-block underline bg-button-primary hover:bg-button-primary-hover"
                >
                  View on Chess.com →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

