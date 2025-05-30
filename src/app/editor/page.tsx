"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { compileCode, CompileCodeInput, CompileCodeOutput } from '@/ai/flows/compile-code';
import { TerminalSquare, Play, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { ScrollArea } from '@/components/ui/scroll-area';

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

  useEffect(() => {
    setIsMounted(true);
    // Load code from localStorage if available
    const savedCode = localStorage.getItem("javaCode");
    if (savedCode) {
      setCode(savedCode);
    }
  }, []);
  
  useEffect(() => {
    if (isMounted) {
      // Save code to localStorage on change
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
      setOutput(""); // Clear output on error
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
          <ScrollArea className="h-80 w-full rounded-md border">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your Java code here..."
              className="min-h-[300px] resize-none font-code text-sm p-4 focus-visible:ring-primary"
              aria-label="Java Code Editor"
            />
          </ScrollArea>
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
