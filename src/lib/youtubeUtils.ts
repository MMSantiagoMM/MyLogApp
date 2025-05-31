
/**
 * Extracts the YouTube video ID from various URL formats.
 * @param url The YouTube URL.
 * @returns The video ID string, or null if not found.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  let videoId = null;
  try {
    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }
    const urlObj = new URL(fullUrl);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.substring(1).split('?')[0].split('&')[0];
    } else if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('www.youtube.com')) {
      if (urlObj.pathname === '/watch') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.pathname.startsWith('/embed/')) {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length > 2 && pathParts[1] === 'embed') {
          videoId = pathParts[2].split('?')[0].split('&')[0];
        }
      } else if (urlObj.pathname.startsWith('/v/')) {
         const pathParts = urlObj.pathname.split('/');
        if (pathParts.length > 2 && pathParts[1] === 'v') {
          videoId = pathParts[2].split('?')[0].split('&')[0];
        }
      } else if (urlObj.pathname.startsWith('/shorts/')) {
        const pathParts = urlObj.pathname.split('/');
        if (pathParts.length > 2 && pathParts[1] === 'shorts') {
          videoId = pathParts[2].split('?')[0].split('&')[0];
        }
      }
    }
  } catch (e) {
    console.error("[youtubeUtils] Error parsing URL with new URL() constructor:", e, "Original URL:", url);
    // Fallback to regex will be attempted below
  }

  // Regex fallback if URL object parsing fails or for other formats
  if (!videoId) {
    const regexPatterns = [
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|\S*?[?&]vi=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const regex of regexPatterns) {
        const matches = url.match(regex);
        if (matches && matches[1]) {
            videoId = matches[1];
            break; 
        }
    }
  }
  
  // Final check for 11-character ID
  if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return videoId;
  }
  if (videoId) { 
      console.warn("[youtubeUtils] Extracted videoId ('" + videoId + "') does not match expected 11-character format. Original URL:", url);
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

