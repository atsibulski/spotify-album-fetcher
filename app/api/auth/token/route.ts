import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById, updateUserTokens } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    let user = await getUserById(session.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    const fiveMinutesFromNow = Date.now() + 5 * 60 * 1000;
    if (user.tokenExpiresAt < fiveMinutesFromNow) {
      console.log('🔄 Token expired or expiring soon, refreshing...');
      
      // Refresh the token
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: 'Spotify API credentials not configured' },
          { status: 500 }
        );
      }

      try {
        const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: user.spotifyRefreshToken,
          }),
        });

        if (!refreshResponse.ok) {
          const errorData = await refreshResponse.json().catch(() => ({}));
          console.error('❌ Failed to refresh token:', errorData);
          return NextResponse.json(
            { error: 'Failed to refresh token', needsReauth: true },
            { status: 401 }
          );
        }

        const tokenData = await refreshResponse.json();
        
        // Update user with new tokens
        user = await updateUserTokens(
          user.id,
          tokenData.access_token,
          user.spotifyRefreshToken, // Keep the same refresh token unless Spotify provides a new one
          tokenData.expires_in
        );

        if (!user) {
          return NextResponse.json(
            { error: 'Failed to update user tokens' },
            { status: 500 }
          );
        }

        console.log('✅ Token refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Error refreshing token:', refreshError);
        return NextResponse.json(
          { error: 'Failed to refresh token', needsReauth: true },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({
      accessToken: user.spotifyAccessToken,
    });
  } catch (error) {
    console.error('Error getting token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

