'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { useUserAuth } from '@/hooks/useUserAuth';
import { openSpotifyLink, openSpotifyUri } from '@/lib/spotifyUtils';

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

interface AlbumDisplayProps {
  albumData: AlbumData;
  formatDuration: (ms: number) => string;
}

export default function AlbumDisplay({ albumData, formatDuration }: AlbumDisplayProps) {
  const coverImage = albumData.images[0]?.url || albumData.images[1]?.url;
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
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
  
  // Use Spotify Web Playback SDK if authenticated
  const spotifyPlayer = useSpotifyPlayer(accessToken);
  const isUsingSpotifyPlayer = accessToken && spotifyPlayer.isReady;

  const handlePlayTrack = async (trackId: string, previewUrl: string | null, externalUrl: string) => {
    // If using Spotify player, play full track
    if (isUsingSpotifyPlayer) {
      const trackUri = `spotify:track:${trackId}`;
      await spotifyPlayer.playTrack(trackUri, albumData.tracks);
      setPlayingTrackId(trackId);
      return;
    }

    // Fallback to preview or open in Spotify
    // Stop currently playing track
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    if (playingTrackId === trackId) {
      // If clicking the same track, stop it
      setPlayingTrackId(null);
      setAudioElement(null);
      if (isUsingSpotifyPlayer) {
        spotifyPlayer.togglePlayPause();
      }
      return;
    }

    if (previewUrl) {
      // Play preview if available
      const audio = new Audio(previewUrl);
      audio.play();
      audio.onended = () => {
        setPlayingTrackId(null);
        setAudioElement(null);
      };
      audio.onerror = () => {
        setPlayingTrackId(null);
        setAudioElement(null);
      };
      setAudioElement(audio);
      setPlayingTrackId(trackId);
    } else {
      // Open in Spotify app/web if no preview available
      openSpotifyLink(externalUrl);
    }
  };

  const stopPlaying = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    if (isUsingSpotifyPlayer) {
      spotifyPlayer.togglePlayPause();
    }
    setPlayingTrackId(null);
    setAudioElement(null);
  };

  // Update playing track ID based on Spotify player state
  useEffect(() => {
    if (isUsingSpotifyPlayer && spotifyPlayer.currentTrack) {
      setPlayingTrackId(spotifyPlayer.currentTrack.id);
    }
  }, [isUsingSpotifyPlayer, spotifyPlayer.currentTrack]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-800">
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Album Cover */}
        <div className="flex justify-center">
          {coverImage ? (
            <div className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden shadow-xl">
              <Image
                src={coverImage}
                alt={`${albumData.name} cover`}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="w-full max-w-md aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">No image available</span>
            </div>
          )}
        </div>

        {/* Album Details */}
        <div className="flex flex-col justify-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {albumData.name}
          </h2>
          <p className="text-xl text-green-400 mb-4">{albumData.artists}</p>

          <div className="space-y-2 text-gray-300">
            <p>
              <span className="font-semibold text-white">Release Date:</span>{' '}
              {new Date(albumData.releaseDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p>
              <span className="font-semibold text-white">Total Tracks:</span>{' '}
              {albumData.totalTracks}
            </p>
            {albumData.label && (
              <p>
                <span className="font-semibold text-white">Label:</span>{' '}
                {albumData.label}
              </p>
            )}
            {albumData.genres.length > 0 && (
              <p>
                <span className="font-semibold text-white">Genres:</span>{' '}
                {albumData.genres.join(', ')}
              </p>
            )}
            <p>
              <span className="font-semibold text-white">Popularity:</span>{' '}
              {albumData.popularity}/100
            </p>
          </div>

                  <div className="mt-6">
                    <button
                      onClick={() => openSpotifyUri('album', albumData.id, albumData.externalUrl)}
                      className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-center"
                    >
                      Open in Spotify →
                    </button>
                  </div>
        </div>
      </div>

      {/* Track List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">Track List</h3>
          {playingTrackId && (
            <button
              onClick={stopPlaying}
              className="text-sm text-green-400 hover:text-green-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Stop
            </button>
          )}
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {albumData.tracks.map((track, index) => (
              <div
                key={track.id || index}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-gray-400 text-sm font-mono w-8 flex-shrink-0">
                    {track.trackNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{track.name}</p>
                    {track.artists !== albumData.artists && (
                      <p className="text-gray-400 text-sm truncate">{track.artists}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-gray-400 text-sm flex-shrink-0">
                    {formatDuration(track.duration)}
                  </span>
                  <button
                    onClick={() => handlePlayTrack(track.id, track.previewUrl, track.externalUrl)}
                    className="flex-shrink-0 p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title={
                      isUsingSpotifyPlayer
                        ? 'Play full track'
                        : track.previewUrl
                        ? 'Play preview'
                        : 'Open in Spotify'
                    }
                  >
                    {playingTrackId === track.id && (isUsingSpotifyPlayer ? !spotifyPlayer.isPlaying : true) ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : playingTrackId === track.id && spotifyPlayer.isPlaying ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {albumData.tracks.some(t => !t.previewUrl) && (
          <p className="text-gray-400 text-xs mt-2 text-center">
            * Some tracks may not have previews. Click the play button to open in Spotify.
          </p>
        )}
      </div>
    </div>
  );
}

