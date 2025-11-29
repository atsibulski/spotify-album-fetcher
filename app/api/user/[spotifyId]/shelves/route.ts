import { NextRequest, NextResponse } from 'next/server';
import { getUserBySpotifyId } from '@/lib/db';
import { getUserShelves, getUserShelvesBySpotifyId } from '@/lib/shelves';

export async function GET(
  request: NextRequest,
  { params }: { params: { spotifyId: string } }
) {
  try {
    const { spotifyId } = params;

    if (!spotifyId) {
      return NextResponse.json(
        { error: 'Spotify ID is required' },
        { status: 400 }
      );
    }

    // Try to get user from database first
    let user = await getUserBySpotifyId(spotifyId);
    let shelves: any[] = [];

    if (user) {
      // User exists in database, get their shelves by userId
      shelves = await getUserShelves(user.id);
      
      return NextResponse.json({
        user: {
          id: user.id,
          spotifyId: user.spotifyId,
          displayName: user.displayName,
          imageUrl: user.imageUrl,
        },
        shelves,
      });
    }

    // User not in database, try to get shelves by spotifyId (for public access)
    console.log('🔍 User not in DB, fetching shelves by spotifyId:', spotifyId);
    shelves = await getUserShelvesBySpotifyId(spotifyId);
    console.log('📦 Shelves fetched by spotifyId:', shelves.length, 'shelves');
    
    if (shelves.length > 0) {
      // Found shelves by spotifyId, return public profile
      console.log('✅ Returning shelves for public profile');
      return NextResponse.json({
        user: {
          id: `spotify_${spotifyId}`,
          spotifyId: spotifyId,
          displayName: spotifyId,
          imageUrl: null,
        },
        shelves,
      });
    } else {
      console.log('⚠️ No shelves found for spotifyId:', spotifyId);
    }

    // User not in database (serverless environment or new user)
    // Fetch user info from Spotify API to create a public profile
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        // Can't fetch from Spotify, return minimal profile
        return NextResponse.json({
          user: {
            id: `spotify_${spotifyId}`,
            spotifyId: spotifyId,
            displayName: spotifyId,
            imageUrl: null,
          },
          shelves: [], // Empty shelves - user needs to sign in to populate
        });
      }

      // Get client credentials token to fetch user info
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        
        // Try to fetch user info (this might fail if user profile is private)
        // For now, return a basic profile that can be viewed publicly
        return NextResponse.json({
          user: {
            id: `spotify_${spotifyId}`,
            spotifyId: spotifyId,
            displayName: spotifyId, // Will be updated when user signs in
            imageUrl: null,
          },
          shelves: [], // Shelves are stored client-side, empty for public viewers
        });
      }
    } catch (spotifyError) {
      console.warn('Could not fetch user from Spotify:', spotifyError);
    }

    // Fallback: return minimal public profile
    return NextResponse.json({
      user: {
        id: `spotify_${spotifyId}`,
        spotifyId: spotifyId,
        displayName: spotifyId,
        imageUrl: null,
      },
      shelves: [], // Empty - user needs to sign in to see their albums
    });
  } catch (error) {
    console.error('Error fetching user shelves:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

