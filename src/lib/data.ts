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
  id:string;
  title: string;
  htmlContent: string;
  createdAt: string;
}

// Represents a user's profile data stored in Firestore, including their role.
export interface UserData {
  uid: string;
  email: string | null;
  role: 'profesor' | 'estudiante';
  createdAt: Timestamp;
}

// Represents a professor's group of students
export interface Group {
    id: string;
    name: string;
    profesorId: string;
    createdAt: string;
}

// Represents a student within a group
export interface Student {
    id: string;
    name: string;
    grades: {
        m1: (number | null)[];
        m2: (number | null)[];
        m3: (number | null)[];
    };
    // Attendance stored as a map of date strings (YYYY-MM-DD) to status
    attendance: Record<string, 'present' | 'absent' | 'excused'>;
}
