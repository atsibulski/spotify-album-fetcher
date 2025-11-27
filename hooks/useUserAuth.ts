'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserSession } from '@/types/user';

interface User {
  id: string;
  spotifyId: string;
  email: string | null;
  displayName: string | null;
  imageUrl: string | null;
  createdAt: number;
  preferences: {
    theme: 'dark' | 'light' | 'auto';
    defaultView: 'grid' | 'list';
    autoPlay: boolean;
  };
}

export function useUserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      // Include credentials to ensure cookies are sent
      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include', // Important: include cookies
      });
      const data = await response.json();
      
      console.log('🔍 Auth check result:', {
        isAuthenticated: data.isAuthenticated,
        hasUser: !!data.user,
        spotifyId: data.user?.spotifyId,
      });
      
      if (data.isAuthenticated && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
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

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setIsAuthenticated(false);
      // Reload to clear any cached state
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const updateUser = useCallback(async (updates: { displayName?: string | null; preferences?: User['preferences'] }) => {
    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        return updatedUser;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }, []);

  return {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    refreshUser: checkAuth,
  };
}

