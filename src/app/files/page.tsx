
"use client";

import React, { useState, useEffect } from 'react';
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


const LOCAL_STORAGE_KEY = "youtubeVideosList_v2";

export default function VideoHubPage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [videoUrlInput, setVideoUrlInput] = useState<string>("");
  const [videoNameInput, setVideoNameInput] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedVideos = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedVideos) {
        setVideos(JSON.parse(savedVideos));
      }
    } catch (error) {
      console.error("Failed to load videos from localStorage:", error);
      toast({
        variant: "destructive",
        title: "Error loading videos",
        description: "Could not load saved videos from your browser.",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(videos));
      } catch (error) {
        console.error("Failed to save videos to localStorage:", error);
         toast({
          variant: "destructive",
          title: "Error saving videos",
          description: "Could not save videos to your browser.",
        });
      }
    }
  }, [videos, isMounted, toast]);

  const handleAddVideo = () => {
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


    const newVideo: VideoData = {
      id: Date.now().toString(),
      name: videoNameInput.trim() || `Video ${videos.length + 1}`,
      youtubeUrl: videoUrlInput,
      videoId: videoId,
      addedDate: new Date().toISOString(), // Using ISOString for reliable sorting
    };
    console.log("[VideoHubPage] New video object created:", newVideo);

    setVideos(prevVideos => {
      const updatedVideos = [newVideo, ...prevVideos].sort((a, b) => {
        return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      });
      console.log("[VideoHubPage] Updated videos state:", updatedVideos);
      return updatedVideos;
    });
    setVideoUrlInput("");
    setVideoNameInput("");
    toast({
      title: "Video Added",
      description: `"${newVideo.name}" has been added to your Video Hub.`,
    });
  };

  const handleDeleteVideo = (video: VideoData) => {
    setVideoToDelete(video);
  };

  const confirmDelete = () => {
    if (videoToDelete) {
      setVideos(prevVideos => prevVideos.filter(v => v.id !== videoToDelete.id));
      toast({
        title: "Video Removed",
        description: `"${videoToDelete.name}" has been removed.`,
      });
      setVideoToDelete(null);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
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
          />
          <Input 
            type="text" 
            placeholder="Optional: Custom Video Name" 
            value={videoNameInput}
            onChange={(e) => setVideoNameInput(e.target.value)}
          />
          <Button onClick={handleAddVideo} className="w-full sm:w-auto">
            <Youtube className="mr-2 h-4 w-4" /> Add Video
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
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
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
              <AlertDialogAction onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

