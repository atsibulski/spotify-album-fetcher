import { Shelf } from '@/types/shelf';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { supabase, isSupabaseConfigured, getSupabaseClient } from './supabase';

const DB_DIR = join(process.cwd(), 'data');
const SHELVES_FILE = join(DB_DIR, 'shelves.json');

// In-memory fallback for serverless environments
let inMemoryShelves: UserShelves[] = [];

// Ensure data directory exists
if (typeof window === 'undefined') {
  try {
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true });
    }
  } catch (error) {
    console.warn('⚠️ Could not create data directory (serverless environment?):', error);
  }
}

interface UserShelves {
  userId: string;
  spotifyId?: string; // Add spotifyId for public access
  shelves: Shelf[];
  updatedAt: number;
}

function readAllShelves(): UserShelves[] {
  try {
    if (existsSync(SHELVES_FILE)) {
      const data = readFileSync(SHELVES_FILE, 'utf-8');
      const shelves = JSON.parse(data);
      // Sync in-memory storage with file
      inMemoryShelves = shelves;
      return shelves;
    }
  } catch (error) {
    console.warn('⚠️ Error reading shelves file, using in-memory storage:', error);
  }
  // Return in-memory shelves if file doesn't exist or can't be read
  return inMemoryShelves.length > 0 ? inMemoryShelves : [];
}

function writeAllShelves(allShelves: UserShelves[]): void {
  // Always update in-memory storage first
  inMemoryShelves = allShelves;
  
  try {
    // Try to write to file system
    // On Vercel/serverless, this may fail - that's okay, we'll use in-memory storage
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true });
    }
    writeFileSync(SHELVES_FILE, JSON.stringify(allShelves, null, 2), 'utf-8');
  } catch (error) {
    // On serverless platforms (Vercel), file writes may fail
    // Store in memory as fallback (note: this is ephemeral and will reset on each function invocation)
    console.warn('⚠️ File write failed (serverless environment?), using in-memory storage:', error);
    // Don't throw - allow the function to continue
    // In production, you should migrate to a database (Vercel Postgres, Supabase, etc.)
  }
}

export async function getUserShelves(userId: string): Promise<Shelf[]> {
  // Try Supabase first if configured
  if (isSupabaseConfigured) {
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client not available');
      }
      
      // First get user's spotifyId
      const { data: userData } = await client
        .from('users')
        .select('spotify_id')
        .eq('id', userId)
        .single();
      
      if (userData?.spotify_id) {
        const { data, error } = await client
          .from('user_shelves')
          .select('shelves')
          .eq('spotify_id', userData.spotify_id)
          .single();
        
        if (!error && data?.shelves) {
          return data.shelves as Shelf[];
        }
      }
    } catch (error) {
      console.warn('Supabase shelves query failed, falling back to file storage:', error);
    }
  }
  
  // Fallback to file storage
  const allShelves = readAllShelves();
  const userShelves = allShelves.find((us) => us.userId === userId);
  return userShelves?.shelves || [];
}

export async function getUserShelvesBySpotifyId(spotifyId: string): Promise<Shelf[]> {
  console.log('🔍 Getting shelves for spotifyId:', spotifyId);
  
  // Try Supabase first if configured
  if (isSupabaseConfigured) {
    try {
      // Use fresh client instance to avoid connection issues
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client not available');
      }
      
      console.log('📦 Querying Supabase for shelves...');
      const { data, error } = await client
        .from('user_shelves')
        .select('shelves')
        .eq('spotify_id', spotifyId)
        .single();
      
      console.log('📦 Supabase response:', { 
        hasData: !!data, 
        hasShelves: !!data?.shelves, 
        shelvesLength: data?.shelves?.length || 0,
        error: error?.message 
      });
      
      if (!error && data?.shelves) {
        const shelves = data.shelves as Shelf[];
        console.log('✅ Found shelves in Supabase:', shelves.length, 'shelves');
        return shelves;
      } else if (error) {
        console.warn('⚠️ Supabase query error:', error.message, error.code);
      }
    } catch (error) {
      console.error('❌ Supabase shelves query exception:', error);
    }
  } else {
    console.warn('⚠️ Supabase not configured, using fallback storage');
  }
  
  // Fallback to file storage
  const allShelves = readAllShelves();
  const userShelves = allShelves.find((us) => us.spotifyId === spotifyId);
  console.log('📁 Fallback storage result:', userShelves?.shelves?.length || 0, 'shelves');
  return userShelves?.shelves || [];
}

export async function saveUserShelves(userId: string, shelves: Shelf[], spotifyId?: string): Promise<void> {
  if (!spotifyId) {
    console.warn('⚠️ Cannot save shelves without spotifyId');
    return;
  }

  console.log('💾 Saving shelves:', {
    userId,
    spotifyId,
    shelvesCount: shelves.length,
    totalAlbums: shelves.reduce((sum, s) => sum + s.albums.length, 0),
  });

  // Try Supabase first if configured
  if (isSupabaseConfigured) {
    try {
      // Use fresh client instance to avoid connection issues
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase client not available');
      }
      
      // First, ensure user exists in users table (required for foreign key)
      const { data: userCheck, error: userError } = await client
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist - this is okay, we'll save shelves without user_id
        console.warn('⚠️ User not found in users table, saving shelves without user_id reference');
      } else if (userError) {
        console.warn('⚠️ Error checking user:', userError.message);
      }

      console.log('📦 Saving to Supabase...', {
        spotifyId,
        userId,
        userExists: !!userCheck,
        shelvesCount: shelves.length,
        totalAlbums: shelves.reduce((sum, s) => sum + s.albums.length, 0),
      });
      
      // Save shelves - use user_id only if user exists, otherwise just spotify_id
      const { data, error } = await client
        .from('user_shelves')
        .upsert({
          ...(userCheck ? { user_id: userId } : {}), // Only include user_id if user exists
          spotify_id: spotifyId,
          shelves: shelves,
          updated_at: Date.now(),
        }, {
          onConflict: 'spotify_id',
        });
      
      if (!error) {
        console.log('✅ Shelves saved to Supabase successfully:', spotifyId, 'shelves:', shelves.length);
        return; // Success - exit early
      } else {
        console.error('❌ Supabase upsert failed:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        // Continue to fallback
      }
    } catch (error: any) {
      console.error('❌ Supabase save exception:', {
        message: error?.message,
        stack: error?.stack,
      });
    }
  } else {
    console.warn('⚠️ Supabase not configured, using fallback storage', {
      isSupabaseConfigured,
      hasSupabase: !!supabase,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  }

  // Fallback to file storage
  const allShelves = readAllShelves();
  const existingIndex = allShelves.findIndex((us) => us.userId === userId);
  
  const userShelves: UserShelves = {
    userId,
    spotifyId,
    shelves,
    updatedAt: Date.now(),
  };

  if (existingIndex >= 0) {
    allShelves[existingIndex] = userShelves;
  } else {
    allShelves.push(userShelves);
  }

  writeAllShelves(allShelves);
}




