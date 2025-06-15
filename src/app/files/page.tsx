
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { VideoDataClient, Video as DataConnectVideo } from '@/lib/data'; // Using VideoDataClient for page state
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

const DATA_CONNECT_ENDPOINT_CLIENT_CHECK = process.env.NEXT_PUBLIC_DATA_CONNECT_ENDPOINT;

export default function VideoHubPage() {
  const [videos, setVideos] = useState<VideoDataClient[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState<string>(""); // For adding new video (currently UI only)
  const [videoNameInput, setVideoNameInput] = useState<string>(""); // For adding new video (currently UI only)
  
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // For future add/delete ops
  const [isMounted, setIsMounted] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoDataClient | null>(null); // For future delete ops
  const { toast } = useToast();

  const [dataConnectConfigured, setDataConnectConfigured] = useState(false);
  const [dataConnectError, setDataConnectError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    if (!dataConnectConfigured) {
        console.warn("[VideoHubPage] Data Connect not configured, skipping fetchVideos.");
        setIsLoadingVideos(false);
        return;
    }
    setIsLoadingVideos(true);
    setDataConnectError(null);
    try {
      console.log("[VideoHubPage] Fetching videos using Data Connect...");
      const result = await executeGraphQLQuery<{ videos: DataConnectVideo[] }>(GET_VIDEOS_QUERY);
      
      if (result && result.videos) {
        const transformedVideos: VideoDataClient[] = result.videos.map(dcVideo => {
          const videoId = extractYouTubeVideoId(dcVideo.url);
          return {
            id: dcVideo.id,
            name: dcVideo.title,
            youtubeUrl: dcVideo.url,
            videoId: videoId || "INVALID_URL", // Handle cases where ID extraction fails
            description: dcVideo.description,
            addedDate: new Date(dcVideo.createdAt).toISOString(),
          };
        }).filter(video => video.videoId !== "INVALID_URL"); // Filter out videos with bad URLs

        transformedVideos.sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
        setVideos(transformedVideos);
        console.log("[VideoHubPage] Successfully fetched and transformed videos:", transformedVideos.length);
      } else {
        console.warn("[VideoHubPage] No videos found or unexpected result structure:", result);
        setVideos([]);
      }
    } catch (error: any) {
      console.error("[VideoHubPage] Error fetching videos via Data Connect:", error);
      setDataConnectError(error.message || "Could not load videos from Data Connect.");
      toast({
        variant: "destructive",
        title: "Error Loading Videos",
        description: error.message || "Could not load videos from Data Connect.",
      });
      setVideos([]);
    } finally {
      setIsLoadingVideos(false);
    }
  }, [toast, dataConnectConfigured]);

  useEffect(() => {
    setIsMounted(true);
    console.log("[VideoHubPage] Checking Data Connect endpoint:", DATA_CONNECT_ENDPOINT_CLIENT_CHECK);
    if (DATA_CONNECT_ENDPOINT_CLIENT_CHECK && 
        !DATA_CONNECT_ENDPOINT_CLIENT_CHECK.includes("YOUR_CONNECTOR_ID") &&
        !DATA_CONNECT_ENDPOINT_CLIENT_CHECK.includes("your-connector-id")) {
      setDataConnectConfigured(true);
      console.log("[VideoHubPage] Data Connect endpoint appears configured.");
    } else {
      setDataConnectConfigured(false);
      setIsLoadingVideos(false); // Don't show loading if not configured
      const errorMsg = "Firebase Data Connect endpoint (NEXT_PUBLIC_DATA_CONNECT_ENDPOINT) is not correctly set in your .env file. Please include your Connector ID and restart the server.";
      console.error(`[VideoHubPage] ${errorMsg}`);
      setDataConnectError(errorMsg);
    }
  }, []);

  useEffect(() => {
    if (isMounted && dataConnectConfigured) {
      fetchVideos();
    }
  }, [isMounted, dataConnectConfigured, fetchVideos]);


  const handleAddVideoPlaceholder = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Adding videos via Data Connect will be implemented shortly.",
    });
  };

  const handleDeleteVideoPlaceholder = (video: VideoDataClient) => {
    setVideoToDelete(video); // This will open the dialog
     toast({
      title: "Feature Coming Soon",
      description: "Deleting videos via Data Connect will be implemented shortly.",
    });
    // Actual deletion logic would go here once mutations are set up
    // For now, just close the dialog or provide feedback
    // setVideoToDelete(null); 
  };

  const confirmDeletePlaceholder = async () => {
    if (!videoToDelete) return;
    // Placeholder for future delete logic
    toast({ title: "Deletion Pending", description: `"${videoToDelete.name}" deletion via Data Connect is not yet implemented.` });
    setVideoToDelete(null);
  };


  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Initializing Video Hub...</p>
      </div>
    );
  }

  if (!dataConnectConfigured || dataConnectError) {
    return (
       <div className="flex flex-col justify-center items-center h-full text-center p-8">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Configuration Error</h2>
        <p className="text-muted-foreground">
          {dataConnectError || "Firebase Data Connect is not properly configured."}
        </p>
        <p className="text-muted-foreground mt-1">
          Please ensure the <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">NEXT_PUBLIC_DATA_CONNECT_ENDPOINT</code> is correctly set in your server's <code className="bg-muted px-1 py-0.5 rounded-sm text-sm">.env</code> file, includes your Connector ID, and that you've restarted the Next.js server.
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
            Add YouTube Video (Placeholder)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="url"
            placeholder="YouTube Video URL (e.g., https://www.youtube.com/watch?v=...)"
            value={videoUrlInput}
            onChange={(e) => setVideoUrlInput(e.target.value)}
            disabled={true} // Disabled until add mutation is implemented
          />
          <Input
            type="text"
            placeholder="Optional: Custom Video Name"
            value={videoNameInput}
            onChange={(e) => setVideoNameInput(e.target.value)}
            disabled={true} // Disabled until add mutation is implemented
          />
          <Button onClick={handleAddVideoPlaceholder} className="w-full sm:w-auto" disabled={true}>
            <Youtube className="mr-2 h-4 w-4" />
            Add Video (Coming Soon)
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
          {!isLoadingVideos && videos.length === 0 && !dataConnectError && (
             <div className="text-center py-12 text-muted-foreground">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No Videos Yet</p>
                <p>Add some videos using the form above (once implemented).</p>
            </div>
          )}
          {!isLoadingVideos && dataConnectError && (
            <div className="text-center py-12 text-destructive">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-semibold">Failed to Load Videos</p>
                <p>{dataConnectError}</p>
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
                      onClick={() => handleDeleteVideoPlaceholder(video)}
                      className="w-full"
                      aria-label={`Delete ${video.name}`}
                      disabled={true} // Disabled until delete mutation is implemented
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

      {videoToDelete && (
        <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion (Placeholder)</AlertDialogTitle>
              <AlertDialogDescription>
                Deleting videos via Data Connect is not yet implemented. This dialog is a placeholder.
                Would you like to remove "{videoToDelete.name}" from the list?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setVideoToDelete(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeletePlaceholder} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm (Placeholder)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
