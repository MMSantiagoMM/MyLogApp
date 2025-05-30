
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Editor from "@monaco-editor/react";
import { 
  BookMarked, CodeXml, MonitorPlay, Loader2, PlusCircle, Edit3, Trash2, Save, XCircle, FileText, Expand
} from "lucide-react";
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

const defaultExerciseHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Exercise</title>
    <style>
        body { font-family: sans-serif; padding: 20px; background-color: #f9f9f9; color: #333; }
        .exercise-container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #007bff; }
        /* Add more specific exercise styling here */
    </style>
</head>
<body>
    <div class="exercise-container">
        <h1>Exercise Title</h1>
        <p>Replace this with your exercise instructions and content (e.g., questions, code snippets to complete, etc.).</p>
        <p>You can use HTML to structure your exercise.</p>
        <!-- Example: <input type="text" placeholder="Your answer here"> -->
    </div>
</body>
</html>`;

interface ExerciseItem {
  id: string;
  title: string;
  htmlContent: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = "htmlExercisesList_v1"; 

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [view, setView] = useState<'list' | 'edit' | 'create'>('list');
  const [currentEditingExercise, setCurrentEditingExercise] = useState<ExerciseItem | null>(null);
  
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingHtmlContent, setEditingHtmlContent] = useState<string>(defaultExerciseHtmlContent);

  const [isMounted, setIsMounted] = useState(false);
  const [editorTheme, setEditorTheme] = useState('vs-light');
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedExercises = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedExercises) {
        setExercises(JSON.parse(savedExercises));
      }
    } catch (error) {
      console.error("Failed to load exercises from localStorage:", error);
      setExercises([]); 
    }

    const updateTheme = () => {
      if (document.documentElement.classList.contains('dark')) {
        setEditorTheme('vs-dark');
      } else {
        setEditorTheme('vs-light');
      }
    };
    updateTheme(); 

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(exercises));
      } catch (error) {
        console.error("Failed to save exercises to localStorage:", error);
      }
    }
  }, [exercises, isMounted]);

  const handleCreateNewClick = () => {
    setCurrentEditingExercise(null);
    setEditingTitle("New Exercise");
    setEditingHtmlContent(defaultExerciseHtmlContent);
    setView('create');
  };

  const handleEditClick = (exercise: ExerciseItem) => {
    setCurrentEditingExercise(exercise);
    setEditingTitle(exercise.title);
    setEditingHtmlContent(exercise.htmlContent);
    setView('edit');
  };

  const handleSaveExercise = () => {
    if (!editingTitle.trim()) {
      alert("Title cannot be empty."); 
      return;
    }

    if (view === 'create') {
      const newExercise: ExerciseItem = {
        id: Date.now().toString(),
        title: editingTitle,
        htmlContent: editingHtmlContent,
        createdAt: new Date().toISOString(),
      };
      setExercises(prev => [newExercise, ...prev]);
    } else if (view === 'edit' && currentEditingExercise) {
      setExercises(prev => 
        prev.map(ex => 
          ex.id === currentEditingExercise.id 
            ? { ...ex, title: editingTitle, htmlContent: editingHtmlContent } 
            : ex
        )
      );
    }
    setView('list');
    setCurrentEditingExercise(null);
  };

  const confirmDelete = (exerciseId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
    setExerciseToDelete(null);
  };

  const handleCancelEditCreate = () => {
    setView('list');
    setCurrentEditingExercise(null);
    setEditingTitle("");
    setEditingHtmlContent(defaultExerciseHtmlContent);
  };

  const handleExpandExercise = (htmlContent: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    } else {
      alert("Failed to open new tab. Please check your pop-up blocker settings.");
    }
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <BookMarked className="w-8 h-8" />
            My Exercises
          </h1>
          <CardDescription>Create, manage, and attempt your HTML-based exercises.</CardDescription>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleCreateNewClick}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Exercise
          </Button>
        </div>

        {exercises.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <FileText className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <CardTitle>No Exercises Created Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Click "Create New Exercise" to add your first one.</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {exercises.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(exercise => (
              <Card key={exercise.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">{exercise.title}</CardTitle>
                  <CardDescription>
                    Created: {new Date(exercise.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pt-2">
                  <div className="w-full h-64 border rounded-md overflow-hidden bg-white relative shadow-inner">
                    {exercise.htmlContent ? (
                      <iframe
                        srcDoc={exercise.htmlContent}
                        title={`${exercise.title} - Preview`}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        scrolling="auto" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No HTML content for this exercise.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleExpandExercise(exercise.htmlContent)}>
                    <Expand className="mr-1 h-4 w-4" /> Expand
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(exercise)}>
                    <Edit3 className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" onClick={() => setExerciseToDelete(exercise.id)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    {exerciseToDelete === exercise.id && (
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the exercise titled "{exercise.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setExerciseToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => confirmDelete(exercise.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    )}
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 'edit' or 'create' view
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <BookMarked className="w-8 h-8" />
          {view === 'create' ? 'Create New Exercise' : `Edit Exercise: ${currentEditingExercise?.title || ''}`}
        </h1>
        <div className="flex gap-2">
           <Button onClick={handleSaveExercise}>
            <Save className="mr-2 h-4 w-4" /> Save Exercise
          </Button>
          <Button variant="outline" onClick={handleCancelEditCreate}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      </div>
      
      <Input
        type="text"
        placeholder="Exercise Title"
        value={editingTitle}
        onChange={(e) => setEditingTitle(e.target.value)}
        className="text-lg font-semibold mb-4"
      />

      <div className="grid md:grid-cols-2 gap-8 h-[calc(100vh-18rem)] md:h-[calc(100vh-16rem)]">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <CodeXml className="w-6 h-6" />
              Exercise HTML Editor
            </CardTitle>
            <CardDescription>Enter the HTML content for your exercise.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 md:p-1">
            <div className="rounded-md border h-full overflow-hidden">
              <Editor
                height="100%"
                language="html"
                theme={editorTheme}
                value={editingHtmlContent}
                onChange={(value) => setEditingHtmlContent(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <MonitorPlay className="w-6 h-6" />
              Live Preview
            </CardTitle>
            <CardDescription>See how your exercise will be rendered.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 md:p-1">
            <iframe
              srcDoc={editingHtmlContent}
              title="Exercise HTML Preview"
              className="w-full h-full border rounded-md bg-white"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms" 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

