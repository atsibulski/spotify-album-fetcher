import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing Spotify credentials:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdLength: clientId?.length || 0,
      clientSecretLength: clientSecret?.length || 0
    });
    return NextResponse.json(
      { 
        error: 'Spotify API credentials not configured',
        details: 'Please check your .env.local file and make sure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set'
      },
      { status: 500 }
    );
  }
  
  // Log that credentials are present (but not the actual values)
  console.log('Spotify credentials found, attempting authentication...');

  try {
    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
    console.log('Making token request to Spotify...');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authHeader,
      },
      body: 'grant_type=client_credentials',
    });

    console.log('Spotify token response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      
      console.error('Spotify token error details:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        clientIdLength: clientId.length,
        clientSecretLength: clientSecret.length,
        clientIdStart: clientId.substring(0, 4) + '...',
      });
      
      // Provide more specific error messages
      if (response.status === 401) {
        return NextResponse.json(
          { 
            error: 'Invalid Spotify API credentials. Please check your Client ID and Client Secret in .env.local',
            details: errorData.error_description || errorData.error || errorData.raw || 'Invalid client credentials'
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `Spotify authentication failed: ${errorData.error_description || errorData.error || response.statusText}`,
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Successfully obtained access token');
    return NextResponse.json({ access_token: data.access_token });
  } catch (error) {
    console.error('Exception while fetching Spotify token:', error);
    return NextResponse.json(
      { 
        error: 'Failed to authenticate with Spotify',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

