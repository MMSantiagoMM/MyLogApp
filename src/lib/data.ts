// src/lib/data.ts
import type { Timestamp } from "firebase/firestore";

// This interface represents a video document stored in Firestore.
export interface Video {
  id: string; // Firestore document ID
  name: string;
  youtubeUrl: string;
  videoId: string;
  description?: string;
  createdAt: Timestamp; // Firestore Timestamp object
}

// This interface is used for client-side state,
// where the Timestamp is converted to a string for easier handling.
export interface VideoDataClient {
  id: string;
  name: string;
  youtubeUrl: string;
  videoId: string;
  description?: string;
  addedDate: string; // ISO string representation of the date
}

export interface ExerciseItem {
  id: string;
  title: string;
  htmlContent: string;
  createdAt: string;
}

export interface HtmlPresenterItem {
  id: string;
  title: string;
  htmlContent: string;
  createdAt: string;
}
