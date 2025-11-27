# Fix "INVALID_CLIENT: Invalid redirect URI" Error

## The Problem
Spotify requires the redirect URI in your app settings to **exactly match** the one used in your code.

## Current Redirect URI
Your app is using: `http://localhost:3000/api/spotify/callback`

## Steps to Fix

1. **Go to Spotify Developer Dashboard**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account

2. **Select Your App**
   - Click on your app (the one with Client ID: `aaf084b2e7a546179248446421e385f1`)

3. **Edit Settings**
   - Click the "Edit Settings" button

4. **Add Redirect URI**
   - In the "Redirect URIs" section, you need to add:
   ```
   http://localhost:3000/api/spotify/callback
   ```
   
   **Important Notes:**
   - Use `http://` NOT `https://`
   - No trailing slash
   - Exact path: `/api/spotify/callback`
   - Port must be `3000`

5. **Save Changes**
   - Click "Add" after entering the URI
   - Click "Save" at the bottom

6. **Wait a Few Seconds**
   - Spotify may take a few seconds to update

7. **Try Again**
   - Go back to your app and click "Sign in with Spotify"
   - It should work now!

## Common Mistakes to Avoid

❌ `https://localhost:3000/api/spotify/callback` (wrong protocol)
❌ `http://localhost:3000/api/spotify/callback/` (trailing slash)
❌ `http://localhost:3001/api/spotify/callback` (wrong port)
❌ `http://127.0.0.1:3000/api/spotify/callback` (different hostname)

✅ `http://localhost:3000/api/spotify/callback` (correct!)

## Verify Your .env.local

Make sure your `.env.local` file has:
```
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
```

## Still Not Working?

1. Check the browser console for the exact redirect URI being used
2. Check the terminal/console logs when clicking "Sign in with Spotify"
3. Make sure you saved the changes in Spotify dashboard
4. Try clearing browser cache and cookies
5. Restart your Next.js dev server after making changes

