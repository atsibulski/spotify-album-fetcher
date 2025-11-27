import { NextRequest, NextResponse } from 'next/server';
import { getUserBySpotifyId } from '@/lib/db';
import { getUserShelves } from '@/lib/shelves';

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

    const user = getUserBySpotifyId(spotifyId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get shelves from server-side storage
    const shelves = getUserShelves(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        spotifyId: user.spotifyId,
        displayName: user.displayName,
        imageUrl: user.imageUrl,
      },
      shelves,
    });
  } catch (error) {
    console.error('Error fetching user shelves:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

