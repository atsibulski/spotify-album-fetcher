import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById } from '@/lib/db';
import { getUserShelves, saveUserShelves } from '@/lib/shelves';
import { Shelf } from '@/types/shelf';

// GET - Fetch current user's shelves
export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const shelves = getUserShelves(session.userId);
    return NextResponse.json({ shelves });
  } catch (error) {
    console.error('Error fetching shelves:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Save current user's shelves
export async function POST(request: NextRequest) {
  try {
    const session = getSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { shelves } = body as { shelves: Shelf[] };

    if (!Array.isArray(shelves)) {
      return NextResponse.json(
        { error: 'Invalid shelves data' },
        { status: 400 }
      );
    }

    // Use spotifyId from session for public access (more reliable than DB lookup)
    const spotifyId = session.spotifyId;
    saveUserShelves(session.userId, shelves, spotifyId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving shelves:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




