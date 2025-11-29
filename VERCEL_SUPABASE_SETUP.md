# Vercel Supabase Setup Guide

Since you created Supabase via Vercel, the integration should be partially set up. Let's complete the configuration:

## Step 1: Verify Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Check if these variables exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional, for admin operations)

If they're missing, you need to get them from Supabase:

### Get Supabase Credentials

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard/project/spotify-base
2. Click **Settings** (gear icon) → **API**
3. Copy:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Add them to Vercel Environment Variables (if not already there)
5. Make sure they're enabled for **Production**, **Preview**, and **Development**

## Step 2: Create Database Tables

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard/project/spotify-base
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Paste and run this SQL:

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
  USING (true);
```

5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

## Step 3: Verify Tables Were Created

1. In Supabase Dashboard, go to **Table Editor** (left sidebar)
2. You should see two tables:
   - `users`
   - `user_shelves`

## Step 4: Redeploy on Vercel

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or push a commit to trigger auto-deployment

## Step 5: Test

After redeployment:

1. **Sign in** to your app
2. **Add some albums**
3. **Open an incognito/private window** (or different browser)
4. **Visit**: `https://spotify-album-fetcher.vercel.app/escapehawaii`
5. Albums should now be visible! 🎉

## Troubleshooting

### "relation does not exist"
- Make sure you ran the SQL script in Supabase SQL Editor
- Check that tables appear in Table Editor

### "Supabase credentials not configured"
- Verify environment variables are set in Vercel
- Make sure variable names are exact: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Redeploy after adding variables

### Albums still not showing
- Check Supabase Dashboard → **Table Editor** → `user_shelves` table
- Verify data is being saved (should see rows after adding albums)
- Check Vercel logs for errors

### Check Vercel Logs
1. Go to Vercel → Your Project → **Deployments**
2. Click on a deployment
3. Click **Functions** tab
4. Check for any Supabase connection errors

---

## Quick Test Query

To verify Supabase is working, you can run this in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_shelves');

-- Should return:
-- users
-- user_shelves
```

