import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  // Use request origin to ensure redirect URI matches what user is accessing
  // Make sure BOTH http://localhost:3000/api/spotify/callback AND 
  // http://127.0.0.1:3000/api/spotify/callback are registered in Spotify Developer Dashboard
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${request.nextUrl.origin}/api/spotify/callback`;

  console.log('🔐 Auth request:', {
    hasClientId: !!clientId,
    redirectUri,
    redirectUriFromEnv: process.env.SPOTIFY_REDIRECT_URI,
    origin: request.nextUrl.origin,
    fullUrl: request.nextUrl.toString(),
  });

  if (!clientId) {
    console.error('❌ Missing SPOTIFY_CLIENT_ID');
    return NextResponse.json(
      { error: 'Spotify API credentials not configured' },
      { status: 500 }
    );
  }

  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
  ].join(' ');

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('show_dialog', 'true');

  console.log('✅ Generated auth URL:', authUrl.toString());
  console.log('📋 Redirect URI being sent to Spotify:', redirectUri);
  console.log('📋 Full auth URL params:', {
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    show_dialog: 'true',
  });

  return NextResponse.json({ authUrl: authUrl.toString() });
}

