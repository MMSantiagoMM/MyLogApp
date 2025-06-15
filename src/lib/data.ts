
// Represents a Video item, aligning with PostgreSQL schema and client needs
export interface VideoData {
  id: string; // From PostgreSQL, typically string after conversion (e.g., from SERIAL or UUID)
  name: string;
  youtubeUrl: string;
  videoId: string;
  addedDate?: string; // Used in the client, derived from createdAt
  createdAt?: string; // ISO string from PostgreSQL
  updatedAt?: string; // ISO string from PostgreSQL
}

// Represents an HTML Snippet item, (currently localStorage, could align with Data Connect or other DB)
export interface HTMLSnippetData {
  id: string;
  title: string;
  htmlContent: string; 
  createdAt?: string;
  updatedAt?: string;
}

// Represents an Exercise item, (currently localStorage, could align with Data Connect or other DB)
export interface ExerciseData {
  id: string;
  title: string;
  description?: string; 
  htmlContent?: string; 
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags?: string[]; 
  createdAt?: string;
  updatedAt?: string;
}


// The mockExercises are kept as they might be used by other parts of the application (e.g., exercises page)
// if not yet migrated to Data Connect or PostgreSQL
export const mockExercises_localStorage: ExerciseData[] = [
  {
    id: '1',
    title: 'Java Basics: Hello World',
    description: 'Write a simple Java program that prints "Hello, World!" to the console. This will help you get familiar with the basic syntax and running a Java program.',
    difficulty: 'Easy',
    tags: ['Java', 'Basics', 'Console Output'],
  },
  {
    id: '2',
    title: 'Variables and Data Types',
    description: 'Declare variables of different data types (int, double, String, boolean) and print their values. Understand how data is stored and manipulated.',
    difficulty: 'Easy',
    tags: ['Java', 'Variables', 'Data Types'],
  },
  {
    id: '3',
    title: 'Conditional Statements: If-Else',
    description: 'Write a program that takes an integer as input and prints whether it is even or odd using if-else statements.',
    difficulty: 'Medium',
    tags: ['Java', 'Conditionals', 'Logic'],
  },
  {
    id: '4',
    title: 'Loops: Factorial Calculator',
    description: 'Create a Java program that calculates the factorial of a given non-negative integer using a loop (for or while).',
    difficulty: 'Medium',
    tags: ['Java', 'Loops', 'Math'],
  },
  {
    id: '5',
    title: 'Object-Oriented Programming: Simple Class',
    description: 'Define a simple class `Rectangle` with attributes for width and height, and methods to calculate area and perimeter. Create objects and test your class.',
    difficulty: 'Hard',
    tags: ['Java', 'OOP', 'Classes', 'Objects'],
  },
];
