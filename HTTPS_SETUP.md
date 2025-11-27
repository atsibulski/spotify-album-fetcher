# Setting Up HTTPS for Local Development

Since your Spotify app uses `https://localhost:3000`, you need to run Next.js with HTTPS.

## Option 1: Use HTTP with 127.0.0.1 (Easier - Recommended)

Spotify allows HTTP for `127.0.0.1` (but not `localhost`). This is the easiest solution:

1. **Update Spotify App Settings:**
   - Change redirect URI to: `http://127.0.0.1:3000/api/spotify/callback`

2. **Update .env.local:**
   ```
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback
   ```

3. **Access your app at:** `http://127.0.0.1:3000`

## Option 2: Set Up HTTPS for Next.js (More Complex)

If you need HTTPS, you'll need SSL certificates:

1. **Install mkcert** (for local SSL certificates):
   ```bash
   # macOS
   brew install mkcert
   brew install nss  # for Firefox
   
   # Create local CA
   mkcert -install
   
   # Generate certificates
   mkcert localhost 127.0.0.1
   ```

2. **Update package.json** to use HTTPS:
   ```json
   "scripts": {
     "dev": "next dev --experimental-https"
   }
   ```

3. **Or use a custom server** with HTTPS certificates

## Option 3: Use HTTP (If Spotify Allows It)

Some Spotify accounts still allow HTTP for localhost. Try:
- `http://localhost:3000/api/spotify/callback`

## Current Recommendation

**Use Option 1** - It's the simplest and most reliable:
- Update Spotify dashboard to use `http://127.0.0.1:3000/api/spotify/callback`
- Update `.env.local` to match
- Access app at `http://127.0.0.1:3000`

