import { Shelf } from '@/types/shelf';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DB_DIR = join(process.cwd(), 'data');
const SHELVES_FILE = join(DB_DIR, 'shelves.json');

// Ensure data directory exists
if (typeof window === 'undefined') {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
}

interface UserShelves {
  userId: string;
  shelves: Shelf[];
  updatedAt: number;
}

function readAllShelves(): UserShelves[] {
  try {
    if (existsSync(SHELVES_FILE)) {
      const data = readFileSync(SHELVES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading shelves:', error);
  }
  return [];
}

function writeAllShelves(allShelves: UserShelves[]): void {
  try {
    writeFileSync(SHELVES_FILE, JSON.stringify(allShelves, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing shelves:', error);
    throw error;
  }
}

export function getUserShelves(userId: string): Shelf[] {
  const allShelves = readAllShelves();
  const userShelves = allShelves.find((us) => us.userId === userId);
  return userShelves?.shelves || [];
}

export function saveUserShelves(userId: string, shelves: Shelf[]): void {
  const allShelves = readAllShelves();
  const existingIndex = allShelves.findIndex((us) => us.userId === userId);
  
  const userShelves: UserShelves = {
    userId,
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




