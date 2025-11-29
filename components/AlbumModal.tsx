'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Album } from '@/types/shelf';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { useUserAuth } from '@/hooks/useUserAuth';
import { openSpotifyLink, openSpotifyUri } from '@/lib/spotifyUtils';

interface AlbumModalProps {
  album: Album | null;
  isOpen: boolean;
  onClose: () => void;
  formatDuration: (ms: number) => string;
}

export default function AlbumModal({ album, isOpen, onClose, formatDuration }: AlbumModalProps) {
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
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Update playing track ID based on Spotify player state
  useEffect(() => {
    if (isUsingSpotifyPlayer && spotifyPlayer.currentTrack && album) {
      const currentTrackId = spotifyPlayer.currentTrack.id;
      // Extract just the ID part if it's a full URI (spotify:track:ID)
      const trackIdOnly = currentTrackId.includes(':') 
        ? currentTrackId.split(':').pop() 
        : currentTrackId;
      
      // Check if current track belongs to this album (compare IDs)
      const trackInAlbum = album.tracks.find((t) => {
        const albumTrackId = t.id.includes(':') ? t.id.split(':').pop() : t.id;
        return albumTrackId === trackIdOnly;
      });
      
      if (trackInAlbum) {
        // Set the playing track ID (use the album's track ID format)
        setPlayingTrackId(trackInAlbum.id);
        console.log('🎵 Modal: Track playing in album:', {
          trackName: trackInAlbum.name,
          trackId: trackInAlbum.id,
          isPlaying: spotifyPlayer.isPlaying
        });
      } else {
        // Track doesn't belong to this album
        setPlayingTrackId(null);
      }
    } else if (!isUsingSpotifyPlayer || !spotifyPlayer.currentTrack) {
      setPlayingTrackId(null);
    }
  }, [isUsingSpotifyPlayer, spotifyPlayer.currentTrack, spotifyPlayer.isPlaying, album]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cleanup audio on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);

  const coverImage = album?.images[0]?.url || album?.images[1]?.url;

  const handlePlayTrack = async (trackId: string, previewUrl: string | null, externalUrl: string) => {
    // If this track is currently playing, pause it
    if (playingTrackId === trackId && spotifyPlayer.isPlaying) {
      await spotifyPlayer.togglePlayPause();
      return;
    }

    if (isUsingSpotifyPlayer && album) {
      const trackUri = `spotify:track:${trackId}`;
      const success = await spotifyPlayer.playTrack(trackUri, album.tracks);
      if (success) {
        setPlayingTrackId(trackId);
      }
      return;
    }

    // Handle preview audio
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    if (playingTrackId === trackId) {
      setPlayingTrackId(null);
      setAudioElement(null);
      return;
    }

    if (previewUrl) {
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
      openSpotifyLink(externalUrl);
    }
  };

  if (!album) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Modal Content Container with Perspective */}
          <div
            style={{
              perspective: '1500px',
              transformStyle: 'preserve-3d',
            }}
            className="w-full max-w-4xl"
          >
            <motion.div
              className="relative w-full max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              initial={{
                opacity: 0,
                scale: 0.5,
                rotateY: -120,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                rotateY: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.5,
                rotateY: 120,
              }}
              transition={{
                type: 'spring',
                stiffness: 180,
                damping: 22,
                mass: 1.2,
              }}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="p-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Album Cover */}
            <div className="flex justify-center">
              <motion.div
                className="relative w-full max-w-md aspect-square"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {coverImage ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden shadow-xl">
                    <Image
                      src={coverImage}
                      alt={`${album.name} cover`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No image available</span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Album Details */}
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {album.name}
              </h2>
              <p className="text-xl text-green-400 mb-4">{album.artists}</p>

              <div className="space-y-2 text-gray-300 mb-6">
                <p>
                  <span className="font-semibold text-white">Release Date:</span>{' '}
                  {new Date(album.releaseDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p>
                  <span className="font-semibold text-white">Total Tracks:</span>{' '}
                  {album.totalTracks}
                </p>
                {album.label && (
                  <p>
                    <span className="font-semibold text-white">Label:</span> {album.label}
                  </p>
                )}
                {album.genres.length > 0 && (
                  <p>
                    <span className="font-semibold text-white">Genres:</span>{' '}
                    {album.genres.join(', ')}
                  </p>
                )}
                <p>
                  <span className="font-semibold text-white">Popularity:</span>{' '}
                  {album.popularity}/100
                </p>
              </div>

              <button
                onClick={() => openSpotifyUri('album', album.id, album.externalUrl)}
                className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors text-center"
              >
                Open in Spotify →
              </button>
            </div>
          </div>

          {/* Track List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Track List</h3>
              {playingTrackId && spotifyPlayer.isPlaying && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Now Playing: {album.tracks.find(t => {
                      const playingId = playingTrackId.includes(':') ? playingTrackId.split(':').pop() : playingTrackId;
                      const trackId = t.id.includes(':') ? t.id.split(':').pop() : t.id;
                      return playingId === trackId;
                    })?.name || 'Track'}
                  </span>
                </div>
              )}
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {album.tracks.map((track, index) => {
                  // Compare track IDs (handle both URI and plain ID formats)
                  const playingId = playingTrackId ? (playingTrackId.includes(':') ? playingTrackId.split(':').pop() : playingTrackId) : null;
                  const trackId = track.id ? (track.id.includes(':') ? track.id.split(':').pop() : track.id) : null;
                  const isCurrentlyPlaying = playingId && trackId && playingId === trackId && spotifyPlayer.isPlaying;
                  return (
                  <div
                    key={track.id || index}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors group ${
                      isCurrentlyPlaying 
                        ? 'bg-green-900/30 border border-green-500/50' 
                        : 'bg-gray-900/50 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {isCurrentlyPlaying ? (
                        <svg className="w-5 h-5 text-green-400 flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-gray-400 text-sm font-mono w-8 flex-shrink-0">
                          {track.trackNumber}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isCurrentlyPlaying ? 'text-green-400' : 'text-white'}`}>
                          {track.name}
                        </p>
                        {track.artists !== album.artists && (
                          <p className="text-gray-400 text-sm truncate">{track.artists}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className={`text-sm flex-shrink-0 ${isCurrentlyPlaying ? 'text-green-400' : 'text-gray-400'}`}>
                        {formatDuration(track.duration)}
                      </span>
                      <button
                        onClick={() => handlePlayTrack(track.id, track.previewUrl, track.externalUrl)}
                        className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                          isCurrentlyPlaying 
                            ? 'bg-green-600 hover:bg-green-700 opacity-100' 
                            : 'bg-green-500 hover:bg-green-600 opacity-0 group-hover:opacity-100'
                        } text-white focus:opacity-100`}
                        title={
                          isCurrentlyPlaying 
                            ? 'Pause track' 
                            : isUsingSpotifyPlayer 
                              ? 'Play full track' 
                              : track.previewUrl 
                                ? 'Play preview' 
                                : 'Open in Spotify'
                        }
                      >
                        {isCurrentlyPlaying ? (
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
                  );
                })}
              </div>
            </div>
          </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

