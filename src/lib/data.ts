
// Represents a Video item, aligning with a potential Data Connect schema
export interface VideoData {
  id: string; // Typically a unique ID from the database
  name: string;
  youtubeUrl: string;
  videoId: string;
  createdAt?: string; // Or Date, depending on transformation. ISO string is common.
  updatedAt?: string; // Or Date
}

// Represents an HTML Snippet item, aligning with Data Connect schema
export interface HTMLSnippetData {
  id: string;
  title: string;
  htmlContent: string; // The actual HTML code
  createdAt?: string;
  updatedAt?: string;
}

// Represents an Exercise item, aligning with Data Connect schema
export interface ExerciseData {
  id: string;
  title: string;
  description?: string; // General description of the exercise
  htmlContent?: string; // Could be used for instructions or problem statement in HTML
  // starterCode?: string; // If there's a separate field for starter Java code
  difficulty?: 'Easy' | 'Medium' | 'Hard'; // This might be part of your schema or client-side logic
  tags?: string[]; // This might be part of your schema or client-side logic
  createdAt?: string;
  updatedAt?: string;
}


// The mockExercises are kept as they might be used by other parts of the application (e.g., exercises page)
// if not yet migrated to Data Connect
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
