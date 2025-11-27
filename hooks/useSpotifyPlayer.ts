'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface AlbumTrack {
  id: string;
  name: string;
  duration: number;
  trackNumber: number;
  artists: string;
  previewUrl: string | null;
  externalUrl: string;
}

interface PlayerState {
  isReady: boolean;
  isPlaying: boolean;
  currentTrack: {
    id: string;
    name: string;
    artists: string;
    album: string;
    image: string;
  } | null;
  position: number;
  duration: number;
  deviceId: string | null;
  currentAlbumTracks: AlbumTrack[] | null;
}

export function useSpotifyPlayer(accessToken: string | null) {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isReady: false,
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    deviceId: null,
    currentAlbumTracks: null,
  });

  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!accessToken) return;

    // Load Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Spotify Album Fetcher',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.5,
      });

      playerRef.current = player;

      // Ready
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setPlayerState((prev) => ({
          ...prev,
          isReady: true,
          deviceId: device_id,
        }));
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setPlayerState((prev) => ({
          ...prev,
          isReady: false,
        }));
      });

      // Authentication error
      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error('❌ Authentication error:', message);
        setPlayerState((prev) => ({
          ...prev,
          isReady: false,
        }));
      });

      // Account error
      player.addListener('account_error', ({ message }: { message: string }) => {
        console.error('❌ Account error:', message);
        setPlayerState((prev) => ({
          ...prev,
          isReady: false,
        }));
      });

      // Playback error
      player.addListener('playback_error', ({ message }: { message: string }) => {
        console.error('❌ Playback error:', message);
      });

      // Player state changed
      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;

        setPlayerState((prev) => {
          const newState = {
            ...prev,
            isPlaying: !state.paused,
            position: state.position,
            duration: state.duration,
            currentTrack: state.track_window?.current_track
              ? {
                  id: state.track_window.current_track.id,
                  name: state.track_window.current_track.name,
                  artists: state.track_window.current_track.artists
                    .map((a: any) => a.name)
                    .join(', '),
                  album: state.track_window.current_track.album.name,
                  image: state.track_window.current_track.album.images[0]?.url || '',
                }
              : null,
          };
          
          // Log when track changes to debug album context
          if (newState.currentTrack && prev.currentTrack?.id !== newState.currentTrack.id) {
            console.log('🎵 Track changed:', {
              newTrackId: newState.currentTrack.id,
              hasAlbumTracks: !!newState.currentAlbumTracks,
              albumTracksCount: newState.currentAlbumTracks?.length,
            });
          }
          
          return newState;
        });
      });

      player.connect();
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [accessToken]);

  // Helper function to force activate web player device
  const forceActivateDevice = async (): Promise<boolean> => {
    if (!playerState.deviceId || !accessToken) return false;

    try {
      // Check current device
      const currentDeviceResponse = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => null);

      if (currentDeviceResponse?.ok) {
        const deviceInfo = await currentDeviceResponse.json().catch(() => null);
        if (deviceInfo?.device?.id === playerState.deviceId) {
          console.log('✅ Web player is already the active device');
          return true;
        } else if (deviceInfo?.device?.id) {
          console.log('🔄 Different device is active, transferring...', {
            currentDevice: deviceInfo.device.id,
            targetDevice: playerState.deviceId
          });
        }
      }

      // Try to pause any current playback first (on any device)
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {});

      await new Promise(resolve => setTimeout(resolve, 300));

      // Force transfer to web player - try multiple times if needed
      for (let attempt = 0; attempt < 2; attempt++) {
        const transferResponse = await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            device_ids: [playerState.deviceId],
            play: false
          }),
        });

        // Wait for transfer to complete (longer wait if desktop app was active)
        await new Promise(resolve => setTimeout(resolve, 600 + (attempt * 200)));

        // Verify the transfer worked
        const verifyResponse = await fetch('https://api.spotify.com/v1/me/player', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch(() => null);

        if (verifyResponse?.ok) {
          const verifyInfo = await verifyResponse.json().catch(() => null);
          if (verifyInfo?.device?.id === playerState.deviceId) {
            console.log(`✅ Web player activated successfully (attempt ${attempt + 1})`);
            return true;
          }
        }

        if (transferResponse.status === 204 || transferResponse.status === 404) {
          // Transfer accepted, but verify might fail if no active playback
          // Assume it worked if we got 204
          if (transferResponse.status === 204) {
            console.log(`✅ Device transfer accepted (attempt ${attempt + 1})`);
            return true;
          }
        }
      }

      console.warn('⚠️ Device activation may have failed, but continuing...');
      return false; // Return false but continue anyway
    } catch (error) {
      console.error('❌ Failed to activate device:', error);
      return false;
    }
  };

  const playTrack = async (trackUri: string, albumTracks?: AlbumTrack[]) => {
    if (!playerRef.current || !playerState.deviceId || !accessToken) {
      console.error('❌ Player not ready:', {
        hasPlayer: !!playerRef.current,
        deviceId: playerState.deviceId,
        hasToken: !!accessToken,
      });
      return false;
    }

    try {
      // Store album context if provided
      if (albumTracks) {
        console.log('📀 Storing album tracks (playTrack):', {
          count: albumTracks.length,
          trackIds: albumTracks.map(t => t.id.includes(':') ? t.id.split(':').pop() : t.id),
          trackUri,
        });
        setPlayerState((prev) => ({
          ...prev,
          currentAlbumTracks: albumTracks,
        }));
      }

      // Force activate device first
      await forceActivateDevice();

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${playerState.deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [trackUri] }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to play track:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return false;
      }

      console.log('✅ Track playback started:', trackUri);
      return true;
    } catch (error) {
      console.error('❌ Failed to play track:', error);
      return false;
    }
  };

  const playAlbum = async (trackUris: string[], albumTracks?: AlbumTrack[]) => {
    if (!playerRef.current || !playerState.deviceId || !accessToken) {
      console.error('❌ Player not ready');
      return false;
    }

    try {
      // Store album context if provided
      if (albumTracks) {
        console.log('📀 Storing album tracks (playAlbum):', {
          count: albumTracks.length,
          trackIds: albumTracks.map(t => t.id.includes(':') ? t.id.split(':').pop() : t.id),
        });
        setPlayerState((prev) => ({
          ...prev,
          currentAlbumTracks: albumTracks,
        }));
      }

      // Force activate the web player device (this handles pausing and transferring)
      const deviceActivated = await forceActivateDevice();
      
      if (!deviceActivated) {
        console.warn('⚠️ Device activation had issues, but continuing...');
      }

      // Now play the album - explicitly start from the first track (position 0)
      // Clear any previous context and start fresh
      console.log('🎵 Starting album playback from track 1 of', trackUris.length, 'tracks');
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${playerState.deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          uris: trackUris,
          offset: { position: 0 }, // Always start from first track (index 0)
          position_ms: 0 // Also ensure we start at the beginning of the first track
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { raw: errorText };
        }
        
        console.error('❌ Failed to play album:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        
        // If 404 or 403, device might not be active or desktop app is blocking - try harder
        if (response.status === 404 || response.status === 403) {
          console.log('🔄 Device not active or blocked, attempting forceful activation...');
          
          // Try multiple times with increasing delays
          for (let attempt = 0; attempt < 3; attempt++) {
            // Force transfer again
            await fetch('https://api.spotify.com/v1/me/player', {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                device_ids: [playerState.deviceId],
                play: false
              }),
            }).catch(() => {});
            
            // Wait longer each attempt
            await new Promise(resolve => setTimeout(resolve, 500 + (attempt * 300)));
            
            // Try to play - explicitly start from first track
            const retryResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${playerState.deviceId}`, {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                uris: trackUris,
                offset: { position: 0 }, // Always start from first track (index 0)
                position_ms: 0 // Also ensure we start at the beginning of the first track
              }),
            });
            
            if (retryResponse.ok) {
              console.log(`✅ Album playback started after ${attempt + 1} activation attempt(s)`);
              return true;
            } else {
              const retryErrorText = await retryResponse.text();
              console.warn(`⚠️ Attempt ${attempt + 1} failed:`, retryResponse.status, retryErrorText);
            }
          }
          
          console.error('❌ All activation attempts failed');
        }
        
        return false;
      }

      console.log('✅ Album playback started');
      return true;
    } catch (error) {
      console.error('❌ Failed to play album:', error);
      return false;
    }
  };

  const togglePlayPause = async () => {
    if (!playerRef.current) return;

    if (playerState.isPlaying) {
      await playerRef.current.pause();
    } else {
      await playerRef.current.resume();
    }
  };

  const seek = async (positionMs: number) => {
    if (!playerRef.current) return;
    await playerRef.current.seek(positionMs);
  };

  const prevTrack = async () => {
    if (!playerState.currentAlbumTracks || !playerState.currentTrack || !accessToken || !playerState.deviceId) {
      console.log('❌ Cannot go prev:', {
        hasTracks: !!playerState.currentAlbumTracks,
        hasTrack: !!playerState.currentTrack,
        hasToken: !!accessToken,
        hasDevice: !!playerState.deviceId,
        tracksLength: playerState.currentAlbumTracks?.length,
        currentTrackId: playerState.currentTrack?.id,
      });
      return false;
    }

    // Find current track index in album
    const currentTrackId = playerState.currentTrack.id;
    const trackIdOnly = currentTrackId.includes(':') ? currentTrackId.split(':').pop() : currentTrackId;
    
    const currentIndex = playerState.currentAlbumTracks.findIndex((t) => {
      const albumTrackId = t.id.includes(':') ? t.id.split(':').pop() : t.id;
      return albumTrackId === trackIdOnly;
    });

    console.log('🔍 Prev track check:', {
      currentTrackId: trackIdOnly,
      currentIndex,
      totalTracks: playerState.currentAlbumTracks.length,
      albumTrackIds: playerState.currentAlbumTracks.map(t => t.id.includes(':') ? t.id.split(':').pop() : t.id),
    });

    if (currentIndex === -1 || currentIndex === 0) {
      // Already at first track or track not found in album
      return false;
    }

    // Play previous track
    const prevTrack = playerState.currentAlbumTracks[currentIndex - 1];
    const prevTrackUri = `spotify:track:${prevTrack.id.includes(':') ? prevTrack.id.split(':').pop() : prevTrack.id}`;
    
    return await playTrack(prevTrackUri, playerState.currentAlbumTracks);
  };

  const nextTrack = async () => {
    if (!playerState.currentAlbumTracks || !playerState.currentTrack || !accessToken || !playerState.deviceId) {
      console.log('❌ Cannot go next:', {
        hasTracks: !!playerState.currentAlbumTracks,
        hasTrack: !!playerState.currentTrack,
        hasToken: !!accessToken,
        hasDevice: !!playerState.deviceId,
        tracksLength: playerState.currentAlbumTracks?.length,
        currentTrackId: playerState.currentTrack?.id,
      });
      return false;
    }

    // Find current track index in album
    const currentTrackId = playerState.currentTrack.id;
    const trackIdOnly = currentTrackId.includes(':') ? currentTrackId.split(':').pop() : currentTrackId;
    
    const currentIndex = playerState.currentAlbumTracks.findIndex((t) => {
      const albumTrackId = t.id.includes(':') ? t.id.split(':').pop() : t.id;
      return albumTrackId === trackIdOnly;
    });

    console.log('🔍 Next track check:', {
      currentTrackId: trackIdOnly,
      currentIndex,
      totalTracks: playerState.currentAlbumTracks.length,
      albumTrackIds: playerState.currentAlbumTracks.map(t => t.id.includes(':') ? t.id.split(':').pop() : t.id),
    });

    if (currentIndex === -1 || currentIndex === playerState.currentAlbumTracks.length - 1) {
      // Already at last track or track not found in album
      return false;
    }

    // Play next track
    const nextTrack = playerState.currentAlbumTracks[currentIndex + 1];
    const nextTrackUri = `spotify:track:${nextTrack.id.includes(':') ? nextTrack.id.split(':').pop() : nextTrack.id}`;
    
    return await playTrack(nextTrackUri, playerState.currentAlbumTracks);
  };

  // Compute if prev/next are available - these update reactively when state changes
  const canGoPrev = useMemo(() => {
    if (!playerState.currentAlbumTracks || !playerState.currentTrack) {
      console.log('🔍 canGoPrev: false - missing tracks or current track');
      return false;
    }

    const currentTrackId = playerState.currentTrack.id;
    const trackIdOnly = currentTrackId.includes(':') ? currentTrackId.split(':').pop() : currentTrackId;
    
    const currentIndex = playerState.currentAlbumTracks.findIndex((t) => {
      const albumTrackId = t.id.includes(':') ? t.id.split(':').pop() : t.id;
      return albumTrackId === trackIdOnly;
    });

    const result = currentIndex > 0;
    console.log('🔍 canGoPrev:', {
      currentTrackId: trackIdOnly,
      currentIndex,
      totalTracks: playerState.currentAlbumTracks.length,
      result,
    });
    return result;
  }, [playerState.currentAlbumTracks, playerState.currentTrack]);

  const canGoNext = useMemo(() => {
    if (!playerState.currentAlbumTracks || !playerState.currentTrack) {
      console.log('🔍 canGoNext: false - missing tracks or current track');
      return false;
    }

    const currentTrackId = playerState.currentTrack.id;
    const trackIdOnly = currentTrackId.includes(':') ? currentTrackId.split(':').pop() : currentTrackId;
    
    const currentIndex = playerState.currentAlbumTracks.findIndex((t) => {
      const albumTrackId = t.id.includes(':') ? t.id.split(':').pop() : t.id;
      return albumTrackId === trackIdOnly;
    });

    const result = currentIndex >= 0 && currentIndex < playerState.currentAlbumTracks.length - 1;
    console.log('🔍 canGoNext:', {
      currentTrackId: trackIdOnly,
      currentIndex,
      totalTracks: playerState.currentAlbumTracks.length,
      result,
    });
    return result;
  }, [playerState.currentAlbumTracks, playerState.currentTrack]);

  return {
    ...playerState,
    playTrack,
    playAlbum,
    togglePlayPause,
    seek,
    prevTrack,
    nextTrack,
    canGoPrev,
    canGoNext,
  };
}

