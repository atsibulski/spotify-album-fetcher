# Spotify Album Fetcher

A Next.js application that fetches album artwork and details from the Spotify API. Simply enter a Spotify album URL and get comprehensive information about the album.

## Features

- 🎵 Fetch album details from Spotify
- 🖼️ Display high-quality album artwork
- 📋 Show complete track listing
- ▶️ Play full tracks directly on the site (requires Spotify Premium)
- 🎧 30-second preview playback for tracks without Premium
- 🔐 Connect to Spotify account for full track playback
- 🎨 Beautiful, modern UI with dark theme
- ⚡ Fast and responsive

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get Spotify API credentials:**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Copy your Client ID and Client Secret

3. **Configure environment variables:**
   - Copy `env.example` to `.env.local`
   - Add your Spotify credentials:
     ```
     SPOTIFY_CLIENT_ID=your_client_id_here
     SPOTIFY_CLIENT_SECRET=your_client_secret_here
     SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
     ```
   - **Important:** Make sure the redirect URI in your Spotify app settings matches `http://localhost:3000/api/spotify/callback`

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a Spotify album URL in the input field (e.g., `https://open.spotify.com/album/...`)
2. Click "Fetch Album"
3. View the album artwork, details, and track listing
4. **To play full tracks:**
   - Click "Connect to Spotify" button (requires Spotify Premium account)
   - Authorize the app
   - Click play on any track to play the full song directly on the site
5. **Without Premium:** Tracks with previews will play 30-second previews

## Supported URL Formats

- `https://open.spotify.com/album/ALBUM_ID`
- `spotify:album:ALBUM_ID`
- URLs with query parameters are also supported

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Spotify Web API** - Album data
- **Spotify Web Playback SDK** - Full track playback

## Project Structure

```
├── app/
│   ├── api/
│   │   └── spotify/
│   │       ├── token/route.ts    # Get Spotify access token
│   │       └── album/route.ts     # Fetch album details
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Main page
├── components/
│   └── AlbumDisplay.tsx           # Album display component
└── ...
```

## License

MIT

