/**
 * Podcast utility functions
 */

/**
 * Extracts the Spotify show ID from a Spotify URL (including YouTube redirect URLs)
 */
function extractSpotifyShowId(url: string): string | null {
  try {
    // Handle YouTube redirect URLs
    if (url.includes('youtube.com/redirect')) {
      const urlObj = new URL(url);
      const redirectUrl = urlObj.searchParams.get('q');
      if (redirectUrl) {
        url = decodeURIComponent(redirectUrl);
      }
    }
    
    // Extract show ID from Spotify URL
    const match = url.match(/spotify\.com\/show\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Converts a Spotify show URL to an embed URL
 */
function getSpotifyEmbedUrl(url: string): string | null {
  const showId = extractSpotifyShowId(url);
  return showId ? `https://open.spotify.com/embed/show/${showId}` : null;
}

/**
 * Converts an Apple Podcasts URL to an embed URL
 */
function getApplePodcastsEmbedUrl(url: string): string | null {
  try {
    // Apple Podcasts embed URLs just need to change the subdomain
    if (url.includes('podcasts.apple.com')) {
      return url.replace('podcasts.apple.com', 'embed.podcasts.apple.com');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Gets the embed URL for a show based on platform
 */
export function getShowEmbedUrl(
  platform: 'spotify' | 'apple' | 'castos',
  spotifyUrl?: string,
  applePodcastsUrl?: string
): string {
  if (platform === 'castos') {
    // Castos URLs are provided directly via castosPlaylistUrl
    return '';
  }
  
  if (platform === 'spotify' && spotifyUrl) {
    const embedUrl = getSpotifyEmbedUrl(spotifyUrl);
    if (embedUrl) return embedUrl;
  }
  
  if (platform === 'apple' && applePodcastsUrl) {
    const embedUrl = getApplePodcastsEmbedUrl(applePodcastsUrl);
    if (embedUrl) return embedUrl;
  }
  
  // Fallback to placeholder
  return 'https://open.spotify.com/embed/show/placeholder';
}
