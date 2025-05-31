
/**
 * Extracts the YouTube video ID from various URL formats.
 * @param url The YouTube URL.
 * @returns The video ID string, or null if not found.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.pathname.startsWith('/embed/')) {
        videoId = urlObj.pathname.split('/embed/')[1].split('?')[0];
      } else if (urlObj.pathname.startsWith('/v/')) {
        videoId = urlObj.pathname.split('/v/')[1].split('?')[0];
      }
    }
  } catch (e) {
    // Fallback for non-standard or partial URLs, try regex
  }

  // Regex fallback if URL object parsing fails or for other formats
  if (!videoId) {
    const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const matches = url.match(regex);
    if (matches && matches[1]) {
      videoId = matches[1];
    }
  }
  
  // Final check for 11-character ID
  if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return videoId;
  }

  return null;
}

/**
 * Generates a YouTube thumbnail URL.
 * @param videoId The YouTube video ID.
 * @param quality The desired thumbnail quality.
 * @returns The thumbnail URL string.
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'mqdefault'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
