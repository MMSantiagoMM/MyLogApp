
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { VideoDataClient } from '@/lib/data';
import { extractYouTubeVideoId } from '@/lib/youtubeUtils';
import { Youtube, Link as LinkIcon, Trash2, Film, AlertTriangle, Loader2, CheckCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';

export default function VideoHubPage() {
  const { userData } = useAuth();
  const isProfesor = userData?.role === 'profesor';

  const [videos, setVideos] = useState<VideoDataClient[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState<string>("");
  const [videoNameInput, setVideoNameInput] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoDataClient | null>(null);
  const { toast } = useToast();

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[VideoHubPage] Fetching videos from Firestore...");
      const videosCollection = collection(db, 'videos');
      const q = query(videosCollection, orderBy('createdAt', 'desc'));
      const videoSnapshot = await getDocs(q);

      const videosList = videoSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          youtubeUrl: data.youtubeUrl,
          videoId: data.videoId,
          description: data.description,
          // Safely convert Firestore Timestamp to ISO string
          addedDate: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
      });

      setVideos(videosList);
      console.log("[VideoHubPage] Successfully fetched videos:", videosList.length);
    } catch (err: any) {
      console.error("[VideoHubPage] Error fetching videos from Firestore:", err);
      let userFriendlyError = err.message || "An unknown error occurred.";
      if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED') {
          userFriendlyError = "Firestore Security Rules are blocking access. Please update your Firestore rules in the Firebase Console to allow read/write operations for development. See the instructions in the chat for the solution.";
      }
      setError(userFriendlyError);
      toast({
        variant: "destructive",
        title: "Permission Error",
        description: userFriendlyError,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
    if (db) {
        fetchVideos();
    } else {
        setError("Firebase Firestore is not initialized. Check your .env configuration.");
        setIsLoading(false);
    }
  }, [fetchVideos]);

  const handleAddVideo = async () => {
    if (!isProfesor) return;

    const videoId = extractYouTubeVideoId(videoUrlInput);
    if (!videoId) {
      toast({ variant: "destructive", title: "Invalid URL", description: "Please enter a valid YouTube video URL." });
      return;
    }

    const finalVideoName = videoNameInput.trim() || `Video: ${videoId}`;

    setIsSubmitting(true);
    setError(null);
    try {
      await addDoc(collection(db, 'videos'), {
        name: finalVideoName,
        youtubeUrl: videoUrlInput,
        videoId: videoId,
        description: "",
        createdAt: serverTimestamp(),
      });
      toast({
        variant: "default",
        className: "bg-green-100 dark:bg-green-900 border-green-400",
        title: "Video Added",
        description: `"${finalVideoName}" has been successfully added.`,
      });
      setVideoUrlInput("");
      setVideoNameInput("");
      fetchVideos(); // Refresh the list
    } catch (err: any) {
      console.error("[VideoHubPage] Error adding video to Firestore:", err);
      setError(err.message);
      toast({ variant: "destructive", title: "Error Adding Video", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!videoToDelete || !isProfesor) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'videos', videoToDelete.id));
      toast({
        title: "Video Deleted",
        description: `"${videoToDelete.name}" has been removed.`,
      });
      fetchVideos(); // Refresh list
    } catch (err: any) {
        console.error("[VideoHubPage] Error deleting video from Firestore:", err);
        toast({ variant: "destructive", title: "Error Deleting Video", description: err.message });
    } finally {
        setIsSubmitting(false);
        setVideoToDelete(null);
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

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Youtube className="w-8 h-8 text-primary" />
        Video Hub
      </h1>

      {isProfesor && (
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
              disabled={isSubmitting}
            />
            <Input
              type="text"
              placeholder="Optional: Custom Video Name"
              value={videoNameInput}
              onChange={(e) => setVideoNameInput(e.target.value)}
              disabled={isSubmitting}
            />
            <Button onClick={handleAddVideo} className="w-full sm:w-auto" disabled={isSubmitting || !videoUrlInput}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Youtube className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Adding..." : "Add Video"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">My Videos</CardTitle>
           {isLoading && (
            <div className="flex items-center text-sm text-muted-foreground py-10 justify-center">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Loading videos from Firestore...
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!isLoading && videos.length === 0 && !error && (
             <div className="text-center py-12 text-muted-foreground">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No Videos Yet</p>
                <p>{isProfesor ? 'Add your first video using the form above.' : 'No videos have been added yet.'}</p>
            </div>
          )}
          {!isLoading && error && (
            <div className="text-center py-12 text-destructive">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-semibold">Failed to Load Videos</p>
                <p className="max-w-md mx-auto">{error}</p>
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
                  {isProfesor && (
                    <CardFooter className="p-3">
                      <AlertDialog open={videoToDelete?.id === video.id} onOpenChange={(open) => !open && setVideoToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setVideoToDelete(video)}
                            className="w-full"
                            aria-label={`Delete ${video.name}`}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to delete this video?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove "{videoToDelete?.name}" from your collection. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setVideoToDelete(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} disabled={isSubmitting}>
                              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                              {isSubmitting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
