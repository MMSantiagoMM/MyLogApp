
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { compileCode, CompileCodeInput, CompileCodeOutput } from '@/ai/flows/compile-code';
import { TerminalSquare, Play, Loader2, AlertTriangle, FileInputIcon } from "lucide-react";
import { cn } from '@/lib/utils';

const defaultJavaCode = `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java Editor!");
        
        // Example of reading user input:
        Scanner scanner = new Scanner(System.in);
        System.out.println("Enter something for the program:");
        if (scanner.hasNextLine()) {
            String userInputText = scanner.nextLine();
            System.out.println("Your program received: " + userInputText);
        } else {
            System.out.println("No input provided to the program.");
        }
        scanner.close();
        
        // Your Java code here
    }
}`;

const LOCAL_STORAGE_PREFIX = "javaEditorHorizontal_";
const CODE_KEY_SUFFIX = "code";
const USER_INPUT_KEY_SUFFIX = "userInput";

export default function JavaCompilerHorizontalPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [editorTheme, setEditorTheme] = useState('vs-light');
  
  const [code, setCode] = useState<string>(defaultJavaCode);
  const [userInput, setUserInput] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const codeKey = `${LOCAL_STORAGE_PREFIX}${CODE_KEY_SUFFIX}`;
  const userInputKey = `${LOCAL_STORAGE_PREFIX}${USER_INPUT_KEY_SUFFIX}`;

  useEffect(() => {
    setIsMounted(true);
    
    const savedCode = localStorage.getItem(codeKey);
    if (savedCode) {
      setCode(savedCode);
    }
    const savedUserInput = localStorage.getItem(userInputKey);
    if (savedUserInput) {
      setUserInput(savedUserInput);
    }

    const updateTheme = () => {
      setEditorTheme(document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs-light');
    };
    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [codeKey, userInputKey]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(codeKey, code);
    }
  }, [code, isMounted, codeKey]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(userInputKey, userInput);
    }
  }, [userInput, isMounted, userInputKey]);

  const handleRunCode = async () => {
    setIsLoading(true);
    setOutput("");
    setError(null);
    try {
      const inputData: CompileCodeInput = { code, userInput: userInput || undefined };
      const result: CompileCodeOutput = await compileCode(inputData);
      setOutput(result.output);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during compilation.");
      setOutput("");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted && typeof window !== "undefined") {
    return (
      <div className="flex flex-col justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground mt-4">Loading Editor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-0 m-0">
      {/* Header can be removed or repurposed if needed, for now it's empty as the button is gone */}
      {/* <div className="flex-shrink-0 p-2 border-b flex justify-end items-center"> */}
      {/* Button was here */}
      {/* </div> */}

      <div className={cn(
        "flex-grow grid gap-2 p-2 min-h-0",
        "grid-cols-1 md:grid-cols-4" 
      )}>
        {/* Code Editor Pane */}
        <Card className={cn(
          "flex flex-col",
          "md:col-span-3" 
        )}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="font-headline flex items-center gap-2 text-lg">
              <TerminalSquare className="w-5 h-5" />
              Code Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-1 min-h-0">
            <div className="rounded-md border overflow-hidden h-full">
              <Editor
                height="100%"
                language="java"
                theme={editorTheme}
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Side Panes (Input & Output) */}
        <div className="md:col-span-1 flex flex-col gap-2 min-h-0">
            {/* Standard Input Pane */}
            <Card className="flex flex-col flex-shrink-0">
              <CardHeader className="py-3 px-4">
                <CardTitle className="font-headline flex items-center gap-2 text-lg">
                  <FileInputIcon className="w-5 h-5" />
                  Standard Input
                </CardTitle>
                 <span className="text-xs text-muted-foreground">(Optional)</span>
              </CardHeader>
              <CardContent className="p-2">
                <Textarea
                  placeholder="Enter input for your program here..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="h-28 font-code text-sm resize-y"
                />
              </CardContent>
            </Card>

            {/* Output Pane */}
            <Card className="flex flex-col flex-grow min-h-0">
              <CardHeader className="py-3 px-4">
                <CardTitle className="font-headline text-lg">Output</CardTitle>
              </CardHeader>
              <CardContent className="p-2 flex-grow overflow-y-auto">
                {isLoading && (
                  <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Compiling and running...
                  </div>
                )}
                {error && (
                  <div className="p-2 bg-destructive/10 text-destructive rounded-md flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Error:</p>
                      <pre className="whitespace-pre-wrap font-code">{error}</pre>
                    </div>
                  </div>
                )}
                {!isLoading && !error && output && (
                  <div className="p-2 bg-secondary/30 rounded-md">
                    <pre className="whitespace-pre-wrap font-code text-sm">{output}</pre>
                  </div>
                )}
                {!isLoading && !error && !output && (
                  <p className="text-muted-foreground text-sm">Output will appear here.</p>
                )}
              </CardContent>
            </Card>
          </div>
      </div>
      
      <div className="flex-shrink-0 p-2 border-t">
        <Button onClick={handleRunCode} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Compile & Run
        </Button>
      </div>
    </div>
  );
}
