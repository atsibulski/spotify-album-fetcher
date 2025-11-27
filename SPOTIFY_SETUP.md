# Spotify API Setup

## The Problem
If you're seeing "Failed to fetch album details" or authentication errors, you need to set up your Spotify API credentials.

## Quick Setup Steps

1. **Go to Spotify Developer Dashboard:**
   - Visit: https://developer.spotify.com/dashboard
   - Log in with your Spotify account (or create one if needed)

2. **Create a New App:**
   - Click the green "Create app" button
   - Fill in:
     - **App name**: `Spotify Album Fetcher` (or any name you like)
     - **App description**: (optional)
     - **Redirect URI**: `http://localhost:3000/api/spotify/callback` (for OAuth - required for full track playback)
   - Check the terms checkbox
   - Click "Save"

3. **Get Your Credentials:**
   - After creating the app, you'll see your app dashboard
   - Click "View client secret" to reveal it
   - Copy both:
     - **Client ID** (visible immediately)
     - **Client Secret** (click to reveal)

4. **Create `.env.local` File:**
   ```bash
   cd /Users/user/Documents/spot
   cp env.example .env.local
   ```

5. **Add Your Credentials:**
   Open `.env.local` in a text editor and replace the placeholders:
   ```
   SPOTIFY_CLIENT_ID=your_actual_client_id_here
   SPOTIFY_CLIENT_SECRET=your_actual_client_secret_here
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
   ```
   
   **Important:** 
   - Don't use quotes around the values
   - Don't add spaces around the `=` sign
   - Make sure there are no extra spaces or characters
   - The redirect URI must match exactly what you entered in the Spotify app settings

6. **Restart the Development Server:**
   - Stop the current server (Ctrl+C)
   - Start it again:
     ```bash
     npm run dev
     ```

7. **Test It:**
   - Try fetching an album again
   - The error messages should now be more specific if something is still wrong

## Troubleshooting

- **"Spotify API credentials not configured"**: Make sure `.env.local` exists and has both `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
- **"Failed to get access token"**: Check that your credentials are correct (no typos, no extra spaces)
- **"401 Unauthorized"**: Your credentials might be invalid - double-check them in the Spotify dashboard
- **"Album not found"**: The album ID might be invalid, or the album might not be available in your region

## Security Note

Never commit `.env.local` to git! It's already in `.gitignore` to protect your credentials.

