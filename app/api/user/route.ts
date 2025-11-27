import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getUserById, updateUser } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await getUserById(session.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data (excluding sensitive tokens)
    return NextResponse.json({
      id: user.id,
      spotifyId: user.spotifyId,
      email: user.email,
      displayName: user.displayName,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = getSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { displayName, preferences } = body;

    const updates: any = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (preferences !== undefined) updates.preferences = preferences;

    const updatedUser = await updateUser(session.userId, updates);
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updatedUser.id,
      spotifyId: updatedUser.spotifyId,
      email: updatedUser.email,
      displayName: updatedUser.displayName,
      imageUrl: updatedUser.imageUrl,
      createdAt: updatedUser.createdAt,
      preferences: updatedUser.preferences,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

