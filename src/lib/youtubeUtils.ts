
/**
 * Extracts the YouTube video ID from various URL formats.
 * @param url The YouTube URL.
 * @returns The video ID string, or null if not found.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) {
    return null;
  }

  // This single regex is designed to capture the 11-character video ID
  // from a wide variety of YouTube URL formats.
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
  
  const match = url.match(regExp);

  // The video ID is the second captured group.
  if (match && match[2].length === 11) {
    return match[2];
  }
  
  console.warn("[youtubeUtils] Could not extract a valid YouTube video ID from URL:", url);
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
