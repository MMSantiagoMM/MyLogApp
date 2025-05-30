export interface FileData {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  url: string; // For download link, in a real app this would be a server URL
}

export interface ExerciseData {
  id: string;
  title: string;
  description: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  files?: string[]; // Names of associated files
  tags?: string[];
}

export const mockFiles: FileData[] = [
  {
    id: '1',
    name: 'Syllabus_CS101.pdf',
    type: 'pdf',
    size: '1.2MB',
    date: '2024-07-01',
    url: 'https://placehold.co/100x100.pdf?text=Syllabus',
  },
  {
    id: '2',
    name: 'Lecture_Notes_Week1.docx',
    type: 'docx',
    size: '850KB',
    date: '2024-07-05',
    url: 'https://placehold.co/100x100.docx?text=NotesW1',
  },
  {
    id: '3',
    name: 'Assignment1_Instructions.txt',
    type: 'txt',
    size: '15KB',
    date: '2024-07-10',
    url: 'https://placehold.co/100x100.txt?text=Assign1',
  },
  {
    id: '4',
    name: 'Project_Starter_Code.zip',
    type: 'zip',
    size: '5.5MB',
    date: '2024-07-15',
    url: 'https://placehold.co/100x100.zip?text=StarterCode',
  },
  {
    id: '5',
    name: 'UML_Diagram_Example.png',
    type: 'image/png',
    size: '300KB',
    date: '2024-07-20',
    url: 'https://placehold.co/600x400.png',
  }
];

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
