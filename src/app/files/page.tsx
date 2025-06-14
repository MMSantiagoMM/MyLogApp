
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
import { executeGraphQLQuery, GET_VIDEOS_QUERY } from '@/lib/dataConnect';

export default function VideoHubPage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState<string>("");
  const [videoNameInput, setVideoNameInput] = useState<string>("");
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Kept for potential future mutation UI
  const [isMounted, setIsMounted] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoData | null>(null); // Kept for potential future mutation UI
  const { toast } = useToast();
  const [dataConnectConfigured, setDataConnectConfigured] = useState(false);

  const fetchVideos = useCallback(async () => {
    const endpoint = process.env.NEXT_PUBLIC_DATA_CONNECT_ENDPOINT;
    if (!endpoint || endpoint.includes("YOUR_CONNECTOR_ID")) {
      console.error("[VideoHubPage] fetchVideos: Firebase Data Connect endpoint not configured.");
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Firebase Data Connect endpoint not configured. Please check .env and restart the server.",
        duration: 10000,
      });
      setIsLoadingVideos(false);
      setDataConnectConfigured(false);
      return;
    }
    setDataConnectConfigured(true);
    setIsLoadingVideos(true);

    try {
      const response = await executeGraphQLQuery<{ videos: VideoData[] }>(GET_VIDEOS_QUERY);
      // Assuming the 'videos' field in your GraphQL response is an array of VideoData compatible objects.
      // You might need to transform the data if your schema names fields differently (e.g., map `createdAt` to `addedDate`).
      const fetchedVideos = response?.videos?.map(video => ({
        ...video,
        // Ensure 'id' exists, it's crucial for React keys and future operations
        id: video.id || String(Date.now() + Math.random()), // Fallback if id is missing, but schema should guarantee it
        addedDate: video.createdAt || new Date().toISOString(), // Use createdAt or a similar field
      })) || [];
      
      // Sort by date, assuming addedDate (mapped from createdAt) is a valid ISO string
      fetchedVideos.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
      setVideos(fetchedVideos);

    } catch (error: any) {
      console.error("Error fetching videos from Data Connect:", error);
      toast({
        variant: "destructive",
        title: "Error loading videos",
        description: error.message || "Could not load videos from the Data Connect service.",
      });
       setVideos([]); // Clear videos on error
    } finally {
      setIsLoadingVideos(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
    const endpoint = process.env.NEXT_PUBLIC_DATA_CONNECT_ENDPOINT;
    if (endpoint && !endpoint.includes("YOUR_CONNECTOR_ID")) {
      setDataConnectConfigured(true);
      fetchVideos();
    } else {
      setIsLoadingVideos(false);
      setDataConnectConfigured(false);
    }
  }, [fetchVideos]);


  const handleAddVideoStub = async () => {
    toast({
      title: "Feature Coming Soon",
      description: "Adding videos via Data Connect is not yet implemented in this example.",
    });
    // This is where you would implement a GraphQL mutation to add a video.
    // For now, it's a placeholder.
    // const videoId = extractYouTubeVideoId(videoUrlInput);
    // if (!videoId) { /* ... */ }
    // const videoPayload = { name: videoNameInput, youtubeUrl: videoUrlInput, videoId };
    // await executeGraphQLQuery(ADD_VIDEO_MUTATION, { input: videoPayload });
    // fetchVideos(); // Re-fetch after adding
  };

  const handleDeleteVideoStub = (video: VideoData) => {
     toast({
      title: "Feature Coming Soon",
      description: "Deleting videos via Data Connect is not yet implemented in this example.",
    });
    // setVideoToDelete(video); // This would open a confirmation dialog
  };

  const confirmDeleteStub = async () => {
     toast({
      title: "Feature Coming Soon",
      description: "Deleting videos via Data Connect is not yet implemented in this example.",
    });
    // This is where you would implement a GraphQL mutation to delete a video.
    // if (videoToDelete) {
    //   await executeGraphQLQuery(DELETE_VIDEO_MUTATION, { id: videoToDelete.id });
    //   fetchVideos(); // Re-fetch after deleting
    //   setVideoToDelete(null);
    // }
  };


  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Initializing Video Hub...</p>
      </div>
    );
  }

  if (isMounted && !dataConnectConfigured && !isLoadingVideos) {
    return (
       <div className="flex flex-col justify-center items-center h-full text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          Firebase Data Connect endpoint (NEXT_PUBLIC_DATA_CONNECT_ENDPOINT) is missing, invalid, or still contains "YOUR_CONNECTOR_ID".
        </p>
        <p className="text-muted-foreground mt-1">
          Please ensure it's correctly set in your <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">.env</code> file
          (e.g., <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">https://your-project-id.dataconnect.firebasehosting.com/api/your-actual-connector-id</code>).
        </p>
        <p className="text-muted-foreground mt-2 font-semibold">
          You MUST restart the Next.js development server after modifying the <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">.env</code> file.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Youtube className="w-8 h-8 text-primary" />
        Video Hub (Data Connect)
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <LinkIcon className="w-6 h-6" />
            Add YouTube Video (Coming Soon)
          </CardTitle>
          <CardDescription>
            Functionality to add new videos via Data Connect will be implemented here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="url"
            placeholder="YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
            value={videoUrlInput}
            onChange={(e) => setVideoUrlInput(e.target.value)}
            disabled // Disabled as add functionality is not implemented
          />
          <Input
            type="text"
            placeholder="Optional: Custom Video Name"
            value={videoNameInput}
            onChange={(e) => setVideoNameInput(e.target.value)}
            disabled // Disabled as add functionality is not implemented
          />
          <Button onClick={handleAddVideoStub} className="w-full sm:w-auto" disabled>
            <Youtube className="mr-2 h-4 w-4" />
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
              Loading videos from Data Connect...
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!isLoadingVideos && videos.length === 0 && dataConnectConfigured && (
             <div className="text-center py-12 text-muted-foreground">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No Videos Yet</p>
                <p>Once add functionality is implemented, videos will appear here.</p>
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
                      onClick={() => handleDeleteVideoStub(video)}
                      className="w-full"
                      aria-label={`Delete ${video.name}`}
                      disabled // Disabled as delete functionality is not implemented
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                       Delete (Coming Soon)
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog - kept for future use with mutations */}
      {/* {videoToDelete && (
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
              <AlertDialogAction onClick={confirmDeleteStub} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )} */}
    </div>
  );
}
