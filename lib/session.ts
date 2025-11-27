import { NextRequest, NextResponse } from 'next/server';
import { UserSession } from '@/types/user';

const SESSION_COOKIE_NAME = 'spotify_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function createSession(userId: string, spotifyId: string, email: string | null, displayName: string | null, imageUrl: string | null): string {
  const sessionData: UserSession = {
    userId,
    spotifyId,
    email,
    displayName,
    imageUrl,
  };
  return JSON.stringify(sessionData);
}

export function getSession(request: NextRequest): UserSession | null {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as UserSession;
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
}

export function setSessionCookie(response: NextResponse, sessionData: string, requestOrigin?: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  // Check if we're on HTTPS (Vercel uses HTTPS)
  const isHttps = requestOrigin?.startsWith('https://') || process.env.VERCEL_URL?.includes('vercel.app');
  
  // Secure cookies required for HTTPS (Vercel)
  // Only use false for local HTTP development
  const secure = isHttps || isProduction;
  
  // Use Next.js cookies API - this should work properly
  response.cookies.set(SESSION_COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: secure,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  
  console.log('🍪 Setting session cookie:', {
    name: SESSION_COOKIE_NAME,
    secure: secure,
    isProduction,
    isHttps,
    maxAge: SESSION_MAX_AGE,
    path: '/',
    hasData: !!sessionData,
    requestOrigin,
    cookieValue: sessionData.substring(0, 50) + '...',
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
}

