# Fix: INVALID_CLIENT: Invalid redirect URI

## The Problem
The redirect URI in your Spotify app settings doesn't match what the app is sending.

## Quick Fix

1. **Go to Spotify Developer Dashboard:**
   - Visit: https://developer.spotify.com/dashboard
   - Click on your app

2. **Edit App Settings:**
   - Click "Edit Settings" button
   - Scroll down to "Redirect URIs"

3. **Add the Redirect URI:**
   - Click "Add" or the "+" button
   - Enter exactly this (copy-paste to avoid typos):
     ```
     http://localhost:3000/api/spotify/callback
     ```
   - **Important:** 
     - No trailing slash
     - Must be `http://` (not `https://`) for localhost
     - Must be exactly: `http://localhost:3000/api/spotify/callback`

4. **Save:**
   - Click "Add" or "Save" button
   - Wait a few seconds for changes to propagate

5. **Verify in `.env.local`:**
   Make sure your `.env.local` file has:
   ```
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
   ```

6. **Restart your dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

7. **Try connecting again:**
   - Click "Connect to Spotify" button
   - It should work now!

## Common Mistakes to Avoid

❌ `http://localhost:3000` (missing `/api/spotify/callback`)
❌ `http://localhost:3000/` (trailing slash)
❌ `https://localhost:3000/api/spotify/callback` (using https)
❌ `http://127.0.0.1:3000/api/spotify/callback` (using 127.0.0.1 instead of localhost)

✅ `http://localhost:3000/api/spotify/callback` (correct!)

## Still Not Working?

1. **Check the exact error message** in the browser console
2. **Verify the redirect URI** in your Spotify app settings matches exactly
3. **Make sure you saved** the changes in Spotify dashboard
4. **Wait 1-2 minutes** after saving - Spotify sometimes takes a moment to update
5. **Clear browser cache** and try again

