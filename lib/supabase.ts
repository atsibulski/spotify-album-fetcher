import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log configuration status (only on server)
if (typeof window === 'undefined') {
  console.log('🔧 Supabase Configuration Check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing',
  });
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Using fallback storage.');
  console.warn('⚠️ Missing:', {
    url: !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    key: !supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
  });
}

// Create Supabase client (server-side only)
// Use a function to create fresh client instances to avoid connection pooling issues
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Don't persist session on server
    },
    db: {
      schema: 'public',
    },
  });
}

// Singleton for backward compatibility (but prefer getSupabaseClient() for new code)
export const supabase = supabaseUrl && supabaseAnonKey
  ? getSupabaseClient()
  : null;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (typeof window === 'undefined') {
  console.log('✅ Supabase client initialized:', isSupabaseConfigured);
}

