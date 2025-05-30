
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Editor from "@monaco-editor/react";
import { 
  Presentation, CodeXml, MonitorPlay, Loader2, List, PlusCircle, FileText, Edit3, Trash2, Save, XCircle, AlertTriangle 
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

const defaultHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My HTML Page</title>
    <style>
        body { font-family: sans-serif; padding: 20px; background-color: #f0f0f0; color: #333; }
        h1 { color: #007bff; }
        .container { background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, HTML Presenter!</h1>
        <p>Edit this content in the editor to see it update live!</p>
        <button onclick="alert('Button clicked!')">Click Me</button>
    </div>
    <script>
        console.log("JavaScript is running!");
    </script>
</body>
</html>`;

interface HtmlPresenterItem {
  id: string;
  title: string;
  htmlContent: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = "htmlPresentersList_v1"; // Added _v1 for potential future migrations

export default function HtmlPresenterPage() {
  const [presenters, setPresenters] = useState<HtmlPresenterItem[]>([]);
  const [view, setView] = useState<'list' | 'edit' | 'create'>('list');
  const [currentEditingPresenter, setCurrentEditingPresenter] = useState<HtmlPresenterItem | null>(null);
  
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [editingHtmlContent, setEditingHtmlContent] = useState<string>(defaultHtmlContent);

  const [isMounted, setIsMounted] = useState(false);
  const [editorTheme, setEditorTheme] = useState('vs-light');
  const [presenterToDelete, setPresenterToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      const savedPresenters = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedPresenters) {
        setPresenters(JSON.parse(savedPresenters));
      }
    } catch (error) {
      console.error("Failed to load presenters from localStorage:", error);
      setPresenters([]); // Fallback to empty list on error
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
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(presenters));
      } catch (error) {
        console.error("Failed to save presenters to localStorage:", error);
      }
    }
  }, [presenters, isMounted]);

  const handleCreateNewClick = () => {
    setCurrentEditingPresenter(null);
    setEditingTitle("New Presentation");
    setEditingHtmlContent(defaultHtmlContent);
    setView('create');
  };

  const handleEditClick = (presenter: HtmlPresenterItem) => {
    setCurrentEditingPresenter(presenter);
    setEditingTitle(presenter.title);
    setEditingHtmlContent(presenter.htmlContent);
    setView('edit');
  };

  const handleSavePresenter = () => {
    if (!editingTitle.trim()) {
      alert("Title cannot be empty."); // Simple validation
      return;
    }

    if (view === 'create') {
      const newPresenter: HtmlPresenterItem = {
        id: Date.now().toString(),
        title: editingTitle,
        htmlContent: editingHtmlContent,
        createdAt: new Date().toISOString(),
      };
      setPresenters(prev => [newPresenter, ...prev]);
    } else if (view === 'edit' && currentEditingPresenter) {
      setPresenters(prev => 
        prev.map(p => 
          p.id === currentEditingPresenter.id 
            ? { ...p, title: editingTitle, htmlContent: editingHtmlContent } 
            : p
        )
      );
    }
    setView('list');
    setCurrentEditingPresenter(null);
  };

  const confirmDelete = (presenterId: string) => {
    setPresenters(prev => prev.filter(p => p.id !== presenterId));
    setPresenterToDelete(null);
  };

  const handleCancelEditCreate = () => {
    setView('list');
    setCurrentEditingPresenter(null);
    setEditingTitle("");
    setEditingHtmlContent(defaultHtmlContent);
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
        </div>
        <div className="flex justify-end">
          <Button onClick={handleCreateNewClick}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Presenter
          </Button>
        </div>

        {presenters.length === 0 ? (
          <Card className="text-center py-12">
            <CardHeader>
              <FileText className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
              <CardTitle>No HTML Presenters Yet</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Click "Create New Presenter" to get started.</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {presenters.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(presenter => (
              <Card key={presenter.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">{presenter.title}</CardTitle>
                  <CardDescription>
                    Created: {new Date(presenter.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {/* Basic preview of content, could be improved */}
                    {presenter.htmlContent.replace(/<[^>]*>?/gm, '').substring(0, 100) || "No content preview."}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(presenter)}>
                    <Edit3 className="mr-1 h-4 w-4" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" onClick={() => setPresenterToDelete(presenter.id)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    {presenterToDelete === presenter.id && (
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the presenter titled "{presenter.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setPresenterToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => confirmDelete(presenter.id)}>
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
          <Presentation className="w-8 h-8" />
          {view === 'create' ? 'Create New Presenter' : `Edit: ${currentEditingPresenter?.title || 'Presenter'}`}
        </h1>
        <div className="flex gap-2">
           <Button onClick={handleSavePresenter}>
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>
          <Button variant="outline" onClick={handleCancelEditCreate}>
            <XCircle className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      </div>
      
      <Input
        type="text"
        placeholder="Presenter Title"
        value={editingTitle}
        onChange={(e) => setEditingTitle(e.target.value)}
        className="text-lg font-semibold mb-4"
      />

      <div className="grid md:grid-cols-2 gap-8 h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)]"> {/* Increased height */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <CodeXml className="w-6 h-6" />
              HTML Editor
            </CardTitle>
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

