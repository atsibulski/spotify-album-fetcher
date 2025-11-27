# Fix Spotify Redirect URI

## Update Your Spotify App Settings

1. Go to https://developer.spotify.com/dashboard
2. Click your app "spotishelf"
3. Click "Edit Settings"
4. In "Redirect URIs", **remove** the HTTPS ones and **add**:
   ```
   http://127.0.0.1:3000/api/spotify/callback
   ```
5. Click "Add" then "Save"

## Why 127.0.0.1?

Spotify allows HTTP for `127.0.0.1` but not for `localhost`. This is the easiest solution that works with Next.js default HTTP server.

## Access Your App

After updating, access your app at:
- `http://127.0.0.1:3000` (instead of `http://localhost:3000`)

The redirect URI in `.env.local` has been updated to match.

