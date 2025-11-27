/**
 * Convert a Spotify web URL to a Spotify URI scheme
 * Examples:
 * - https://open.spotify.com/album/ABC123 -> spotify:album:ABC123
 * - https://open.spotify.com/track/XYZ789 -> spotify:track:XYZ789
 */
export function convertToSpotifyUri(webUrl: string): string | null {
  // Extract type and ID from web URL
  const albumMatch = webUrl.match(/open\.spotify\.com\/album\/([a-zA-Z0-9]+)/);
  if (albumMatch) {
    return `spotify:album:${albumMatch[1]}`;
  }

  const trackMatch = webUrl.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (trackMatch) {
    return `spotify:track:${trackMatch[1]}`;
  }

  const artistMatch = webUrl.match(/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  if (artistMatch) {
    return `spotify:artist:${artistMatch[1]}`;
  }

  const playlistMatch = webUrl.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  if (playlistMatch) {
    return `spotify:playlist:${playlistMatch[1]}`;
  }

  return null;
}

/**
 * Open a Spotify link, trying the desktop app first, then falling back to web
 */
export function openSpotifyLink(webUrl: string, fallbackUrl?: string): void {
  const spotifyUri = convertToSpotifyUri(webUrl);
  const urlToOpen = fallbackUrl || webUrl;

  if (spotifyUri) {
    // Try to open in Spotify app first
    // Create a hidden link element to trigger the URI scheme
    const link = document.createElement('a');
    link.href = spotifyUri;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    try {
      link.click();
      // Remove the link after clicking
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 100);
      
      // Also open web URL as fallback (in a new tab)
      // The URI scheme will try the app, and if the app isn't installed/available,
      // the web URL will open in the browser
      setTimeout(() => {
        window.open(urlToOpen, '_blank');
      }, 300);
    } catch (error) {
      // If URI scheme fails, fall back to web URL
      console.warn('Failed to open Spotify URI, falling back to web URL:', error);
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.open(urlToOpen, '_blank');
    }
  } else {
    // If we can't convert to URI, just open the web URL
    window.open(urlToOpen, '_blank');
  }
}

/**
 * Open Spotify link directly using URI scheme (for known IDs)
 * Also opens web URL as fallback
 */
export function openSpotifyUri(type: 'album' | 'track' | 'artist' | 'playlist', id: string, webUrl?: string): void {
  const uri = `spotify:${type}:${id}`;
  const fallbackUrl = webUrl || `https://open.spotify.com/${type}/${id}`;
  
  const link = document.createElement('a');
  link.href = uri;
  link.style.display = 'none';
  document.body.appendChild(link);
  
  try {
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 100);
    
    // Also open web URL as fallback
    setTimeout(() => {
      window.open(fallbackUrl, '_blank');
    }, 300);
  } catch (error) {
    console.warn('Failed to open Spotify URI:', error);
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    window.open(fallbackUrl, '_blank');
  }
}

