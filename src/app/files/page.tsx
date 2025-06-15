
"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { VideoData } from '@/lib/data'; // Ensure this interface matches your needs
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
import { fetchVideosAction, addVideoAction, deleteVideoAction } from './actions';

// Check for POSTGRES_URL presence (only for client-side guidance, actual connection is server-side)
const POSTGRES_URL_CLIENT_CHECK = process.env.NEXT_PUBLIC_POSTGRES_URL_FOR_CLIENT_CHECK; // This won't exist by default

export default function VideoHubPage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState<string>("");
  const [videoNameInput, setVideoNameInput] = useState<string>("");
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoData | null>(null);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition(); // For Server Actions

  const [postgresConfiguredClientCheck, setPostgresConfiguredClientCheck] = useState(false);


  const loadVideos = useCallback(async () => {
    setIsLoadingVideos(true);
    try {
      const fetchedVideos = await fetchVideosAction();
      // Sort by date, assuming addedDate is a valid ISO string or Date object
      fetchedVideos.sort((a, b) => new Date(b.addedDate || 0).getTime() - new Date(a.addedDate || 0).getTime());
      setVideos(fetchedVideos);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      toast({
        variant: "destructive",
        title: "Error loading videos",
        description: error.message || "Could not load videos from the database.",
      });
      setVideos([]);
    } finally {
      setIsLoadingVideos(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
    // This client-side check is illustrative; actual DB connection happens server-side.
    // For a real check, you might have a server action that confirms DB connectivity.
    if (POSTGRES_URL_CLIENT_CHECK || typeof window !== 'undefined') { // A simple way to assume config exists if not explicitly checking
        setPostgresConfiguredClientCheck(true); 
        loadVideos();
    } else {
        console.warn("[VideoHubPage] POSTGRES_URL seems not configured for client-side checks. This is informational; actual connection is server-side.");
        setIsLoadingVideos(false);
        setPostgresConfiguredClientCheck(false); // Or true if you want to proceed assuming server has it
    }
  }, [loadVideos]);


  const handleAddVideo = async () => {
    if (!videoUrlInput.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Video URL cannot be empty." });
      return;
    }
    const videoId = extractYouTubeVideoId(videoUrlInput);
    if (!videoId) {
      toast({ variant: "destructive", title: "Invalid URL", description: "Could not extract YouTube video ID. Please check the URL." });
      return;
    }
    
    const nameToSave = videoNameInput.trim() || `Video: ${videoId.substring(0,5)}...`;

    setIsSubmitting(true);
    startTransition(async () => {
      const result = await addVideoAction(nameToSave, videoUrlInput);
      if (result.success && result.video) {
        toast({ title: "Video Added", description: `"${result.video.name}" has been added to your hub.` });
        setVideoUrlInput("");
        setVideoNameInput("");
        // Optimistic update or re-fetch:
        // setVideos(prev => [result.video!, ...prev].sort((a, b) => new Date(b.addedDate || 0).getTime() - new Date(a.addedDate || 0).getTime()));
        // Or, for consistency with revalidatePath, just reload:
        loadVideos(); 
      } else {
        toast({ variant: "destructive", title: "Error Adding Video", description: result.error || "An unknown error occurred." });
      }
      setIsSubmitting(false);
    });
  };

  const handleDeleteVideo = (video: VideoData) => {
    setVideoToDelete(video);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;
    setIsSubmitting(true);
    startTransition(async () => {
      const result = await deleteVideoAction(videoToDelete.id);
      if (result.success) {
        toast({ title: "Video Deleted", description: `"${videoToDelete.name}" has been removed.` });
        // setVideos(prev => prev.filter(v => v.id !== videoToDelete.id));
        // Or, for consistency with revalidatePath, just reload:
        loadVideos();
      } else {
        toast({ variant: "destructive", title: "Error Deleting Video", description: result.error || "An unknown error occurred." });
      }
      setVideoToDelete(null);
      setIsSubmitting(false);
    });
  };


  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Initializing Video Hub...</p>
      </div>
    );
  }

  // This check remains illustrative. The actual POSTGRES_URL is used server-side.
  if (isMounted && !postgresConfiguredClientCheck && !isLoadingVideos && !POSTGRES_URL_CLIENT_CHECK) {
    return (
       <div className="flex flex-col justify-center items-center h-full text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Database Configuration Note</h2>
        <p className="text-muted-foreground">
          The Video Hub now connects to a PostgreSQL database.
        </p>
        <p className="text-muted-foreground mt-1">
          Ensure the <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">POSTGRES_URL</code> is correctly set in your server's <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">.env</code> file.
        </p>
         <p className="text-muted-foreground mt-1">
          This message appears because a client-side check variable for POSTGRES_URL is not set (this is normal).
        </p>
        <p className="text-muted-foreground mt-2 font-semibold">
          You MUST restart the Next.js development server after modifying the <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">.env</code> file for server-side changes to take effect.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Youtube className="w-8 h-8 text-primary" />
        Video Hub (PostgreSQL)
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <LinkIcon className="w-6 h-6" />
            Add YouTube Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="url"
            placeholder="YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
            value={videoUrlInput}
            onChange={(e) => setVideoUrlInput(e.target.value)}
            disabled={isSubmitting || isPending}
          />
          <Input
            type="text"
            placeholder="Optional: Custom Video Name"
            value={videoNameInput}
            onChange={(e) => setVideoNameInput(e.target.value)}
            disabled={isSubmitting || isPending}
          />
          <Button onClick={handleAddVideo} className="w-full sm:w-auto" disabled={isSubmitting || isPending}>
            {isSubmitting || isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Youtube className="mr-2 h-4 w-4" />}
            Add Video
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">My Videos</CardTitle>
           {isLoadingVideos && (
            <div className="flex items-center text-sm text-muted-foreground py-10 justify-center">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Loading videos from PostgreSQL...
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!isLoadingVideos && videos.length === 0 && (
             <div className="text-center py-12 text-muted-foreground">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No Videos Yet</p>
                <p>Add some videos using the form above.</p>
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
                      Added: {video.addedDate ? new Date(video.addedDate).toLocaleDateString() : 'N/A'}
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
                      disabled={isSubmitting || isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
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
              <AlertDialogCancel onClick={() => setVideoToDelete(null)} disabled={isSubmitting || isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={isSubmitting || isPending}>
                {(isSubmitting || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
