
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { compileCode, CompileCodeInput, CompileCodeOutput } from '@/ai/flows/compile-code';
import { TerminalSquare, Play, Loader2, AlertTriangle, FileInputIcon } from "lucide-react";
import Editor from "@monaco-editor/react";

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

interface JavaEditorProps {
  initialCode?: string;
  initialUserInput?: string;
  localStorageSuffix?: string; // To allow different instances to use different localStorage keys
}

export default function JavaEditor({ initialCode, initialUserInput, localStorageSuffix = "" }: JavaEditorProps) {
  const codeKey = `javaCode${localStorageSuffix}`;
  const userInputKey = `javaUserInput${localStorageSuffix}`;

  const [code, setCode] = useState<string>(initialCode || defaultJavaCode);
  const [userInput, setUserInput] = useState<string>(initialUserInput || "");
  const [output, setOutput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [editorTheme, setEditorTheme] = useState('vs-light');

  useEffect(() => {
    setIsMounted(true);
    if (!initialCode) { // Only load from localStorage if no initialCode prop is passed
      const savedCode = localStorage.getItem(codeKey);
      if (savedCode) {
        setCode(savedCode);
      }
    }
    if (!initialUserInput) { // Only load from localStorage if no initialUserInput prop is passed
      const savedUserInput = localStorage.getItem(userInputKey);
      if (savedUserInput) {
        setUserInput(savedUserInput);
      }
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
  }, [codeKey, userInputKey, initialCode, initialUserInput]);
  
  useEffect(() => {
    if (isMounted && !initialCode) { // Only save to localStorage if no initialCode prop is passed
      localStorage.setItem(codeKey, code);
    }
  }, [code, isMounted, codeKey, initialCode]);

  useEffect(() => {
    if (isMounted && !initialUserInput) { // Only save to localStorage if no initialUserInput prop is passed
      localStorage.setItem(userInputKey, userInput);
    }
  }, [userInput, isMounted, userInputKey, initialUserInput]);

  const handleRunCode = async () => {
    setIsLoading(true);
    setOutput("");
    setError(null);
    try {
      const input: CompileCodeInput = { code, userInput: userInput || undefined };
      const result: CompileCodeOutput = await compileCode(input);
      setOutput(result.output);
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during compilation.");
      setOutput(""); 
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted && typeof window !== "undefined") { // Basic check for client-side rendering
    return (
      <div className="flex justify-center items-center h-full py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full h-full flex flex-col">
      <div className="flex-grow grid md:grid-cols-1 gap-6"> {/* Changed to 1 column for better stacking in split view */}
        <div className="space-y-6 flex flex-col">
          <Card className="flex-grow flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2 text-xl">
                <TerminalSquare className="w-5 h-5" />
                Code Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col">
              <div className="rounded-md border overflow-hidden flex-grow">
                <Editor
                  height="100%" // Make editor take full height of its container
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

          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2 text-xl">
                <FileInputIcon className="w-5 h-5" />
                Standard Input (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter input for your program here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="h-20 font-code text-sm" // Reduced height
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 flex flex-col">
           <Button onClick={handleRunCode} disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Compile & Run
          </Button>
          <Card className="flex-grow flex flex-col">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Output</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              {isLoading && (
                <div className="flex items-center text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Compiling and running...
                </div>
              )}
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Error:</p>
                    <pre className="whitespace-pre-wrap font-code text-sm">{error}</pre>
                  </div>
                </div>
              )}
              {!isLoading && !error && output && (
                <div className="p-3 bg-secondary/30 rounded-md">
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
    </div>
  );
}
