'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserAuth } from '@/hooks/useUserAuth';
import { useShelves } from '@/hooks/useShelves';
import ShelfDisplay from '@/components/ShelfDisplay';
import { Shelf, Album } from '@/types/shelf';
import UserMenu from '@/components/UserMenu';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated, loading: authLoading, refreshUser } = useUserAuth();
  const { getUnifiedShelf, addAlbumToUnifiedShelf, shelves: hookShelves } = useShelves();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [albumUrl, setAlbumUrl] = useState('');
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumError, setAlbumError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const spotifyId = params?.spotifyId as string;

  // Refresh auth state when component mounts to ensure we have the latest auth status
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Debug logging for auth state
  useEffect(() => {
    console.log('🔍 Profile Page Auth State:', {
      authLoading,
      isAuthenticated,
      currentUserSpotifyId: currentUser?.spotifyId,
      profileSpotifyId: spotifyId,
      isOwnProfile: !authLoading && isAuthenticated && currentUser?.spotifyId === spotifyId,
    });
  }, [authLoading, isAuthenticated, currentUser?.spotifyId, spotifyId]);

  useEffect(() => {
    if (!spotifyId) return;

    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/${spotifyId}/shelves`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found');
          } else {
            setError('Failed to load profile');
          }
          return;
        }

        const data = await response.json();
        setProfileUser(data.user);
        setShelves(data.shelves || []);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [spotifyId]);

  const handleAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;
    
    setAlbumLoading(true);
    setAlbumError(null);

    try {
      const response = await fetch('/api/spotify/album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: albumUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch album');
      }

      const album: Album = {
        id: data.id,
        name: data.name,
        artists: data.artists,
        images: data.images,
        externalUrl: data.externalUrl,
        releaseDate: data.releaseDate,
        totalTracks: data.totalTracks,
        genres: data.genres,
        label: data.label,
        popularity: data.popularity,
        tracks: data.tracks.map((t: any) => ({
          id: t.id,
          name: t.name,
          duration: t.duration,
          trackNumber: t.trackNumber,
          artists: t.artists,
          previewUrl: t.previewUrl,
          externalUrl: t.externalUrl,
        })),
      };

      addAlbumToUnifiedShelf(album);
      setAlbumUrl('');
    } catch (err) {
      setAlbumError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setAlbumLoading(false);
    }
  };

  const copyProfileUrl = () => {
    const url = `${window.location.origin}/${spotifyId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // If viewing own profile and logged in, redirect to home with own data
  // Wait for auth to finish loading before determining if this is own profile
  const isOwnProfile = !authLoading && isAuthenticated && currentUser?.spotifyId === spotifyId;

  // Get unified shelf for display - MUST be called before any early returns (Rules of Hooks)
  // If viewing own profile, use the hook shelves for real-time updates
  // Compute directly from hookShelves to avoid calling getUnifiedShelf() which might trigger side effects
  const displayShelf = useMemo(() => {
    if (isOwnProfile) {
      // Use hook shelves for real-time updates - compute directly from hookShelves
      const UNIFIED_SHELF_NAME = 'My Albums';
      const unifiedShelf = hookShelves.find((s) => s.name === UNIFIED_SHELF_NAME);
      return unifiedShelf || {
        id: 'unified',
        name: UNIFIED_SHELF_NAME,
        albums: [],
        createdAt: Date.now(),
      };
    } else {
      // Use fetched shelves for other users
      return shelves.find(s => s.name === 'My Albums') || {
        id: 'unified',
        name: 'My Albums',
        albums: [],
        createdAt: Date.now(),
      };
    }
  }, [isOwnProfile, hookShelves, shelves]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 p-4 md:p-8 pb-24">
        <div className="max-w-7xl mx-auto pt-20">
          <div className="text-center text-white">Loading profile...</div>
        </div>
      </main>
    );
  }

  if (error || !profileUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 p-4 md:p-8 pb-24">
        <div className="max-w-7xl mx-auto pt-20">
          <div className="text-center text-red-400">
            <p className="text-xl font-bold mb-2">Profile Not Found</p>
            <p className="text-gray-400">{error || 'The user profile you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 p-4 md:p-8 pb-24">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-xl md:text-2xl font-bold text-white hover:text-green-400 transition-colors"
          >
            🎵 Spotify Album Fetcher
          </button>
          <div className="flex items-center gap-4">
            {!authLoading && isAuthenticated && <UserMenu />}
            {!authLoading && !isAuthenticated && (
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Header */}
      <div className="max-w-7xl mx-auto pt-20 pb-8">
        <div className="flex items-center gap-6 mb-6">
          {profileUser.imageUrl && (
            <img
              src={profileUser.imageUrl}
              alt={profileUser.displayName || 'User'}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-green-500"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {profileUser.displayName || 'User'}'s Albums
            </h1>
            {isOwnProfile && (
              <div className="flex items-center gap-4 mt-2">
                <p className="text-green-400 text-sm">This is your profile</p>
                <button
                  onClick={copyProfileUrl}
                  className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Profile URL
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Album Collection */}
      <div className="w-full px-4 md:px-8 mt-12">
        {displayShelf.albums.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">No albums yet</p>
            <p className="text-sm text-gray-500">
              {isOwnProfile 
                ? 'Add albums using the form below to get started!' 
                : 'This user hasn\'t added any albums yet.'}
            </p>
          </div>
        ) : (
          <ShelfDisplay 
            key={`shelf-${displayShelf.id}-${displayShelf.albums.length}-${displayShelf.albums.map(a => a.id).join('-')}`}
            shelf={displayShelf} 
          />
        )}
      </div>

      {/* Show album input form if viewing own profile */}
      {isOwnProfile && (
        <div className="max-w-4xl mx-auto mt-12">
          <div className="text-center mb-8">
            <p className="text-green-300 text-lg mb-4">
              Enter a Spotify album URL to add to your collection
            </p>
          </div>

          <form onSubmit={handleAlbumSubmit} className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={albumUrl}
                onChange={(e) => setAlbumUrl(e.target.value)}
                placeholder="https://open.spotify.com/album/..."
                className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                disabled={albumLoading}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {albumLoading ? 'Loading...' : 'Add Album'}
              </button>
            </div>
          </form>

          {albumError && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              <p className="font-semibold">Error:</p>
              <p>{albumError}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

