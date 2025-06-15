
// src/lib/data.ts

// Based on the provided Data Connect schema

export interface User {
  id: string; // Typically provided by Data Connect or inferred
  displayName: string;
  email?: string | null;
  photoUrl?: string | null;
  createdAt: string; // Assuming Timestamp is serialized as ISO string
}

export interface Video {
  id: string; // Typically provided by Data Connect or inferred
  url: string;
  title: string;
  description?: string | null;
  createdAt: string; // Assuming Timestamp is serialized as ISO string
  // For client-side display, we might derive videoId from url
  // and use title as name, addedDate from createdAt
}

export interface HTMLSnippet {
  id: string; // Typically provided by Data Connect or inferred
  code: string;
  description?: string | null;
  createdAt: string; // Assuming Timestamp is serialized as ISO string
}

export interface Exercise {
  id: string; // Typically provided by Data Connect or inferred
  description: string;
  code: string; // This could be starter code or solution template
  createdAt: string; // Assuming Timestamp is serialized as ISO string
}

export interface Tag {
  id:string; // Typically provided by Data Connect or inferred
  name: string;
  createdAt: string; // Assuming Timestamp is serialized as ISO string
}

export interface Tagging {
  id: string; // Typically provided by Data Connect or inferred
  video?: Video | null; // or videoId: string
  htmlSnippet?: HTMLSnippet | null; // or htmlSnippetId: string
  exercise?: Exercise | null; // or exerciseId: string
  tag: Tag; // or tagId: string
  createdAt: string; // Assuming Timestamp is serialized as ISO string
}


// Client-side representation for Video Hub page, derived from Video
export interface VideoDataClient {
  id: string; 
  name: string; // from Video.title
  youtubeUrl: string; // from Video.url
  videoId: string; // extracted from Video.url
  description?: string | null; // from Video.description
  addedDate: string; // from Video.createdAt
}
