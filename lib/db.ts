import { User } from '@/types/user';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DB_DIR = join(process.cwd(), 'data');
const USERS_FILE = join(DB_DIR, 'users.json');

// Ensure data directory exists
if (typeof window === 'undefined') {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
}

function readUsers(): User[] {
  try {
    if (existsSync(USERS_FILE)) {
      const data = readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading users:', error);
  }
  return [];
}

function writeUsers(users: User[]): void {
  try {
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing users:', error);
    throw error;
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

