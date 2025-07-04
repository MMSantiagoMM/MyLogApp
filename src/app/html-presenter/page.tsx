
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Editor from "@monaco-editor/react";
import { 
  Presentation, CodeXml, MonitorPlay, Loader2, List, PlusCircle, FileText, Edit3, Trash2, Save, XCircle, AlertTriangle, Expand
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
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, Timestamp } from 'firebase/firestore';
import type { HtmlPresenterItem } from '@/lib/data';
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/AuthContext';

const defaultHtmlContent = `
Paste your HTML code here
`;

export default function HtmlPresenterPage() {
  const { userData } = useAuth();
  const isProfesor = userData?.role === 'profesor';

  const [presenters, setPresenters] = useState<HtmlPresenterItem[]>([]);
  const [view, setView] = useState<'list' | 'edit' | 'create'>('list');
  const [currentEditingPresenter, setCurrentEditingPresenter] = useState<HtmlPresenterItem | null>(null);
  
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingHtmlContent, setEditingHtmlContent] = useState<string>(defaultHtmlContent);

  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editorTheme, setEditorTheme] = useState('vs-light');
  const [presenterToDelete, setPresenterToDelete] = useState<HtmlPresenterItem | null>(null);
  const { toast } = useToast();

  const fetchPresenters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const presentersCollection = collection(db, 'presenter');
      const q = query(presentersCollection, orderBy('createdAt', 'desc'));
      const presenterSnapshot = await getDocs(q);
      const presenterList = presenterSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          htmlContent: data.htmlContent,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        };
      });
      setPresenters(presenterList);
    } catch (err: any) {
      console.error("Error fetching presenters:", err);
      let userFriendlyError = "Could not load presenters. " + (err.message || "");
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
        fetchPresenters();
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
  }, [fetchPresenters]);

  const handleCreateNewClick = () => {
    if (!isProfesor) return;
    setCurrentEditingPresenter(null);
    setEditingTitle("New Presentation");
    setEditingHtmlContent(defaultHtmlContent);
    setView('create');
  };

  const handleEditClick = (presenter: HtmlPresenterItem) => {
    if (!isProfesor) return;
    setCurrentEditingPresenter(presenter);
    setEditingTitle(presenter.title);
    setEditingHtmlContent(presenter.htmlContent);
    setView('edit');
  };

  const handleSavePresenter = async () => {
    if (!isProfesor) return;
    if (!editingTitle.trim()) {
      toast({ variant: "destructive", title: "Title cannot be empty."}); 
      return;
    }

    setIsSubmitting(true);
    try {
      if (view === 'create') {
        await addDoc(collection(db, 'presenter'), {
          title: editingTitle,
          htmlContent: editingHtmlContent,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Presenter Created", description: `"${editingTitle}" has been saved.` });
      } else if (view === 'edit' && currentEditingPresenter) {
        const presenterRef = doc(db, 'presenter', currentEditingPresenter.id);
        await updateDoc(presenterRef, {
          title: editingTitle,
          htmlContent: editingHtmlContent,
        });
        toast({ title: "Presenter Updated", description: `"${editingTitle}" has been updated.` });
      }
      setView('list');
      setCurrentEditingPresenter(null);
      fetchPresenters();
    } catch (err: any) {
      console.error("Error saving presenter:", err);
      toast({ variant: "destructive", title: "Error Saving Presenter", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!presenterToDelete || !isProfesor) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'presenter', presenterToDelete.id));
      toast({ title: "Presenter Deleted", description: `"${presenterToDelete.title}" has been removed.`});
      fetchPresenters();
    } catch (err: any) {
      console.error("Error deleting presenter:", err);
      toast({ variant: "destructive", title: "Error Deleting Presenter", description: err.message });
    } finally {
      setIsSubmitting(false);
      setPresenterToDelete(null);
    }
  };

  const handleCancelEditCreate = () => {
    setView('list');
    setCurrentEditingPresenter(null);
    setEditingTitle("");
    setEditingHtmlContent(defaultHtmlContent);
  };

  const handleExpandPresenter = (htmlContent: string) => {
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
            <Presentation className="w-8 h-8" />
            HTML Presenters
          </h1>
          <CardDescription>Create, manage, and view your HTML presentations.</CardDescription>
        </div>
        {isProfesor && (
          <div className="flex justify-end">
            <Button onClick={handleCreateNewClick}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Presenter
            </Button>
          </div>
        )}

        {isLoading && (
            <div className="flex items-center text-lg text-muted-foreground py-10 justify-center">
                <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                Loading presenters from Firestore...
            </div>
        )}

        {!isLoading && error && (
            <div className="text-center py-12 text-destructive">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-semibold">Failed to Load Presenters</p>
                <p className="max-w-md mx-auto">{error}</p>
            </div>
        )}

        {!isLoading && !error && presenters.length === 0 && (
          <Card className="text-center py-12">
            <CardHeader>
              <FileText className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <CardTitle>No HTML Presenters Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{isProfesor ? 'Click "Create New Presenter" to get started.' : 'No presenters are available at the moment.'}</CardDescription>
            </CardContent>
          </Card>
        )} 
        
        {!isLoading && !error && presenters.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {presenters.map(presenter => (
              <Card key={presenter.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">{presenter.title}</CardTitle>
                  <CardDescription>
                    Created: {new Date(presenter.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pt-2">
                  <div className="w-full h-48 border rounded-md overflow-hidden bg-white relative shadow-inner">
                    {presenter.htmlContent ? (
                      <iframe
                        srcDoc={`<style>body{zoom:0.5; overflow:hidden; margin:0; padding:8px; box-sizing:border-box;} html,body{width:200%;height:200%;}</style>${presenter.htmlContent}`}
                        title={`${presenter.title} - Preview`}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                        scrolling="no" 
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>No HTML content to preview.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" size="sm" onClick={() => handleExpandPresenter(presenter.htmlContent)} disabled={isSubmitting}>
                    <Expand className="mr-1 h-4 w-4" /> Expand
                  </Button>
                  {isProfesor && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(presenter)} disabled={isSubmitting}>
                        <Edit3 className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <AlertDialog onOpenChange={(open) => !open && setPresenterToDelete(null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" onClick={() => setPresenterToDelete(presenter)} disabled={isSubmitting}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        {presenterToDelete?.id === presenter.id && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the presenter titled "{presenterToDelete.title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setPresenterToDelete(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-y-2">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
          <Presentation className="w-8 h-8" />
          {view === 'create' ? 'Create New Presenter' : `Edit: ${currentEditingPresenter?.title || 'Presenter'}`}
        </h1>
        <div className="flex gap-2 flex-wrap">
           <Button onClick={handleSavePresenter} disabled={isSubmitting || !isProfesor}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Saving..." : "Save Presenter"}
          </Button>
          <Button variant="outline" onClick={handleCancelEditCreate} disabled={isSubmitting}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      </div>
      
      <Input
        type="text"
        placeholder="Presenter Title"
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
              HTML Editor
            </CardTitle>
            <CardDescription>Enter the HTML content for your presenter.</CardDescription>
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
            <CardDescription>See how your presenter will be rendered.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 md:p-1">
            <iframe
              srcDoc={editingHtmlContent}
              title="HTML Preview"
              className="w-full h-full border rounded-md bg-white"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
