
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Editor from "@monaco-editor/react";
import { Presentation, CodeXml, MonitorPlay, Loader2 } from "lucide-react";

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

export default function HtmlPresenterPage() {
  const [htmlContent, setHtmlContent] = useState<string>(defaultHtmlContent);
  const [isMounted, setIsMounted] = useState(false);
  const [editorTheme, setEditorTheme] = useState('vs-light');

  useEffect(() => {
    setIsMounted(true);
    const savedHtml = localStorage.getItem("htmlPresenterContent");
    if (savedHtml) {
      setHtmlContent(savedHtml);
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
      localStorage.setItem("htmlPresenterContent", htmlContent);
    }
  }, [htmlContent, isMounted]);

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <Presentation className="w-8 h-8" />
        HTML Presenter
      </h1>
      
      <div className="grid md:grid-cols-2 gap-8 h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <CodeXml className="w-6 h-6" />
              HTML Editor
            </CardTitle>
            <CardDescription>
              Write your HTML, CSS, and JavaScript code below. The preview will update live.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 md:p-1">
            <div className="rounded-md border h-full overflow-hidden">
              <Editor
                height="100%"
                language="html"
                theme={editorTheme}
                value={htmlContent}
                onChange={(value) => setHtmlContent(value || "")}
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
            <CardDescription>
              Your rendered HTML will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 md:p-1">
            <iframe
              srcDoc={htmlContent}
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
