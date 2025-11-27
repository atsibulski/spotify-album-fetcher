import { NextRequest, NextResponse } from 'next/server';
import { getUserBySpotifyId, createUser, updateUserTokens } from '@/lib/db';
import { createSession, setSessionCookie } from '@/lib/session';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  console.log('🔄 OAuth callback received:', {
    hasCode: !!code,
    error,
    url: request.nextUrl.toString(),
  });

  if (error) {
    console.error('❌ OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.nextUrl.origin)
    );
  }

  if (!code) {
    console.error('❌ No code in callback');
    return NextResponse.redirect(
      new URL('/?error=no_code', request.nextUrl.origin)
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  // Use request origin to ensure redirect URI matches what user is accessing
  // Make sure BOTH http://localhost:3000/api/spotify/callback AND 
  // http://127.0.0.1:3000/api/spotify/callback are registered in Spotify Developer Dashboard
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${request.nextUrl.origin}/api/spotify/callback`;

  console.log('🔄 Callback - Redirect URI check:', {
    fromEnv: process.env.SPOTIFY_REDIRECT_URI,
    used: redirectUri,
    requestOrigin: request.nextUrl.origin,
  });

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/?error=config_error', request.nextUrl.origin)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    console.log('✅ Token exchange successful');

    // Get user info from Spotify
    const userInfoResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Spotify');
    }

    const spotifyUser = await userInfoResponse.json();
    console.log('✅ Got user info from Spotify:', spotifyUser.id);

    // Find or create user
    let user = getUserBySpotifyId(spotifyUser.id);
    const isNewUser = !user;

    if (user) {
      // Update existing user's tokens
      const updatedUser = updateUserTokens(
        user.id,
        tokenData.access_token,
        tokenData.refresh_token,
        tokenData.expires_in
      );
      if (updatedUser) {
        user = updatedUser;
        console.log('✅ Updated existing user:', user.id);
      }
    } else {
      // Create new user
      user = createUser({
        spotifyId: spotifyUser.id,
        email: spotifyUser.email || null,
        displayName: spotifyUser.display_name || spotifyUser.id,
        imageUrl: spotifyUser.images?.[0]?.url || null,
        spotifyAccessToken: tokenData.access_token,
        spotifyRefreshToken: tokenData.refresh_token,
        tokenExpiresAt: Date.now() + tokenData.expires_in * 1000,
        preferences: {
          theme: 'dark',
          defaultView: 'grid',
          autoPlay: false,
        },
      });
      console.log('✅ Created new user:', user.id);
    }

    if (!user) {
      throw new Error('Failed to create or update user');
    }

    // Create session
    const sessionData = createSession(
      user.id,
      user.spotifyId,
      user.email,
      user.displayName,
      user.imageUrl
    );

    console.log('🔐 Creating session:', {
      userId: user.id,
      spotifyId: user.spotifyId,
      sessionDataLength: sessionData.length,
    });

    // Create response with redirect
    const redirectUrl = new URL('/', request.nextUrl.origin);
    if (isNewUser) {
      redirectUrl.searchParams.set('welcome', 'true');
    }
    redirectUrl.searchParams.set('auth', 'success'); // Add auth success param

    // Create redirect response
    const response = NextResponse.redirect(redirectUrl, {
      status: 302,
    });
    
    // Set cookie - ensure it's set properly
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Must be false for HTTP
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    };
    
    response.cookies.set('spotify_session', sessionData, cookieOptions);
    
    // Also manually set the Set-Cookie header to ensure it's sent
    const cookieHeader = `spotify_session=${encodeURIComponent(sessionData)}; Path=/; Max-Age=${cookieOptions.maxAge}; SameSite=Lax; HttpOnly`;
    response.headers.set('Set-Cookie', cookieHeader);

    // Verify cookie was set
    const cookieValue = response.cookies.get('spotify_session')?.value;
    console.log('🍪 Cookie verification:', {
      hasCookie: response.cookies.has('spotify_session'),
      cookieExists: !!cookieValue,
      cookieLength: cookieValue?.length || 0,
      redirectUrl: redirectUrl.toString(),
      origin: request.nextUrl.origin,
      cookieHeaderSet: response.headers.has('Set-Cookie'),
    });

    // Log response headers for debugging
    const setCookieHeaders = response.headers.getSetCookie();
    console.log('🍪 Set-Cookie headers:', setCookieHeaders);
    console.log('🍪 All response headers:', Object.fromEntries(response.headers.entries()));

    console.log('✅ Session created, redirecting to home');
    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=auth_failed', request.nextUrl.origin)
    );
  }
}

