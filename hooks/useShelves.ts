'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Shelf, Album } from '@/types/shelf';
import { useUserAuth } from './useUserAuth';

const STORAGE_KEY = 'spotify_shelves';

export function useShelves() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const isInitialMount = useRef(true);
  const hasLoadedFromStorage = useRef(false);
  const hasLoadedFromServer = useRef(false);
  const { isAuthenticated } = useUserAuth();

  // Load shelves from server if authenticated, otherwise from localStorage
  useEffect(() => {
    const loadShelves = async () => {
      if (isAuthenticated && !hasLoadedFromServer.current) {
        // Try to load from server first
        try {
          const response = await fetch('/api/user/shelves');
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data.shelves)) {
              console.log('📂 Loading shelves from server:', data.shelves.length, 'shelves');
              setShelves(data.shelves);
              hasLoadedFromServer.current = true;
              // Also save to localStorage as cache
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.shelves));
              setTimeout(() => {
                isInitialMount.current = false;
              }, 100);
              return;
            }
          }
        } catch (e) {
          console.error('❌ Failed to load shelves from server:', e);
        }
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            console.log('📂 Loading shelves from localStorage:', parsed.length, 'shelves');
            setShelves(parsed);
            hasLoadedFromStorage.current = true;
            // If authenticated, sync to server
            if (isAuthenticated && !hasLoadedFromServer.current) {
              fetch('/api/user/shelves', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shelves: parsed }),
              }).catch(console.error);
            }
          }
        }
      } catch (e) {
        console.error('❌ Failed to load shelves:', e);
      } finally {
        setTimeout(() => {
          isInitialMount.current = false;
        }, 100);
      }
    };

    loadShelves();
  }, [isAuthenticated]);

  // Save shelves to server and localStorage whenever they change (skip initial mount)
  useEffect(() => {
    console.log('🔄 Save effect triggered, isInitialMount:', isInitialMount.current, 'shelves count:', shelves.length);
    
    // Only save if not initial mount
    if (!isInitialMount.current) {
      // Save to localStorage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const dataToSave = JSON.stringify(shelves);
          localStorage.setItem(STORAGE_KEY, dataToSave);
          console.log('✅ Shelves saved to localStorage:', shelves.length, 'shelves');
        }
      } catch (e) {
        console.error('❌ Failed to save shelves to localStorage:', e);
      }

      // Save to server if authenticated
      if (isAuthenticated) {
        fetch('/api/user/shelves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shelves }),
        })
          .then((res) => {
            if (res.ok) {
              console.log('✅ Shelves saved to server:', shelves.length, 'shelves');
            } else {
              console.error('❌ Failed to save shelves to server:', res.status);
            }
          })
          .catch((e) => {
            console.error('❌ Error saving shelves to server:', e);
          });
      }
    } else {
      console.log('⏭️ Skipping save on initial mount, shelves:', shelves.length);
    }
  }, [shelves, isAuthenticated]);

  const createShelf = useCallback((name: string) => {
    const newShelf: Shelf = {
      id: `shelf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      albums: [],
      createdAt: Date.now(),
    };
    setShelves((prev) => {
      const updated = [...prev, newShelf];
      console.log('Creating shelf:', name, 'Total shelves after create:', updated.length);
      return updated;
    });
    return newShelf.id;
  }, []);

  const deleteShelf = useCallback((shelfId: string) => {
    setShelves((prev) => prev.filter((s) => s.id !== shelfId));
  }, []);

  const renameShelf = useCallback((shelfId: string, newName: string) => {
    setShelves((prev) =>
      prev.map((s) => (s.id === shelfId ? { ...s, name: newName } : s))
    );
  }, []);

  const addAlbumToShelf = useCallback((shelfId: string, album: Album) => {
    setShelves((prev) => {
      const shelf = prev.find((s) => s.id === shelfId);
      
      // If shelf doesn't exist, we can't add to it
      if (!shelf) {
        console.warn(`Shelf ${shelfId} not found, skipping album addition. Available shelves:`, prev.map(s => s.id));
        return prev;
      }
      
      // Check if album already exists in shelf
      if (shelf.albums.some((a) => a.id === album.id)) {
        console.log(`Album ${album.id} already in shelf ${shelfId}`);
        return prev;
      }
      
      // Add album to shelf
      const updated = prev.map((s) =>
        s.id === shelfId ? { ...s, albums: [...s.albums, album] } : s
      );
      console.log(`Added album ${album.name} to shelf ${shelf.name}`);
      return updated;
    });
  }, []);

  const removeAlbumFromShelf = useCallback(
    (shelfId: string, albumId: string) => {
      setShelves((prev) =>
        prev.map((s) =>
          s.id === shelfId
            ? { ...s, albums: s.albums.filter((a) => a.id !== albumId) }
            : s
        )
      );
    },
    []
  );

  const reorderAlbums = useCallback(
    (shelfId: string, activeId: string, overId: string | null) => {
      if (!overId) {
        console.log('⚠️ Reorder cancelled: no overId');
        return;
      }
      
      console.log('🔄 Reordering albums:', { shelfId, activeId, overId });
      
      setShelves((prev) => {
        const updated = prev.map((shelf) => {
          if (shelf.id !== shelfId) return shelf;
          
          const albums = [...shelf.albums];
          const activeIndex = albums.findIndex((a) => a.id === activeId);
          const overIndex = albums.findIndex((a) => a.id === overId);
          
          console.log('📍 Indices:', { activeIndex, overIndex, totalAlbums: albums.length });
          
          if (activeIndex === -1 || overIndex === -1) {
            console.warn('⚠️ Could not find album indices');
            return shelf;
          }
          
          if (activeIndex === overIndex) {
            console.log('ℹ️ No change: same position');
            return shelf;
          }
          
          // Remove the active item and insert it at the new position
          const [removed] = albums.splice(activeIndex, 1);
          albums.splice(overIndex, 0, removed);
          
          console.log('✅ Albums reordered:', {
            shelfName: shelf.name,
            movedAlbum: removed.name,
            newOrder: albums.map(a => a.name)
          });
          
          return { ...shelf, albums };
        });
        
        return updated;
      });
    },
    []
  );

  const getShelf = useCallback(
    (shelfId: string) => {
      return shelves.find((s) => s.id === shelfId);
    },
    [shelves]
  );

  const getUnifiedShelf = useCallback(() => {
    const UNIFIED_SHELF_NAME = 'My Albums';
    let unifiedShelf = shelves.find((s) => s.name === UNIFIED_SHELF_NAME);
    
    if (!unifiedShelf) {
      // Create unified shelf if it doesn't exist
      const newShelfId = createShelf(UNIFIED_SHELF_NAME);
      // Try to find it in current shelves, if not found return a default structure
      unifiedShelf = shelves.find((s) => s.id === newShelfId) || {
        id: newShelfId,
        name: UNIFIED_SHELF_NAME,
        albums: [],
        createdAt: Date.now(),
      };
    }
    
    return unifiedShelf;
  }, [shelves, createShelf]);

  const addAlbumToUnifiedShelf = useCallback((album: Album) => {
    const unifiedShelf = getUnifiedShelf();
    addAlbumToShelf(unifiedShelf.id, album);
  }, [getUnifiedShelf, addAlbumToShelf]);

  const removeAlbumFromUnifiedShelf = useCallback((albumId: string) => {
    const unifiedShelf = getUnifiedShelf();
    removeAlbumFromShelf(unifiedShelf.id, albumId);
  }, [getUnifiedShelf, removeAlbumFromShelf]);

  const reorderUnifiedShelfAlbums = useCallback((activeId: string, overId: string | null) => {
    const unifiedShelf = getUnifiedShelf();
    reorderAlbums(unifiedShelf.id, activeId, overId);
  }, [getUnifiedShelf, reorderAlbums]);

  return {
    // Keep old functions for backward compatibility but mark as deprecated
    shelves,
    createShelf,
    deleteShelf,
    renameShelf,
    addAlbumToShelf,
    removeAlbumFromShelf,
    reorderAlbums,
    getShelf,
    // New unified shelf functions
    getUnifiedShelf,
    addAlbumToUnifiedShelf,
    removeAlbumFromUnifiedShelf,
    reorderUnifiedShelfAlbums,
  };
}

