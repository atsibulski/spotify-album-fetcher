# Supabase Setup Guide

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project: https://supabase.com/dashboard/project/spotify-base
2. Click **Settings** (gear icon) → **API**
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

## Step 2: Create Database Tables

Go to **SQL Editor** in Supabase dashboard and run this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  spotify_id TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  image_url TEXT,
  spotify_access_token TEXT,
  spotify_refresh_token TEXT,
  token_expires_at BIGINT,
  preferences JSONB DEFAULT '{"theme":"dark","defaultView":"grid","autoPlay":false}'::jsonb,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Create user_shelves table
CREATE TABLE IF NOT EXISTS user_shelves (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  spotify_id TEXT UNIQUE NOT NULL PRIMARY KEY,
  shelves JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at BIGINT NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);
CREATE INDEX IF NOT EXISTS idx_shelves_spotify_id ON user_shelves(spotify_id);

-- Enable Row Level Security (RLS) - make shelves publicly readable
ALTER TABLE user_shelves ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read shelves (public access)
CREATE POLICY "Shelves are publicly readable"
  ON user_shelves
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to insert/update their own shelves
CREATE POLICY "Users can manage their own shelves"
  ON user_shelves
  FOR ALL
  USING (true); -- Simplified for now, can add auth check later
```

## Step 3: Add Environment Variables

### In Vercel:

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add these variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (your anon key)
   ```

3. Make sure to select **Production**, **Preview**, and **Development**
4. Click **Save**

### Locally (optional):

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Step 4: Deploy

After adding environment variables, Vercel will auto-deploy, or you can:
1. Push a commit to trigger deployment
2. Or manually redeploy in Vercel dashboard

## Step 5: Test

1. Sign in to your app
2. Add some albums
3. Visit your public profile: `https://spotify-album-fetcher.vercel.app/your-spotify-id`
4. Albums should now be visible to everyone!

---

## Troubleshooting

### "Supabase credentials not configured"
- Check environment variables are set in Vercel
- Make sure variable names are exact: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Redeploy after adding variables

### "relation does not exist"
- Run the SQL script in Supabase SQL Editor
- Check table names match exactly

### Albums still not showing
- Check Supabase dashboard → Table Editor → `user_shelves` table
- Verify data is being saved
- Check Vercel logs for errors

---

## Database Schema

### users table
- `id` - Primary key (internal user ID)
- `spotify_id` - Unique Spotify user ID (for public profiles)
- `email`, `display_name`, `image_url` - User info
- `spotify_access_token`, `spotify_refresh_token` - Auth tokens
- `preferences` - User preferences (JSON)
- `created_at`, `updated_at` - Timestamps

### user_shelves table
- `user_id` - Foreign key to users
- `spotify_id` - Primary key (for public access)
- `shelves` - JSON array of shelves/albums
- `updated_at` - Last update timestamp

