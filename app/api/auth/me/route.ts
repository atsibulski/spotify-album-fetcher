import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Debug: Log all cookies
    const allCookies = request.cookies.getAll();
    console.log('🍪 All cookies in /api/auth/me:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    
    const session = getSession(request);
    
    console.log('🔍 Session check:', {
      hasSession: !!session,
      userId: session?.userId,
      spotifyId: session?.spotifyId,
    });
    
    if (!session) {
      return NextResponse.json({
        isAuthenticated: false,
        user: null,
      });
    }

    const user = getUserById(session.userId);
    
    if (!user) {
      return NextResponse.json({
        isAuthenticated: false,
        user: null,
      });
    }

    // Return user data (excluding sensitive tokens)
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        id: user.id,
        spotifyId: user.spotifyId,
        email: user.email,
        displayName: user.displayName,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
    });
  }
}

