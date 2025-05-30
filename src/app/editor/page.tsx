
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
        System.out.println("Hello, DevSpace!");
        
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

export default function JavaEditorPage() {
  const [code, setCode] = useState<string>(defaultJavaCode);
  const [userInput, setUserInput] = useState<string>("");
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
    const savedUserInput = localStorage.getItem("javaUserInput");
    if (savedUserInput) {
      setUserInput(savedUserInput);
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
      localStorage.setItem("javaCode", code);
    }
  }, [code, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("javaUserInput", userInput);
    }
  }, [userInput, isMounted]);

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

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Java Online Compiler</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <TerminalSquare className="w-6 h-6" />
                Code Editor
              </CardTitle>
              <CardDescription>
                Write your Java code below.
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <FileInputIcon className="w-6 h-6" />
                Standard Input (Optional)
              </CardTitle>
              <CardDescription>
                Provide input for your program (e.g., for `Scanner(System.in)`). Each line will be treated as a separate input line.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter input for your program here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="h-24 font-code text-sm"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Button onClick={handleRunCode} disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Compile & Run
          </Button>
          <Card className="h-full">
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
      </div>
    </div>
  );
}
