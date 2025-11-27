'use client';

import { useState, useEffect, useCallback } from 'react';

interface SpotifyAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
}

export function useSpotifyAuth() {
  const [authState, setAuthState] = useState<SpotifyAuthState>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    isAuthenticated: false,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('spotify_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
          setAuthState(parsed);
        } else {
          localStorage.removeItem('spotify_auth');
        }
      } catch (e) {
        localStorage.removeItem('spotify_auth');
      }
    }

    // Check for token in URL hash (from OAuth callback)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresIn = params.get('expires_in');

      if (accessToken && refreshToken && expiresIn) {
        const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
        const newState = {
          accessToken,
          refreshToken,
          expiresAt,
          isAuthenticated: true,
        };
        setAuthState(newState);
        localStorage.setItem('spotify_auth', JSON.stringify(newState));
        // Clean up URL hash
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const login = useCallback(async () => {
    try {
      console.log('🔐 Initiating Spotify login...');
      const response = await fetch('/api/spotify/auth');
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ Auth error:', data.error);
        alert(`Failed to connect to Spotify: ${data.error}`);
        return;
      }
      
      if (data.authUrl) {
        console.log('✅ Redirecting to Spotify:', data.authUrl);
        window.location.href = data.authUrl;
      } else {
        console.error('❌ No auth URL in response:', data);
        alert('Failed to get authentication URL. Please check the console for details.');
      }
    } catch (error) {
      console.error('❌ Failed to get auth URL:', error);
      alert(`Failed to connect to Spotify: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const logout = useCallback(() => {
    setAuthState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('spotify_auth');
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!authState.refreshToken) return null;

    try {
      const response = await fetch('/api/spotify/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: authState.refreshToken }),
      });

      const data = await response.json();
      if (data.access_token) {
        const expiresAt = Date.now() + data.expires_in * 1000;
        const newState = {
          ...authState,
          accessToken: data.access_token,
          expiresAt,
        };
        setAuthState(newState);
        localStorage.setItem('spotify_auth', JSON.stringify(newState));
        return data.access_token;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
    }
    return null;
  }, [authState, logout]);

  // Auto-refresh token if it's about to expire
  useEffect(() => {
    if (authState.expiresAt && authState.expiresAt - Date.now() < 60000) {
      refreshAccessToken();
    }
  }, [authState.expiresAt, refreshAccessToken]);

  return {
    ...authState,
    login,
    logout,
    refreshAccessToken,
  };
}

