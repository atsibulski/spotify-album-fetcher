'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/hooks/useUserAuth';
import ShelfDisplay from '@/components/ShelfDisplay';
import { useShelves } from '@/hooks/useShelves';
import { Album } from '@/types/shelf';
import UserMenu from '@/components/UserMenu';

interface AlbumData {
  id: string;
  name: string;
  artists: string;
  releaseDate: string;
  totalTracks: number;
  images: Array<{ url: string; height: number; width: number }>;
  externalUrl: string;
  genres: string[];
  label: string;
  popularity: number;
  tracks: Array<{
    id: string;
    name: string;
    duration: number;
    trackNumber: number;
    artists: string;
    previewUrl: string | null;
    externalUrl: string;
  }>;
}

export default function Home() {
  const [albumUrl, setAlbumUrl] = useState('');
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated, loading: authLoading, login, refreshUser } = useUserAuth();
  const { getUnifiedShelf, addAlbumToUnifiedShelf, shelves } = useShelves();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAlbumData(null);

    try {
      const response = await fetch('/api/spotify/album', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: albumUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Failed to fetch album';
        const details = data.details ? ` ${data.details}` : '';
        throw new Error(errorMsg + details);
      }

      setAlbumData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Automatically add fetched albums to unified shelf and clear the display
  useEffect(() => {
    if (albumData) {
      const album: Album = {
        id: albumData.id,
        name: albumData.name,
        artists: albumData.artists,
        images: albumData.images,
        externalUrl: albumData.externalUrl,
        releaseDate: albumData.releaseDate,
        totalTracks: albumData.totalTracks,
        genres: albumData.genres,
        label: albumData.label,
        popularity: albumData.popularity,
        tracks: albumData.tracks.map((t) => ({
          id: t.id,
          name: t.name,
          duration: t.duration,
          trackNumber: t.trackNumber,
          artists: t.artists,
          previewUrl: t.previewUrl,
          externalUrl: t.externalUrl,
        })),
      };
      
      // Add album to unified shelf immediately
      console.log('Adding album to unified shelf:', album.name);
      addAlbumToUnifiedShelf(album);
      
      // Clear album data to hide the details view
      setTimeout(() => {
        setAlbumData(null);
        setAlbumUrl(''); // Clear the input field
      }, 500); // Small delay to allow the add operation to complete
    }
  }, [albumData, addAlbumToUnifiedShelf]);

  // Check for OAuth callback and refresh auth state immediately
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasWelcome = urlParams.get('welcome') === 'true';
    const hasError = urlParams.get('error');
    const authSuccess = urlParams.get('auth') === 'success';
    
    // If we just came back from OAuth, immediately refresh auth state
    if (hasWelcome || authSuccess) {
      console.log('🔄 OAuth callback detected, refreshing auth state...');
      
      // Clean up URL params first
      window.history.replaceState({}, '', window.location.pathname);
      
      // Refresh auth multiple times to ensure cookie is detected
      const refreshInterval = setInterval(() => {
        refreshUser();
      }, 200);
      
      // Stop refreshing after 2 seconds
      setTimeout(() => {
        clearInterval(refreshInterval);
      }, 2000);
      
      if (hasWelcome) {
        setTimeout(() => {
          alert('Welcome! Your account has been created. You can now manage your albums and play full tracks!');
        }, 500);
      }
    }
    
    // If there's an error, refresh and clean up URL
    if (hasError) {
      window.history.replaceState({}, '', window.location.pathname);
      refreshUser();
    }
  }, [refreshUser]);

  // Redirect to user profile after auth state is confirmed
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hadWelcome = urlParams.get('welcome') === 'true';
    const hadAuthSuccess = urlParams.get('auth') === 'success';
    
    // Only redirect if we came from OAuth AND auth is confirmed
    // Check if URL was cleaned (no params) but we're authenticated
    if ((hadWelcome || hadAuthSuccess || (!urlParams.toString() && !authLoading)) && !authLoading && isAuthenticated && user?.spotifyId) {
      console.log('✅ Auth confirmed, redirecting to profile...', {
        isAuthenticated,
        spotifyId: user.spotifyId,
      });
      setTimeout(() => {
        router.push(`/${user.spotifyId}`);
      }, 500);
    }
  }, [authLoading, isAuthenticated, user?.spotifyId, router]);

  // Compute unified shelf at the top level (before any conditional returns)
  // This ensures hooks are always called in the same order
  const unifiedShelfDisplay = useMemo(() => {
    const UNIFIED_SHELF_NAME = 'My Albums';
    const unifiedShelf = shelves.find((s) => s.name === UNIFIED_SHELF_NAME);
    
    if (!unifiedShelf) {
      return null;
    }
    
    // Use key based on albums AND their order to force re-render when albums are reordered
    // Include shelves reference to ensure re-render when albums are added
    // Also include a timestamp-like key based on album IDs to force re-render on new additions
    const albumOrderKey = unifiedShelf.albums.map((a, i) => `${i}-${a.id}`).join('|') || '';
    const shelfKey = `unified-${shelves.length}-${unifiedShelf.albums.length}-${albumOrderKey}`;
    
    return (
      <ShelfDisplay 
        key={shelfKey} 
        shelf={unifiedShelf} 
      />
    );
  }, [shelves]);

  // Show landing page header if not authenticated, but still show album form
  // This allows users to add albums even without signing in (stored locally)

  // Show loading only while auth is loading
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 p-4 md:p-8 pb-24">
        <div className="max-w-7xl mx-auto pt-32 text-center">
          <div className="text-white">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-black to-green-900 p-4 md:p-8 pb-24">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            🎵 Spotify Album Fetcher
          </h1>
          <div className="flex items-center gap-4">
            {!authLoading && isAuthenticated ? (
              <UserMenu />
            ) : (
              <button
                onClick={login}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Sign in with Spotify
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto pt-20">
        {!authLoading && !isAuthenticated && (
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Share Your Music Collection
            </h1>
            <p className="text-xl text-green-300 mb-6">
              Create and share your Spotify album collection with a unique profile URL
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Sign in to save albums to your profile, or add albums below to get started
            </p>
          </div>
        )}
        <div className="text-center mb-8">
          <p className="text-green-300 text-lg mb-4">
            Enter a Spotify album URL to get artwork and details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
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
              disabled={loading}
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Fetch Album'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            <p className="font-semibold">Error:</p>
            <p className="mb-2">{error}</p>
            <p className="text-xs text-red-300 mt-2">
              💡 Check the terminal/console for detailed error logs
            </p>
          </div>
        )}
      </div>

      {/* Unified Album Collection - Full Width */}
      <div className="w-full px-4 md:px-8 mt-12">
        <h2 className="text-3xl font-bold text-white mb-6">My Albums</h2>
        {unifiedShelfDisplay}
      </div>
    </main>
  );
}

