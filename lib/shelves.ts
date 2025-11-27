import { Shelf } from '@/types/shelf';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

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

export function getUserShelves(userId: string): Shelf[] {
  const allShelves = readAllShelves();
  const userShelves = allShelves.find((us) => us.userId === userId);
  return userShelves?.shelves || [];
}

export function getUserShelvesBySpotifyId(spotifyId: string): Shelf[] {
  const allShelves = readAllShelves();
  const userShelves = allShelves.find((us) => us.spotifyId === spotifyId);
  return userShelves?.shelves || [];
}

export function saveUserShelves(userId: string, shelves: Shelf[], spotifyId?: string): void {
  const allShelves = readAllShelves();
  const existingIndex = allShelves.findIndex((us) => us.userId === userId);
  
  const userShelves: UserShelves = {
    userId,
    spotifyId, // Store spotifyId for public access
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




