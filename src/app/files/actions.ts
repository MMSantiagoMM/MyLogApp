
'use server';

import { query } from '@/lib/postgres';
import type { VideoData } from '@/lib/data';
import { extractYouTubeVideoId } from '@/lib/youtubeUtils';
import { revalidatePath } from 'next/cache';

export interface AddVideoResult {
  success: boolean;
  video?: VideoData;
  error?: string;
}

export interface DeleteVideoResult {
  success: boolean;
  error?: string;
}

export async function fetchVideosAction(): Promise<VideoData[]> {
  try {
    const result = await query('SELECT id, name, "youtubeUrl", "videoId", "createdAt", "updatedAt" FROM videos ORDER BY "createdAt" DESC');
    return result.rows.map(row => ({
      id: String(row.id), // Ensure ID is a string
      name: row.name,
      youtubeUrl: row.youtubeUrl,
      videoId: row.videoId,
      addedDate: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(), // Using 'addedDate' to match existing client component
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
    }));
  } catch (error: any) {
    console.error('[actions.ts] Error fetching videos from PostgreSQL:', error);
    // In a real app, you might want to throw a more specific error or return an empty array with a logged error
    return [];
  }
}

export async function addVideoAction(name: string, youtubeUrl: string): Promise<AddVideoResult> {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    return { success: false, error: 'Invalid YouTube URL or could not extract video ID.' };
  }

  const videoName = name.trim() || `Video ${videoId}`; // Default name if not provided

  try {
    const result = await query(
      'INSERT INTO videos (name, "youtubeUrl", "videoId") VALUES ($1, $2, $3) RETURNING id, name, "youtubeUrl", "videoId", "createdAt", "updatedAt"',
      [videoName, youtubeUrl, videoId]
    );
    if (result.rows.length > 0) {
      const newVideo = result.rows[0];
      revalidatePath('/files'); // Revalidate the cache for the video hub page
      return {
        success: true,
        video: {
          id: String(newVideo.id),
          name: newVideo.name,
          youtubeUrl: newVideo.youtubeUrl,
          videoId: newVideo.videoId,
          addedDate: newVideo.createdAt ? new Date(newVideo.createdAt).toISOString() : new Date().toISOString(),
          createdAt: newVideo.createdAt ? new Date(newVideo.createdAt).toISOString() : undefined,
          updatedAt: newVideo.updatedAt ? new Date(newVideo.updatedAt).toISOString() : undefined,
        },
      };
    }
    return { success: false, error: 'Failed to add video to database.' };
  } catch (error: any) {
    console.error('[actions.ts] Error adding video to PostgreSQL:', error);
    if (error.code === '23505') { // Unique constraint violation (e.g., duplicate videoId)
      return { success: false, error: 'This video (based on ID) already exists in the hub.' };
    }
    return { success: false, error: error.message || 'An unexpected error occurred while adding the video.' };
  }
}

export async function deleteVideoAction(id: string): Promise<DeleteVideoResult> {
  try {
    // Ensure ID is an integer if your 'id' column is an integer type like SERIAL
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
        return { success: false, error: 'Invalid video ID format.'};
    }
    const result = await query('DELETE FROM videos WHERE id = $1 RETURNING id', [numericId]);
    if (result.rowCount > 0) {
      revalidatePath('/files'); // Revalidate the cache for the video hub page
      return { success: true };
    }
    return { success: false, error: 'Video not found or failed to delete.' };
  } catch (error: any) {
    console.error('[actions.ts] Error deleting video from PostgreSQL:', error);
    return { success: false, error: error.message || 'An unexpected error occurred while deleting the video.' };
  }
}
