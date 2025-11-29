import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    
    const debugInfo: any = {
      supabaseConfigured: isSupabaseConfigured,
      hasSupabaseClient: !!supabase,
      hasSession: !!session,
      spotifyId: session?.spotifyId,
    };

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({
        ...debugInfo,
        error: 'Supabase not configured',
        message: 'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables',
      });
    }

    // Test query to check if tables exist
    if (session?.spotifyId) {
      try {
        const { data: shelvesData, error: shelvesError } = await supabase
          .from('user_shelves')
          .select('*')
          .eq('spotify_id', session.spotifyId)
          .single();

        debugInfo.shelvesQuery = {
          hasData: !!shelvesData,
          shelvesCount: shelvesData?.shelves?.length || 0,
          totalAlbums: shelvesData?.shelves?.reduce((sum: number, s: any) => sum + (s.albums?.length || 0), 0) || 0,
          error: shelvesError?.message,
          code: shelvesError?.code,
        };

        // Also check all shelves
        const { data: allShelves, error: allError } = await supabase
          .from('user_shelves')
          .select('spotify_id, updated_at');

        debugInfo.allShelves = {
          count: allShelves?.length || 0,
          spotifyIds: allShelves?.map((s: any) => s.spotify_id) || [],
          error: allError?.message,
        };
      } catch (error: any) {
        debugInfo.queryError = error.message;
      }
    }

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error.message,
    }, { status: 500 });
  }
}

