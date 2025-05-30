
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { compileCode, CompileCodeInput, CompileCodeOutput } from '@/ai/flows/compile-code';
import { TerminalSquare, Play, Loader2, AlertTriangle } from "lucide-react";
import Editor from "@monaco-editor/react";

const defaultJavaCode = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, DevSpace!");
        // Your Java code here
    }
}`;

export default function JavaEditorPage() {
  const [code, setCode] = useState<string>(defaultJavaCode);
  const [output, setOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [editorTheme, setEditorTheme] = useState('vs-light');

  useEffect(() => {
    setIsMounted(true);
    const savedCode = localStorage.getItem("javaCode");
    if (savedCode) {
      setCode(savedCode);
    }

    // Set editor theme based on HTML class
    const updateTheme = () => {
      if (document.documentElement.classList.contains('dark')) {
        setEditorTheme('vs-dark');
      } else {
        setEditorTheme('vs-light');
      }
    };
    updateTheme(); // Initial theme check

    // Observe changes to the html class for dynamic theme updates
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      observer.disconnect();
    };
  }, []);
  
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("javaCode", code);
    }
  }, [code, isMounted]);

  const handleRunCode = async () => {
    setIsLoading(true);
    setOutput("");
    setError(null);
    try {
      const input: CompileCodeInput = { code };
      const result: CompileCodeOutput = await compileCode(input);
      setOutput(result.output);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during compilation.");
      setOutput(""); 
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Java Online Compiler</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <TerminalSquare className="w-6 h-6" />
            Code Editor
          </CardTitle>
          <CardDescription>
            Write your Java code below and click "Compile & Run" to see the output.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border overflow-hidden">
            <Editor
              height="320px"
              language="java"
              theme={editorTheme}
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          <Button onClick={handleRunCode} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Compile & Run
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Output</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Compiling and running...
            </div>
          )}
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error:</p>
                <pre className="whitespace-pre-wrap font-code text-sm">{error}</pre>
              </div>
            </div>
          )}
          {!isLoading && !error && output && (
            <div className="p-4 bg-secondary/30 rounded-md">
               <pre className="whitespace-pre-wrap font-code text-sm">{output}</pre>
            </div>
          )}
          {!isLoading && !error && !output && (
            <p className="text-muted-foreground">Output will appear here after running your code.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
