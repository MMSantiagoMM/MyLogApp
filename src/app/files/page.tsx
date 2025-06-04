
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
import { db } from '@/lib/firebase'; // Import Firestore instance
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

// Firestore collection name
const VIDEOS_COLLECTION = "videos";

export default function VideoHubPage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState<string>("");
  const [videoNameInput, setVideoNameInput] = useState<string>("");
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(true); // For initial load
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // For add/delete operations
  const [isMounted, setIsMounted] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoData | null>(null);
  const { toast } = useToast();

  const fetchVideos = useCallback(async () => {
    setIsLoadingVideos(true);
    try {
      const q = query(collection(db, VIDEOS_COLLECTION), orderBy("addedDate", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedVideos = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamp to ISO string
        const addedDateTimestamp = data.addedDate as Timestamp;
        return {
          id: doc.id,
          name: data.name,
          youtubeUrl: data.youtubeUrl,
          videoId: data.videoId,
          addedDate: addedDateTimestamp?.toDate().toISOString() || new Date().toISOString(),
        } as VideoData;
      });
      setVideos(fetchedVideos);
    } catch (error) {
      console.error("Error fetching videos from Firestore:", error);
      toast({
        variant: "destructive",
        title: "Error loading videos",
        description: "Could not load videos from the database. Please check console for details.",
      });
    } finally {
      setIsLoadingVideos(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
    fetchVideos();
  }, [fetchVideos]);


  const handleAddVideo = async () => {
    console.log("[VideoHubPage] handleAddVideo called. URL:", videoUrlInput, "Name:", videoNameInput);

    if (!videoUrlInput.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "YouTube URL cannot be empty.",
      });
      return;
    }

    const videoId = extractYouTubeVideoId(videoUrlInput);
    console.log("[VideoHubPage] Extracted videoId:", videoId);

    if (!videoId) {
      toast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Could not extract a valid YouTube Video ID from the URL. Please check the link and try again.",
      });
      return;
    }
    
    if (videos.some(v => v.videoId === videoId)) {
      toast({
        variant: "destructive",
        title: "Duplicate Video",
        description: "This video has already been added to the hub.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newVideoData = {
        name: videoNameInput.trim() || `Video by ID: ${videoId}`,
        youtubeUrl: videoUrlInput,
        videoId: videoId,
        addedDate: serverTimestamp(), // Use Firestore server timestamp
      };
      const docRef = await addDoc(collection(db, VIDEOS_COLLECTION), newVideoData);
      console.log("[VideoHubPage] New video added to Firestore with ID:", docRef.id);
      
      // Optimistically update UI or re-fetch
      // For simplicity, re-fetching after add.
      await fetchVideos(); 

      setVideoUrlInput("");
      setVideoNameInput("");
      toast({
        title: "Video Added",
        description: `"${newVideoData.name}" has been added to your Video Hub.`,
      });
    } catch (error) {
      console.error("Error adding video to Firestore:", error);
      toast({
        variant: "destructive",
        title: "Error Adding Video",
        description: "Could not add video to the database. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVideo = (video: VideoData) => {
    setVideoToDelete(video);
  };

  const confirmDelete = async () => {
    if (videoToDelete) {
      setIsSubmitting(true);
      try {
        await deleteDoc(doc(db, VIDEOS_COLLECTION, videoToDelete.id));
        setVideos(prevVideos => prevVideos.filter(v => v.id !== videoToDelete.id));
        toast({
          title: "Video Removed",
          description: `"${videoToDelete.name}" has been removed.`,
        });
        setVideoToDelete(null);
      } catch (error) {
        console.error("Error deleting video from Firestore:", error);
        toast({
          variant: "destructive",
          title: "Error Deleting Video",
          description: "Could not delete video. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isMounted || isLoadingVideos) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Videos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Youtube className="w-8 h-8 text-primary" />
        Video Hub
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
            disabled={isSubmitting}
          />
          <Input 
            type="text" 
            placeholder="Optional: Custom Video Name" 
            value={videoNameInput}
            onChange={(e) => setVideoNameInput(e.target.value)}
            disabled={isSubmitting}
          />
          <Button onClick={handleAddVideo} className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Youtube className="mr-2 h-4 w-4" />}
            Add Video
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">My Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
                <Film className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold">No Videos Yet</p>
                <p>Add YouTube video links using the form above to build your collection.</p>
            </div>
          ) : (
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
                      {isSubmitting && videoToDelete?.id === video.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
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
              <AlertDialogCancel onClick={() => setVideoToDelete(null)}>Cancel</AlertDialogCancel>
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
