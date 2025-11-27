'use client';

import { useEffect, useState } from 'react';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { useUserAuth } from '@/hooks/useUserAuth';
import Image from 'next/image';

export default function GlobalPlayer() {
  const { isAuthenticated } = useUserAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Get access token from API
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/auth/token')
        .then((res) => res.json())
        .then((data) => {
          if (data.accessToken) {
            setAccessToken(data.accessToken);
          }
        })
        .catch((err) => console.error('Error getting token:', err));
    }
  }, [isAuthenticated]);

  const spotifyPlayer = useSpotifyPlayer(accessToken);
  const isUsingSpotifyPlayer = accessToken && spotifyPlayer.isReady;

  // Debug logging
  useEffect(() => {
    if (spotifyPlayer.currentTrack) {
      console.log('🎮 GlobalPlayer state:', {
        hasCurrentTrack: !!spotifyPlayer.currentTrack,
        currentTrackId: spotifyPlayer.currentTrack?.id,
        hasAlbumTracks: !!spotifyPlayer.currentAlbumTracks,
        albumTracksCount: spotifyPlayer.currentAlbumTracks?.length,
        canGoPrev: spotifyPlayer.canGoPrev,
        canGoNext: spotifyPlayer.canGoNext,
      });
    }
  }, [spotifyPlayer.currentTrack, spotifyPlayer.currentAlbumTracks, spotifyPlayer.canGoPrev, spotifyPlayer.canGoNext]);

  // Don't show player if not authenticated or not ready
  if (!isAuthenticated || !isUsingSpotifyPlayer || !spotifyPlayer.currentTrack) {
    return null;
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotifyPlayer.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newPosition = Math.floor(percentage * spotifyPlayer.duration);
    spotifyPlayer.seek(newPosition);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
            {spotifyPlayer.currentTrack.image && (
              <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
                <Image
                  src={spotifyPlayer.currentTrack.image}
                  alt={spotifyPlayer.currentTrack.album}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium text-sm truncate">
                {spotifyPlayer.currentTrack.name}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {spotifyPlayer.currentTrack.artists}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => spotifyPlayer.prevTrack()}
                disabled={!spotifyPlayer.canGoPrev}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
                title="Previous track"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </button>
              <button
                onClick={() => spotifyPlayer.togglePlayPause()}
                className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                title={spotifyPlayer.isPlaying ? 'Pause' : 'Play'}
              >
                {spotifyPlayer.isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => spotifyPlayer.nextTrack()}
                disabled={!spotifyPlayer.canGoNext}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors flex-shrink-0"
                title="Next track"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0011 6v2.798l-5.445-3.63z" />
                </svg>
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full flex items-center gap-2">
              <span className="text-gray-400 text-xs w-10 text-right flex-shrink-0">
                {formatTime(spotifyPlayer.position)}
              </span>
              <div
                onClick={handleSeek}
                className="flex-1 h-1 bg-gray-700 rounded-full cursor-pointer hover:h-1.5 transition-all group"
              >
                <div
                  className="h-full bg-green-500 rounded-full transition-all group-hover:bg-green-400"
                  style={{
                    width: spotifyPlayer.duration
                      ? `${(spotifyPlayer.position / spotifyPlayer.duration) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="text-gray-400 text-xs w-10 flex-shrink-0">
                {formatTime(spotifyPlayer.duration)}
              </span>
            </div>
          </div>

          {/* Volume (placeholder for future) */}
          <div className="flex-shrink-0 w-20" />
        </div>
      </div>
    </div>
  );
}

