import { NextRequest, NextResponse } from 'next/server';

// Extract album ID from Spotify URL
function extractAlbumId(url: string): string | null {
  // Handle various Spotify URL formats:
  // https://open.spotify.com/album/ALBUM_ID
  // spotify:album:ALBUM_ID
  // https://open.spotify.com/album/ALBUM_ID?si=...
  
  const patterns = [
    /album\/([a-zA-Z0-9]+)/,
    /spotify:album:([a-zA-Z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Album URL is required' },
        { status: 400 }
      );
    }

    const albumId = extractAlbumId(url);
    console.log('Extracted album ID:', albumId, 'from URL:', url);
    if (!albumId) {
      return NextResponse.json(
        { error: 'Invalid Spotify album URL. Please make sure the URL contains an album ID.' },
        { status: 400 }
      );
    }

    // Get access token directly (don't use the token endpoint to avoid caching issues)
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Spotify API credentials not configured' },
        { status: 500 }
      );
    }

    console.log('Getting fresh access token...');
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store', // Ensure we get a fresh token
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      console.error('Token request failed:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to get access token',
          details: errorData.error_description || errorData.error || errorData.raw
        },
        { status: tokenResponse.status }
      );
    }

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      throw new Error('Invalid access token received from Spotify');
    }
    const { access_token } = tokenData;
    console.log('✅ Got fresh access token, expires in:', tokenData.expires_in, 'seconds');

    // Fetch album details from Spotify
    console.log('Fetching album from Spotify API:', albumId);
    const spotifyResponse = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    console.log('Spotify album API response status:', spotifyResponse.status);

    if (!spotifyResponse.ok) {
      const errorText = await spotifyResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      
      console.error('Spotify album API error:', {
        status: spotifyResponse.status,
        statusText: spotifyResponse.statusText,
        error: errorData
      });
      
      if (spotifyResponse.status === 404) {
        return NextResponse.json(
          { error: 'Album not found' },
          { status: 404 }
        );
      }
      if (spotifyResponse.status === 401) {
        return NextResponse.json(
          { 
            error: 'Spotify API authentication failed. The access token may have expired.',
            details: errorData.error?.message || errorData.raw || 'Unauthorized'
          },
          { status: 401 }
        );
      }
      const errorMessage = errorData.error?.message || `Spotify API error: ${spotifyResponse.status} ${spotifyResponse.statusText}`;
      throw new Error(errorMessage);
    }

    const albumData = await spotifyResponse.json();

    // Format the response
    const formattedData = {
      id: albumData.id,
      name: albumData.name,
      artists: albumData.artists?.map((artist: any) => artist.name).join(', ') || 'Unknown Artist',
      releaseDate: albumData.release_date,
      totalTracks: albumData.total_tracks,
      images: albumData.images || [],
      externalUrl: albumData.external_urls?.spotify || '',
      genres: albumData.genres || [],
      label: albumData.label || '',
      popularity: albumData.popularity || 0,
      tracks: albumData.tracks?.items?.map((track: any) => ({
        id: track.id,
        name: track.name,
        duration: track.duration_ms,
        trackNumber: track.track_number,
        artists: track.artists?.map((artist: any) => artist.name).join(', ') || '',
        previewUrl: track.preview_url || null,
        externalUrl: track.external_urls?.spotify || '',
      })) || [],
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching album:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch album details';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

