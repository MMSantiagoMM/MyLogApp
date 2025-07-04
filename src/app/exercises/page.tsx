
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Editor from "@monaco-editor/react";
import { 
  BookMarked, CodeXml, MonitorPlay, Loader2, PlusCircle, Edit3, Trash2, Save, XCircle, FileText, Expand, PlayCircle, ArrowLeft,
  PanelLeftClose, PanelLeftOpen, ArrowRightLeft, AlertTriangle
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
import JavaEditor from '@/components/JavaEditor'; 
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { ExerciseItem } from '@/lib/data';
import { useAuth } from '@/context/AuthContext';

const defaultExerciseHtmlContent = `
Paste your HTML code here
`;

type InstructionPanelState = 'hidden' | 'small' | 'medium';

export default function ExercisesPage() {
  const { userData } = useAuth();
  const isProfesor = userData?.role === 'profesor';

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [view, setView] = useState<'list' | 'edit' | 'create' | 'attempt'>('list');
  const [currentEditingExercise, setCurrentEditingExercise] = useState<ExerciseItem | null>(null);
  const [currentAttemptingExercise, setCurrentAttemptingExercise] = useState<ExerciseItem | null>(null);
  
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingHtmlContent, setEditingHtmlContent] = useState<string>(defaultExerciseHtmlContent);

  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [editorTheme, setEditorTheme] = useState('vs-light');
  const [exerciseToDelete, setExerciseToDelete] = useState<ExerciseItem | null>(null);
  const [instructionPanelState, setInstructionPanelState] = useState<InstructionPanelState>('small');
  const { toast } = useToast();

  const fetchExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const exercisesCollection = collection(db, 'exercises');
      const q = query(exercisesCollection, orderBy('createdAt', 'desc'));
      const exerciseSnapshot = await getDocs(q);

      const exerciseList = exerciseSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          htmlContent: data.htmlContent,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
      });
      setExercises(exerciseList);
    } catch (err: any) {
      console.error("Error fetching exercises:", err);
      let userFriendlyError = "Could not load exercises. " + (err.message || "");
      if (err.code === 'permission-denied' || err.code === 'PERMISSION_DENIED') {
          userFriendlyError = "Firestore Security Rules are blocking access. Please update your Firestore rules in the Firebase Console.";
      }
      setError(userFriendlyError);
      toast({ variant: "destructive", title: "Error", description: userFriendlyError });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setIsMounted(true);
    if (db) {
        fetchExercises();
    } else {
        setError("Firebase Firestore is not initialized. Check your configuration.");
        setIsLoading(false);
    }

    const updateTheme = () => {
      setEditorTheme(document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs-light');
    };
    updateTheme(); 

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [fetchExercises]);


  const handleCreateNewClick = () => {
    if (!isProfesor) return;
    setCurrentEditingExercise(null);
    setCurrentAttemptingExercise(null);
    setEditingTitle("New Exercise");
    setEditingHtmlContent(defaultExerciseHtmlContent);
    setView('create');
  };

  const handleEditClick = (exercise: ExerciseItem) => {
    if (!isProfesor) return;
    setCurrentEditingExercise(exercise);
    setCurrentAttemptingExercise(null);
    setEditingTitle(exercise.title);
    setEditingHtmlContent(exercise.htmlContent);
    setView('edit');
  };

  const handleAttemptClick = (exercise: ExerciseItem) => {
    setCurrentAttemptingExercise(exercise);
    setCurrentEditingExercise(null);
    setInstructionPanelState('small'); 
    setView('attempt');
  };

  const handleSaveExercise = async () => {
    if (!isProfesor) return;
    if (!editingTitle.trim()) {
      toast({ variant: "destructive", title: "Title cannot be empty."}); 
      return;
    }

    setIsSubmitting(true);
    try {
      if (view === 'create') {
        await addDoc(collection(db, 'exercises'), {
          title: editingTitle,
          htmlContent: editingHtmlContent,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Exercise Created", description: `"${editingTitle}" has been saved.` });
      } else if (view === 'edit' && currentEditingExercise) {
        const exerciseRef = doc(db, 'exercises', currentEditingExercise.id);
        await updateDoc(exerciseRef, {
          title: editingTitle,
          htmlContent: editingHtmlContent,
        });
        toast({ title: "Exercise Updated", description: `"${editingTitle}" has been updated.` });
      }
      setView('list');
      setCurrentEditingExercise(null);
      fetchExercises(); // Refresh the list
    } catch (err: any) {
      console.error("Error saving exercise:", err);
      toast({ variant: "destructive", title: "Error Saving Exercise", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!exerciseToDelete || !isProfesor) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'exercises', exerciseToDelete.id));
      toast({ title: "Exercise Deleted", description: `"${exerciseToDelete.title}" has been removed.`});
      fetchExercises();
    } catch (err: any) {
      console.error("Error deleting exercise:", err);
      toast({ variant: "destructive", title: "Error Deleting Exercise", description: err.message });
    } finally {
      setIsSubmitting(false);
      setExerciseToDelete(null);
    }
  };

  const handleCancelEditCreateAttempt = () => {
    setView('list');
    setCurrentEditingExercise(null);
    setCurrentAttemptingExercise(null);
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

  const handleToggleInstructionPanelSize = () => {
    setInstructionPanelState(prevState => {
      if (prevState === 'small') return 'medium';
      if (prevState === 'medium') return 'hidden';
      return 'small'; 
    });
  };

  const getInstructionPanelButtonProps = () => {
    switch (instructionPanelState) {
      case 'small':
        return { text: 'Enlarge Instructions', Icon: ArrowRightLeft };
      case 'medium':
        return { text: 'Hide Instructions', Icon: PanelLeftClose };
      case 'hidden':
      default:
        return { text: 'Show Instructions', Icon: PanelLeftOpen };
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
        {isProfesor && (
          <div className="flex justify-end">
            <Button onClick={handleCreateNewClick}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Exercise
            </Button>
          </div>
        )}

        {isLoading && (
            <div className="flex items-center text-lg text-muted-foreground py-10 justify-center">
                <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                Loading exercises from Firestore...
            </div>
        )}

        {!isLoading && error && (
            <div className="text-center py-12 text-destructive">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-semibold">Failed to Load Exercises</p>
                <p className="max-w-md mx-auto">{error}</p>
            </div>
        )}

        {!isLoading && !error && exercises.length === 0 && (
          <Card className="text-center py-12">
            <CardHeader>
              <FileText className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <CardTitle>No Exercises Created Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{isProfesor ? 'Click "Create New Exercise" to add your first one.' : 'No exercises are available at the moment.'}</CardDescription>
            </CardContent>
          </Card>
        )} 
        
        {!isLoading && !error && exercises.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2"> 
            {exercises.map(exercise => (
              <Card key={exercise.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">{exercise.title}</CardTitle>
                  <CardDescription>
                    Created: {new Date(exercise.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pt-2">
                  <div className="w-full h-64 sm:h-80 md:h-96 border rounded-md overflow-hidden bg-white relative shadow-inner">
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
                  <Button variant="default" size="sm" onClick={() => handleAttemptClick(exercise)} disabled={isSubmitting}>
                    <PlayCircle className="mr-1 h-4 w-4" /> Attempt
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExpandExercise(exercise.htmlContent)} disabled={isSubmitting}>
                    <Expand className="mr-1 h-4 w-4" /> Expand
                  </Button>
                  {isProfesor && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(exercise)} disabled={isSubmitting}>
                        <Edit3 className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <AlertDialog onOpenChange={(open) => !open && setExerciseToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => setExerciseToDelete(exercise)} disabled={isSubmitting}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        {exerciseToDelete?.id === exercise.id && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the exercise titled "{exercise.title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setExerciseToDelete(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={confirmDelete} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        )}
                      </AlertDialog>
                    </>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === 'attempt' && currentAttemptingExercise) {
    const { text: instructionButtonText, Icon: InstructionButtonIcon } = getInstructionPanelButtonProps();
    return (
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex justify-between items-center flex-wrap gap-y-2">
            <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                Attempting: {currentAttemptingExercise.title}
            </h1>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={handleToggleInstructionPanelSize}>
                <InstructionButtonIcon className="mr-2 h-4 w-4" />
                {instructionButtonText}
              </Button>
              <Button variant="outline" onClick={handleCancelEditCreateAttempt}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Exercises
              </Button>
            </div>
        </div>
        <div className={cn(
            "flex-grow grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-15rem)] md:h-[calc(100vh-12rem)]" 
          )}
        >
            {instructionPanelState !== 'hidden' && (
              <Card className={cn(
                  "flex flex-col h-full overflow-hidden",
                  instructionPanelState === 'small' && "md:col-span-1",
                  instructionPanelState === 'medium' && "md:col-span-2"
                )}
              >
                  <CardHeader>
                      <CardTitle className="font-headline flex items-center gap-2 text-xl">
                          <MonitorPlay className="w-6 h-6" /> Exercise Instructions
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow p-0 md:p-1">
                      <iframe
                          srcDoc={currentAttemptingExercise.htmlContent}
                          title={`${currentAttemptingExercise.title} - Instructions`}
                          className="w-full h-full border rounded-md bg-white"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      />
                  </CardContent>
              </Card>
            )}
            <div className={cn(
                "h-full overflow-y-auto",
                instructionPanelState === 'hidden' && "md:col-span-4",
                instructionPanelState === 'small' && "md:col-span-3",
                instructionPanelState === 'medium' && "md:col-span-2"
              )}
            >
                 <JavaEditor localStorageSuffix={`_exercise_${currentAttemptingExercise.id}`} />
            </div>
        </div>
      </div>
    );
  }

  // 'edit' or 'create' view for exercises
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-y-2">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <BookMarked className="w-8 h-8" />
          {view === 'create' ? 'Create New Exercise' : `Edit Exercise: ${currentEditingExercise?.title || ''}`}
        </h1>
        <div className="flex gap-2 flex-wrap">
           <Button onClick={handleSaveExercise} disabled={isSubmitting || !isProfesor}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Saving..." : "Save Exercise"}
          </Button>
          <Button variant="outline" onClick={handleCancelEditCreateAttempt} disabled={isSubmitting}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      </div>
      
      <Input
        type="text"
        placeholder="Exercise Title"
        value={editingTitle}
        onChange={(e) => setEditingTitle(e.target.value)}
        className="text-lg font-semibold" 
        disabled={isSubmitting || !isProfesor}
      />

      <div className="grid md:grid-cols-2 gap-8 h-[calc(100vh-20rem)] md:h-[calc(100vh-18rem)]">
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
