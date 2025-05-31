
export interface VideoData {
  id: string;
  name: string;
  youtubeUrl: string;
  videoId: string;
  addedDate: string;
}

// The mockExercises are kept as they might be used by other parts of the application (e.g., exercises page)
export interface ExerciseData {
  id: string;
  title: string;
  description: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  files?: string[]; // Names of associated files
  tags?: string[];
}

export const mockExercises: ExerciseData[] = [
  {
    id: '1',
    title: 'Java Basics: Hello World',
    description: 'Write a simple Java program that prints "Hello, World!" to the console. This will help you get familiar with the basic syntax and running a Java program.',
    difficulty: 'Easy',
    files: ['HelloWorld.java'],
    tags: ['Java', 'Basics', 'Console Output'],
  },
  {
    id: '2',
    title: 'Variables and Data Types',
    description: 'Declare variables of different data types (int, double, String, boolean) and print their values. Understand how data is stored and manipulated.',
    difficulty: 'Easy',
    files: ['DataTypesDemo.java'],
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
    files: ['Factorial.java', 'TestFactorial.java'],
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
