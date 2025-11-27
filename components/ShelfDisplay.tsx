'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Shelf } from '@/types/shelf';
import { useShelves } from '@/hooks/useShelves';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { useUserAuth } from '@/hooks/useUserAuth';
import { openSpotifyUri } from '@/lib/spotifyUtils';
import AlbumModal from './AlbumModal';

interface ShelfDisplayProps {
  shelf: Shelf;
}

// Sortable Album Item Component
function SortableAlbumItem({
  album,
  shelf,
  isPlaying,
  onPlay,
  onRemove,
  onSelect,
}: {
  album: Shelf['albums'][0];
  shelf: Shelf;
  isPlaying: boolean;
  onPlay: (album: Shelf['albums'][0]) => void;
  onRemove: () => void;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: album.id });

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const coverImage = album.images[0]?.url || album.images[1]?.url;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMoreMenuOpen) {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMoreMenuOpen]);

  // Handle click - only open modal if it wasn't a drag
  const handleClick = (e: React.MouseEvent) => {
    // Don't open modal if:
    // 1. We're currently dragging
    // 2. Click target is a button or interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    // Only open modal if not dragging
    if (!isDragging) {
      onSelect();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative transition-all duration-300 ease-out"
      onMouseEnter={(e) => {
        e.currentTarget.style.zIndex = '50';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.zIndex = 'auto';
      }}
      onClick={handleClick}
    >
      {/* Drag Handle - Top Left Corner */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-[100] w-8 h-8 rounded-md bg-black/60 hover:bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing flex items-center justify-center"
        title="Drag to reorder"
      >
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* More Menu Button */}
      <div className="absolute top-2 right-2 z-[100]" ref={moreMenuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsMoreMenuOpen(!isMoreMenuOpen);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="w-8 h-8 rounded-md bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm"
          title="More options"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isMoreMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl border border-gray-800 py-1 z-[100]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
                setIsMoreMenuOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-white hover:bg-gray-800 transition-colors flex items-center gap-3 text-sm"
            >
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete from library
            </button>
          </div>
        )}
      </div>

      <motion.div
        className="w-full h-full"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
          mass: 0.8,
        }}
      >
      {/* Album Cover with Realistic Shadows */}
      <div 
        className={`relative w-full aspect-square transition-all duration-300 ease-out group-hover:scale-110 ${
          isPlaying ? 'ring-4 ring-green-500 ring-opacity-75 shadow-2xl shadow-green-500/50' : ''
        }`}
        style={{
          filter: isPlaying 
            ? 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))'
            : 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))',
          zIndex: 1,
        }}
      >
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-900">
          {coverImage ? (
            <>
              {/* Inner shadow effect */}
              <div className="absolute inset-0 rounded-lg pointer-events-none z-10"
                style={{
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 -2px 8px rgba(0, 0, 0, 0.2)',
                }}
              />
              <Image
                src={coverImage}
                alt={`${album.name} cover`}
                fill
                className="object-cover"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
          
          {/* Play/Pause Button Overlay */}
          <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center z-30 rounded-lg pointer-events-none ${
            isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onPlay(album);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors shadow-2xl transform hover:scale-110 pointer-events-auto z-50"
              title={isPlaying ? "Pause album" : "Play album"}
            >
              {isPlaying ? (
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
            </button>
          </div>

          {/* Album Info Overlay - Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/85 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity z-30 rounded-b-lg pointer-events-none">
            <h3 className="text-white font-bold text-sm md:text-base truncate mb-1">{album.name}</h3>
            <p className="text-gray-300 text-xs md:text-sm truncate mb-1">{album.artists}</p>
            <p className="text-gray-400 text-xs">
              {new Date(album.releaseDate).getFullYear()}
            </p>
          </div>
        </div>
      </div>
      </motion.div>
    </div>
  );
}

export default function ShelfDisplay({ shelf }: ShelfDisplayProps) {
  const { removeAlbumFromUnifiedShelf, reorderUnifiedShelfAlbums, getUnifiedShelf, shelves } = useShelves();
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
  const [playingAlbumId, setPlayingAlbumId] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Shelf['albums'][0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessingPlay, setIsProcessingPlay] = useState(false);

  // Get the latest shelf from the hook to ensure we have the updated order
  // If this is the unified shelf, always use the latest from the hook
  // This ensures the component re-renders when shelves state changes
  const latestShelf = getUnifiedShelf();
  const isUnifiedShelf = shelf.id === latestShelf?.id;
  const currentShelf = isUnifiedShelf && latestShelf
    ? latestShelf 
    : shelf;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag activates
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePlayAlbum = async (album: Shelf['albums'][0]) => {
    if (album.tracks.length === 0) {
      console.warn('Album has no tracks');
      return;
    }

    // Prevent multiple rapid clicks
    if (isProcessingPlay) {
      console.log('⏸️ Already processing play request');
      return;
    }

    setIsProcessingPlay(true);

    try {
      // Check player state fresh each time
      const playerReady = accessToken && spotifyPlayer.isReady && spotifyPlayer.deviceId;
      
      // If this album is currently playing, pause it
      if (playingAlbumId === album.id && spotifyPlayer.isPlaying) {
        await spotifyPlayer.togglePlayPause();
        setIsProcessingPlay(false);
        return;
      }

      // If this album is paused (same album, not playing), resume it
      if (playingAlbumId === album.id && !spotifyPlayer.isPlaying && spotifyPlayer.currentTrack) {
        // Check if current track belongs to this album
        const currentTrackId = spotifyPlayer.currentTrack.id;
        const trackIdOnly = currentTrackId.includes(':') ? currentTrackId.split(':').pop() : currentTrackId;
        const trackInAlbum = album.tracks.find((t) => {
          const albumTrackId = t.id.includes(':') ? t.id.split(':').pop() : t.id;
          return albumTrackId === trackIdOnly;
        });
        
        if (trackInAlbum) {
          // Resume from where we left off
          console.log('▶️ Resuming paused album from current track');
          await spotifyPlayer.togglePlayPause();
          setIsProcessingPlay(false);
          return;
        }
      }

      if (playerReady) {
        // Ensure player is ready - retry if needed
        let retries = 3;
        while (retries > 0 && (!spotifyPlayer.isReady || !spotifyPlayer.deviceId)) {
          console.warn(`⚠️ Player not ready yet, waiting... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          retries--;
        }

        if (!spotifyPlayer.isReady || !spotifyPlayer.deviceId) {
          console.error('❌ Player still not ready after retries');
          setIsProcessingPlay(false);
          // Fallback: open in Spotify
          openSpotifyUri('album', album.id, album.externalUrl);
          return;
        }

        // Play entire album starting from first track (new play, not resume)
        // playAlbum will handle stopping current playback and starting the new album
        const trackUris = album.tracks.map((track) => `spotify:track:${track.id}`);
        console.log('🎵 Playing album from start:', album.name, 'with', trackUris.length, 'tracks');
        
        const success = await spotifyPlayer.playAlbum(trackUris, album.tracks);
        if (success) {
          console.log('✅ Album playback started from first track');
          setPlayingAlbumId(album.id);
        } else {
          console.error('❌ Failed to play album, trying first track');
          // Fallback: try playing first track
          const firstTrack = album.tracks[0];
          const trackUri = `spotify:track:${firstTrack.id}`;
          const trackSuccess = await spotifyPlayer.playTrack(trackUri, album.tracks);
          if (trackSuccess) {
            setPlayingAlbumId(album.id);
          } else {
            console.error('❌ Failed to play first track');
            console.warn('⚠️ Could not play album. Make sure Spotify is open and you have an active device.');
            // Fallback: open in Spotify
            openSpotifyUri('album', album.id, album.externalUrl);
          }
        }
      } else {
        // Not authenticated or player not ready - open album in Spotify app/web
        console.log('Opening album in Spotify (player not ready):', album.externalUrl);
        openSpotifyUri('album', album.id, album.externalUrl);
      }
    } catch (error) {
      console.error('❌ Error playing album:', error);
      // Fallback: open in Spotify
      openSpotifyUri('album', album.id, album.externalUrl);
    } finally {
      setIsProcessingPlay(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log('🎯 Drag ended:', { activeId: active.id, overId: over?.id });

    if (over && active.id !== over.id) {
      console.log('✅ Calling reorderUnifiedShelfAlbums');
      reorderUnifiedShelfAlbums(active.id as string, over.id as string);
    } else {
      console.log('ℹ️ Drag cancelled or same position');
    }
  };

  // Update playing state based on Spotify player
  useEffect(() => {
    if (isUsingSpotifyPlayer && spotifyPlayer.currentTrack) {
      // Extract just the ID part if it's a full URI (spotify:track:ID)
      const currentTrackId = spotifyPlayer.currentTrack.id;
      const trackIdOnly = currentTrackId.includes(':') 
        ? currentTrackId.split(':').pop() 
        : currentTrackId;
      
      // Check if current track belongs to any album in this shelf
      const albumWithTrack = currentShelf.albums.find((album) =>
        album.tracks.some((t) => {
          const albumTrackId = t.id.includes(':') ? t.id.split(':').pop() : t.id;
          return albumTrackId === trackIdOnly;
        })
      );
      
      if (albumWithTrack) {
        // Keep track of which album is playing/paused (don't clear on pause)
        setPlayingAlbumId(albumWithTrack.id);
        console.log('🎵 Album playing:', {
          albumId: albumWithTrack.id,
          albumName: albumWithTrack.name,
          trackId: trackIdOnly,
          isPlaying: spotifyPlayer.isPlaying
        });
      } else {
        // Track doesn't belong to any album in this shelf
        setPlayingAlbumId(null);
      }
    } else if (!isUsingSpotifyPlayer || !spotifyPlayer.currentTrack) {
      setPlayingAlbumId(null);
    }
  }, [isUsingSpotifyPlayer, spotifyPlayer.currentTrack, spotifyPlayer.isPlaying, currentShelf.albums]);

  // Monitor player readiness and log when it changes
  useEffect(() => {
    if (accessToken) {
      console.log('🎮 Player state:', {
        isReady: spotifyPlayer.isReady,
        deviceId: spotifyPlayer.deviceId,
        hasToken: !!accessToken,
        isPlaying: spotifyPlayer.isPlaying,
        currentTrack: spotifyPlayer.currentTrack?.name,
      });
    }
  }, [accessToken, spotifyPlayer.isReady, spotifyPlayer.deviceId, spotifyPlayer.isPlaying, spotifyPlayer.currentTrack]);

  if (currentShelf.albums.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No albums in this shelf yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Add albums from the album view above
        </p>
      </div>
    );
  }

  // Get album IDs for SortableContext - memoize to ensure it updates when albums change
  const albumIds = currentShelf.albums.map((album) => album.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      key={`${currentShelf.id}-${albumIds.join('-')}`} // Add key based on shelf ID and album order to force re-render
    >
      <SortableContext
        items={albumIds}
        strategy={rectSortingStrategy}
      >
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 1024px) {
              .album-grid-responsive {
                grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)) !important;
              }
            }
          `}} />
          <div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 album-grid-responsive gap-4 md:gap-6 w-full"
          >
          <AnimatePresence mode="popLayout">
            {currentShelf.albums.map((album) => {
              const isPlaying = playingAlbumId === album.id && spotifyPlayer.isPlaying;

              return (
                <SortableAlbumItem
                  key={album.id}
                  album={album}
                  shelf={currentShelf}
                  isPlaying={isPlaying}
                  onPlay={handlePlayAlbum}
                  onRemove={() => removeAlbumFromUnifiedShelf(album.id)}
                  onSelect={() => {
                    setSelectedAlbum(album);
                    setIsModalOpen(true);
                  }}
                />
              );
            })}
          </AnimatePresence>
          </div>
        </>
      </SortableContext>

      {/* Album Modal */}
      {selectedAlbum && (
        <AlbumModal
          album={selectedAlbum}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setTimeout(() => setSelectedAlbum(null), 600); // Wait for animation to complete
          }}
          formatDuration={(ms: number) => {
            const minutes = Math.floor(ms / 60000);
            const seconds = Math.floor((ms % 60000) / 1000);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }}
        />
      )}
    </DndContext>
  );
}

