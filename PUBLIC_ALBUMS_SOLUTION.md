# Making Albums Visible on Public Profiles

## Current Issue

Albums are stored in:
1. **localStorage** (client-side) - Only visible to the owner
2. **Server in-memory storage** - Resets on each Vercel function invocation

This means albums are **not visible** to public viewers of profile pages.

## Why This Happens

Vercel uses **serverless functions** which:
- Have a read-only filesystem (can't write files)
- Reset memory on each function invocation
- Don't persist data between requests

## Solutions

### Option 1: Migrate to Database (Recommended) ⭐

Use a database to store shelves server-side:

#### A. Vercel Postgres (Easiest)
1. Go to Vercel → Your Project → Storage
2. Create a Postgres database
3. Update `lib/shelves.ts` to use Postgres instead of files
4. Albums will persist and be publicly accessible

#### B. Supabase (Free tier)
1. Sign up at [supabase.com](https://supabase.com)
2. Create a database
3. Update code to use Supabase client
4. Free tier includes 500MB database

#### C. MongoDB Atlas (Free tier)
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Update code to use MongoDB
4. Free tier includes 512MB storage

### Option 2: Use Vercel KV (Key-Value Store)

If available in your Vercel plan:
1. Go to Vercel → Storage → KV
2. Create a KV store
3. Store shelves as JSON in KV by spotifyId
4. Retrieve by spotifyId for public access

### Option 3: External API Storage

Use a service like:
- **Firebase Firestore** (free tier)
- **PlanetScale** (free tier)
- **Railway** (with persistent storage)

## Quick Fix: Database Migration Example

Here's how to update `lib/shelves.ts` to use a database:

```typescript
// Example with Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

export async function getUserShelvesBySpotifyId(spotifyId: string): Promise<Shelf[]> {
  const { data, error } = await supabase
    .from('user_shelves')
    .select('shelves')
    .eq('spotify_id', spotifyId)
    .single();
  
  if (error || !data) return [];
  return data.shelves || [];
}

export async function saveUserShelves(userId: string, shelves: Shelf[], spotifyId?: string): Promise<void> {
  await supabase
    .from('user_shelves')
    .upsert({
      user_id: userId,
      spotify_id: spotifyId,
      shelves: shelves,
      updated_at: new Date().toISOString(),
    });
}
```

## Current Workaround

For now, albums are only visible to:
- ✅ The owner (when signed in) - from localStorage
- ❌ Public viewers - empty shelves (server storage resets)

## Next Steps

1. **Choose a database solution** (Vercel Postgres recommended)
2. **Update `lib/shelves.ts`** to use database instead of files
3. **Update `lib/db.ts`** to use database for users
4. **Deploy** - albums will then be publicly visible!

---

## Database Schema Example

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  spotify_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### User Shelves Table
```sql
CREATE TABLE user_shelves (
  user_id TEXT REFERENCES users(id),
  spotify_id TEXT UNIQUE NOT NULL,
  shelves JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (spotify_id)
);
```

This allows:
- Public access by `spotify_id`
- Persistent storage
- Fast queries
- Scalable solution

