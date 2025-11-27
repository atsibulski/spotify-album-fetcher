# Debug Redirect URI Issue

## Steps to Debug

1. **Restart your dev server** (important - it needs to reload .env.local):
   ```bash
   # Stop the server (Ctrl+C) and restart:
   npm run dev
   ```

2. **Check the terminal logs** when you click "Sign in with Spotify":
   - Look for: `📋 Redirect URI being sent to Spotify:`
   - This shows the exact URI being sent

3. **Verify Spotify Dashboard**:
   - Go to https://developer.spotify.com/dashboard
   - Click your app "spotishelf"
   - Click "Edit Settings"
   - Check the **exact** redirect URI listed
   - It must be: `http://127.0.0.1:3000/api/spotify/callback`
   - No trailing slash, exact match

4. **Common Issues**:
   - ❌ `http://127.0.0.1:3000/api/spotify/callback/` (trailing slash)
   - ❌ `http://127.0.0.1:3000/api/spotify/callback ` (trailing space)
   - ❌ `https://127.0.0.1:3000/api/spotify/callback` (wrong protocol)
   - ✅ `http://127.0.0.1:3000/api/spotify/callback` (correct!)

5. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Click "Sign in with Spotify"
   - Check for any errors or the auth URL being logged

6. **Verify .env.local**:
   ```bash
   cat .env.local | grep SPOTIFY_REDIRECT_URI
   ```
   Should show: `SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback`

## If Still Not Working

Share the terminal output when you click "Sign in with Spotify" - it will show the exact redirect URI being sent.

