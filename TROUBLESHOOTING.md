# Troubleshooting Guide

## Quick Diagnostics

### 1. Check What's Broken

**What exactly stopped working?**
- [ ] Albums not showing on public profile?
- [ ] Can't add new albums?
- [ ] Getting error messages?
- [ ] Profile page shows "Loading..." forever?
- [ ] Albums disappeared?

### 2. Check Vercel Logs

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click latest deployment → **Functions** tab
3. Look for errors (red text) or warnings (yellow text)

**Common errors to look for:**
- `❌ Supabase upsert failed`
- `⚠️ Supabase not configured`
- `❌ Supabase save exception`
- `Connection timeout`
- `Rate limit exceeded`

### 3. Check Supabase Status

1. Go to: https://supabase.com/dashboard/project/spotify-base
2. Check **Table Editor** → `user_shelves` table
3. Do you see your data? (should see rows with your `spotify_id`)

### 4. Test Debug Endpoint

Visit (while signed in):
```
https://spotify-album-fetcher.vercel.app/api/debug/supabase
```

**What should you see?**
```json
{
  "supabaseConfigured": true,
  "hasSupabaseClient": true,
  "hasSession": true,
  "spotifyId": "escapehawaii",
  "shelvesQuery": {
    "hasData": true,
    "shelvesCount": 1,
    "totalAlbums": 5
  }
}
```

---

## Common Issues & Fixes

### Issue 1: Supabase Connection Timeout

**Symptoms:**
- Works initially, then stops
- Timeout errors in logs
- Intermittent failures

**Possible Causes:**
- Supabase free tier connection limits
- Cold start delays
- Network issues

**Fix:**
- Add connection pooling
- Add retry logic
- Check Supabase dashboard for service status

### Issue 2: Environment Variables Lost

**Symptoms:**
- `⚠️ Supabase not configured` in logs
- Works locally but not on Vercel

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist
3. Make sure they're enabled for **Production**
4. Redeploy

### Issue 3: Supabase Free Tier Limits

**Symptoms:**
- Works for a while, then stops
- Rate limit errors
- Connection refused

**Check:**
- Go to Supabase Dashboard → Settings → Usage
- Check if you've hit any limits

**Fix:**
- Upgrade Supabase plan
- Or optimize queries (add caching)

### Issue 4: Database Connection Pool Exhausted

**Symptoms:**
- Works initially, fails after multiple requests
- Connection errors

**Fix:**
- Supabase client might need connection pooling
- Or recreate client per request (not ideal but works)

### Issue 5: Row Level Security (RLS) Issues

**Symptoms:**
- Can't read shelves
- Permission denied errors

**Fix:**
- Check RLS policies in Supabase
- Verify policies allow public SELECT

---

## Quick Fixes to Try

### Fix 1: Recreate Supabase Client Per Request

If connection is timing out, recreate the client:

```typescript
// Instead of singleton, create per request
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
```

### Fix 2: Add Retry Logic

Add retries for failed Supabase operations:

```typescript
async function retryOperation(operation: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Fix 3: Add Connection Health Check

Check Supabase connection before operations:

```typescript
async function checkSupabaseHealth() {
  try {
    const { error } = await supabase.from('user_shelves').select('spotify_id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
```

---

## Get Help

**Share these details:**
1. What exactly stopped working?
2. Error messages from Vercel logs
3. What you see in `/api/debug/supabase`
4. Screenshot of Supabase Table Editor (if possible)

