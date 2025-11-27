import { User } from '@/types/user';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { supabase, isSupabaseConfigured } from './supabase';

const DB_DIR = join(process.cwd(), 'data');
const USERS_FILE = join(DB_DIR, 'users.json');

// In-memory fallback for serverless environments
let inMemoryUsers: User[] = [];

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

function readUsers(): User[] {
  try {
    if (existsSync(USERS_FILE)) {
      const data = readFileSync(USERS_FILE, 'utf-8');
      const users = JSON.parse(data);
      // Sync in-memory storage with file
      inMemoryUsers = users;
      return users;
    }
  } catch (error) {
    console.warn('⚠️ Error reading users file, using in-memory storage:', error);
  }
  // Return in-memory users if file doesn't exist or can't be read
  return inMemoryUsers.length > 0 ? inMemoryUsers : [];
}

function writeUsers(users: User[]): void {
  // Always update in-memory storage first
  inMemoryUsers = users;
  
  try {
    // Try to write to file system
    // On Vercel/serverless, this may fail - that's okay, we'll use in-memory storage
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true });
    }
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    // On serverless platforms (Vercel), file writes may fail
    // Store in memory as fallback (note: this is ephemeral and will reset on each function invocation)
    console.warn('⚠️ File write failed (serverless environment?), using in-memory storage:', error);
    // Don't throw - allow the function to continue
    // In production, you should migrate to a database (Vercel Postgres, Supabase, etc.)
  }
}

export async function getUserBySpotifyId(spotifyId: string): Promise<User | null> {
  // Try Supabase first if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('spotify_id', spotifyId)
        .single();
      
      if (!error && data) {
        // Convert database format to User format
        return {
          id: data.id,
          spotifyId: data.spotify_id,
          email: data.email,
          displayName: data.display_name,
          imageUrl: data.image_url,
          spotifyAccessToken: data.spotify_access_token,
          spotifyRefreshToken: data.spotify_refresh_token,
          tokenExpiresAt: data.token_expires_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          preferences: data.preferences || { theme: 'dark', defaultView: 'grid', autoPlay: false },
        };
      }
    } catch (error) {
      console.warn('Supabase query failed, falling back to file storage:', error);
    }
  }
  
  // Fallback to file storage
  const users = readUsers();
  return users.find((u) => u.spotifyId === spotifyId) || null;
}

export async function getUserById(userId: string): Promise<User | null> {
  // Try Supabase first if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        return {
          id: data.id,
          spotifyId: data.spotify_id,
          email: data.email,
          displayName: data.display_name,
          imageUrl: data.image_url,
          spotifyAccessToken: data.spotify_access_token,
          spotifyRefreshToken: data.spotify_refresh_token,
          tokenExpiresAt: data.token_expires_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          preferences: data.preferences || { theme: 'dark', defaultView: 'grid', autoPlay: false },
        };
      }
    } catch (error) {
      console.warn('Supabase query failed, falling back to file storage:', error);
    }
  }
  
  // Fallback to file storage
  const users = readUsers();
  return users.find((u) => u.id === userId) || null;
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const newUser: User = {
    ...userData,
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Try Supabase first if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: newUser.id,
          spotify_id: newUser.spotifyId,
          email: newUser.email,
          display_name: newUser.displayName,
          image_url: newUser.imageUrl,
          spotify_access_token: newUser.spotifyAccessToken,
          spotify_refresh_token: newUser.spotifyRefreshToken,
          token_expires_at: newUser.tokenExpiresAt,
          preferences: newUser.preferences,
          created_at: newUser.createdAt,
          updated_at: newUser.updatedAt,
        });
      
      if (!error) {
        console.log('✅ User created in Supabase:', newUser.spotifyId);
        return newUser;
      } else {
        console.warn('Supabase insert failed, falling back to file storage:', error);
      }
    } catch (error) {
      console.warn('Supabase insert error, falling back to file storage:', error);
    }
  }

  // Fallback to file storage
  const users = readUsers();
  users.push(newUser);
  writeUsers(users);
  return newUser;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  // Try Supabase first if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const updateData: any = {
        updated_at: Date.now(),
      };
      
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.displayName !== undefined) updateData.display_name = updates.displayName;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.spotifyAccessToken !== undefined) updateData.spotify_access_token = updates.spotifyAccessToken;
      if (updates.spotifyRefreshToken !== undefined) updateData.spotify_refresh_token = updates.spotifyRefreshToken;
      if (updates.tokenExpiresAt !== undefined) updateData.token_expires_at = updates.tokenExpiresAt;
      if (updates.preferences !== undefined) updateData.preferences = updates.preferences;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
      
      if (!error && data) {
        return {
          id: data.id,
          spotifyId: data.spotify_id,
          email: data.email,
          displayName: data.display_name,
          imageUrl: data.image_url,
          spotifyAccessToken: data.spotify_access_token,
          spotifyRefreshToken: data.spotify_refresh_token,
          tokenExpiresAt: data.token_expires_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          preferences: data.preferences || { theme: 'dark', defaultView: 'grid', autoPlay: false },
        };
      }
    } catch (error) {
      console.warn('Supabase update failed, falling back to file storage:', error);
    }
  }

  // Fallback to file storage
  const users = readUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) return null;

  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    updatedAt: Date.now(),
  };
  writeUsers(users);
  return users[userIndex];
}

export async function updateUserTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<User | null> {
  return updateUser(userId, {
    spotifyAccessToken: accessToken,
    spotifyRefreshToken: refreshToken,
    tokenExpiresAt: Date.now() + expiresIn * 1000,
  });
}

