import { User } from '@/types/user';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

export function getUserBySpotifyId(spotifyId: string): User | null {
  const users = readUsers();
  return users.find((u) => u.spotifyId === spotifyId) || null;
}

export function getUserById(userId: string): User | null {
  const users = readUsers();
  return users.find((u) => u.id === userId) || null;
}

export function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
  const users = readUsers();
  const newUser: User = {
    ...userData,
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  users.push(newUser);
  writeUsers(users);
  return newUser;
}

export function updateUser(userId: string, updates: Partial<User>): User | null {
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

export function updateUserTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): User | null {
  return updateUser(userId, {
    spotifyAccessToken: accessToken,
    spotifyRefreshToken: refreshToken,
    tokenExpiresAt: Date.now() + expiresIn * 1000,
  });
}

