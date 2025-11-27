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

    // Try to get user from database
    let user = await getUserById(session.userId);
    
    // If user not found in database (serverless/in-memory reset), use session data
    // This handles the case where file storage doesn't persist on Vercel
    if (!user) {
      console.warn('⚠️ User not found in database, using session data:', session.userId);
      // Return user data from session (minimal but functional)
      return NextResponse.json({
        isAuthenticated: true,
        user: {
          id: session.userId,
          spotifyId: session.spotifyId,
          email: session.email,
          displayName: session.displayName,
          imageUrl: session.imageUrl,
          createdAt: Date.now(), // Approximate
          preferences: {
            theme: 'dark',
            defaultView: 'grid',
            autoPlay: false,
          },
        },
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

