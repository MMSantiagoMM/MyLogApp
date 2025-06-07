
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VideoData } from '@/lib/data';
import { extractYouTubeVideoId } from '@/lib/youtubeUtils';
import { Youtube, Link as LinkIcon, Trash2, Film, AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Back4App API Details
const BACK4APP_VIDEOS_CLASS_URL = "https://parseapi.back4app.com/classes/Videos"; // Specific to Videos class

// These will be populated from process.env on the client side after build
const CLIENT_APP_ID = process.env.NEXT_PUBLIC_BACK4APP_APP_ID;
const CLIENT_REST_API_KEY = process.env.NEXT_PUBLIC_BACK4APP_REST_API_KEY;

// Diagnostic logs - these will run when the module is loaded in the browser
console.log("[VideoHubPage] Static: NEXT_PUBLIC_BACK4APP_APP_ID:", CLIENT_APP_ID);
console.log("[VideoHubPage] Static: NEXT_PUBLIC_BACK4APP_REST_API_KEY:", CLIENT_REST_API_KEY);

export default function VideoHubPage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState<string>("");
  const [videoNameInput, setVideoNameInput] = useState<string>("");
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoData | null>(null);
  const { toast } = useToast();
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);

  const fetchVideos = useCallback(async () => {
    // Ensure we use the client-side resolved env vars
    const APP_ID = process.env.NEXT_PUBLIC_BACK4APP_APP_ID;
    const REST_API_KEY = process.env.NEXT_PUBLIC_BACK4APP_REST_API_KEY;

    if (!APP_ID || !REST_API_KEY) {
      console.error("[VideoHubPage] fetchVideos: Back4App credentials missing.");
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Back4App credentials not configured. Please check .env and restart the server.",
        duration: 10000,
      });
      setIsLoadingVideos(false);
      setCredentialsLoaded(false);
      return;
    }
    setCredentialsLoaded(true);
    setIsLoadingVideos(true);

    try {
      const response = await fetch(`${BACK4APP_VIDEOS_CLASS_URL}?order=-createdAt`, {
        method: 'GET',
        headers: {
          'X-Parse-Application-Id': APP_ID,
          'X-Parse-REST-API-Key': REST_API_KEY,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching videos from Back4App:", errorData);
        throw new Error(errorData.error || `Failed to fetch videos: ${response.statusText}`);
      }

      const data = await response.json();
      const fetchedVideos = data.results.map((item: any) => ({
        id: item.objectId,
        name: item.name,
        youtubeUrl: item.youtubeUrl,
        videoId: item.videoId,
        addedDate: item.createdAt,
      } as VideoData));
      setVideos(fetchedVideos);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      toast({
        variant: "destructive",
        title: "Error loading videos",
        description: error.message || "Could not load videos from the database.",
      });
    } finally {
      setIsLoadingVideos(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
    // Log credentials as accessed by this effect
    const currentAppId = process.env.NEXT_PUBLIC_BACK4APP_APP_ID;
    const currentRestApiKey = process.env.NEXT_PUBLIC_BACK4APP_REST_API_KEY;
    console.log("[VideoHubPage] useEffect: Initial NEXT_PUBLIC_BACK4APP_APP_ID:", currentAppId);
    console.log("[VideoHubPage] useEffect: Initial NEXT_PUBLIC_BACK4APP_REST_API_KEY:", currentRestApiKey);

    if (currentAppId && currentRestApiKey) {
      setCredentialsLoaded(true);
      fetchVideos();
    } else {
      console.warn("[VideoHubPage] useEffect: Back4App credentials not found in environment variables during initial mount. Video Hub will not function correctly.");
      setIsLoadingVideos(false);
      setCredentialsLoaded(false);
      // Toast for missing credentials will be shown by fetchVideos or the main render block
    }
  }, [fetchVideos]); // fetchVideos has `toast` as a dependency.


  const handleAddVideo = async () => {
    const APP_ID = process.env.NEXT_PUBLIC_BACK4APP_APP_ID;
    const REST_API_KEY = process.env.NEXT_PUBLIC_BACK4APP_REST_API_KEY;

    if (!APP_ID || !REST_API_KEY) {
      toast({ variant: "destructive", title: "Configuration Error", description: "Back4App credentials missing. Please check .env and restart server." });
      return;
    }
    if (!videoUrlInput.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "YouTube URL cannot be empty." });
      return;
    }

    const videoId = extractYouTubeVideoId(videoUrlInput);
    if (!videoId) {
      toast({ variant: "destructive", title: "Invalid URL", description: "Could not extract a valid YouTube Video ID." });
      return;
    }

    if (videos.some(v => v.videoId === videoId)) {
      toast({ variant: "destructive", title: "Duplicate Video", description: "This video has already been added." });
      return;
    }

    setIsSubmitting(true);
    const videoPayload = {
      name: videoNameInput.trim() || `Video: ${videoId}`, // Default name if not provided
      youtubeUrl: videoUrlInput,
      videoId: videoId,
    };

    try {
      const response = await fetch(BACK4APP_VIDEOS_CLASS_URL, {
        method: 'POST',
        headers: {
          'X-Parse-Application-Id': APP_ID,
          'X-Parse-REST-API-Key': REST_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error adding video to Back4App:", errorData);
        throw new Error(errorData.error || `Failed to add video: ${response.statusText}`);
      }

      // Instead of just calling fetchVideos(), optimistically update or re-fetch
      // For simplicity, re-fetching:
      await fetchVideos();

      setVideoUrlInput("");
      setVideoNameInput("");
      toast({
        title: "Video Added",
        description: `"${videoPayload.name}" has been added to your Video Hub.`,
      });
    } catch (error: any) {
      console.error("Error adding video:", error);
      toast({
        variant: "destructive",
        title: "Error Adding Video",
        description: error.message || "Could not add video to the database.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = (video: VideoData) => {
    setVideoToDelete(video);
  };

  const confirmDelete = async () => {
    const APP_ID = process.env.NEXT_PUBLIC_BACK4APP_APP_ID;
    const REST_API_KEY = process.env.NEXT_PUBLIC_BACK4APP_REST_API_KEY;

    if (videoToDelete && APP_ID && REST_API_KEY) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`${BACK4APP_VIDEOS_CLASS_URL}/${videoToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'X-Parse-Application-Id': APP_ID,
            'X-Parse-REST-API-Key': REST_API_KEY,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error deleting video from Back4App:", errorData);
          throw new Error(errorData.error || `Failed to delete video: ${response.statusText}`);
        }

        setVideos(prevVideos => prevVideos.filter(v => v.id !== videoToDelete.id));
        toast({
          title: "Video Removed",
          description: `"${videoToDelete.name}" has been removed.`,
        });
        setVideoToDelete(null);
      } catch (error: any) {
        console.error("Error deleting video:", error);
        toast({
          variant: "destructive",
          title: "Error Deleting Video",
          description: error.message || "Could not delete video.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Initializing Video Hub...</p>
      </div>
    );
  }

  if (isMounted && !credentialsLoaded && isLoadingVideos) {
     // This state happens briefly if credentials are not found by useEffect initially
     return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Checking Configuration...</p>
      </div>
    );
  }
  
  if (isMounted && !credentialsLoaded && !isLoadingVideos) {
    // Credentials were not found after initial check
    return (
       <div className="flex flex-col justify-center items-center h-full text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          Back4App API credentials (Application ID or REST API Key) are missing or could not be loaded.
        </p>
        <p className="text-muted-foreground mt-1">
          Please ensure <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">NEXT_PUBLIC_BACK4APP_APP_ID</code> and <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">NEXT_PUBLIC_BACK4APP_REST_API_KEY</code> are correctly set in your <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">.env</code> file.
        </p>
        <p className="text-muted-foreground mt-2 font-semibold">
          You MUST restart the Next.js development server after modifying the <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">.env</code> file.
        </p>
        <p className="text-muted-foreground mt-1">
          Check the browser console for diagnostic messages (e.g., "Static: NEXT_PUBLIC_BACK4APP_APP_ID: undefined").
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Youtube className="w-8 h-8 text-primary" />
        Video Hub (Back4App)
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <LinkIcon className="w-6 h-6" />
            Add YouTube Video
          </CardTitle>
          <CardDescription>
            Paste a YouTube video link to add it to your collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="url"
            placeholder="YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
            value={videoUrlInput}
            onChange={(e) => setVideoUrlInput(e.target.value)}
            disabled={isSubmitting || isLoadingVideos && videos.length > 0}
          />
          <Input
            type="text"
            placeholder="Optional: Custom Video Name"
            value={videoNameInput}
            onChange={(e) => setVideoNameInput(e.target.value)}
            disabled={isSubmitting || isLoadingVideos && videos.length > 0}
          />
          <Button onClick={handleAddVideo} className="w-full sm:w-auto" disabled={isSubmitting || (isLoadingVideos && videos.length > 0) }>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Youtube className="mr-2 h-4 w-4" />}
            Add Video
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">My Videos</CardTitle>
           {isLoadingVideos && videos.length > 0 && ( // Show refreshing only if there are already videos
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing video list...
            </div>
          )}
           {isLoadingVideos && videos.length === 0 && ( // Initial loading spinner
            <div className="flex items-center text-sm text-muted-foreground py-10 justify-center">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Loading videos from Back4App...
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!isLoadingVideos && videos.length === 0 && credentialsLoaded && ( // No videos and not loading, and creds were loaded
             <div className="text-center py-12 text-muted-foreground">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No Videos Yet</p>
                <p>Add YouTube video links using the form above to build your collection.</p>
            </div>
          )}
          {videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="flex flex-col overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold truncate" title={video.name}>
                      {video.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Added: {new Date(video.addedDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow p-0 aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${video.videoId}`}
                      title={video.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="block"
                    ></iframe>
                  </CardContent>
                  <CardFooter className="p-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteVideo(video)}
                      className="w-full"
                      aria-label={`Delete ${video.name}`}
                      disabled={isSubmitting}
                    >
                      {(isSubmitting && videoToDelete?.id === video.id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                       Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {videoToDelete && (
        <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently remove the video
                "{videoToDelete.name}" from your hub.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setVideoToDelete(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
