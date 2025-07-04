
"use client";

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { compileCode, CompileCodeInput, CompileCodeOutput } from '@/ai/flows/compile-code';
import { TerminalSquare, Play, Loader2, AlertTriangle, FileInputIcon } from "lucide-react";
import Editor from "@monaco-editor/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const defaultJavaCode = `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        
        //Write your code here!



    }
}`;

interface JavaEditorProps {
  initialCode?: string;
  initialUserInput?: string;
  localStorageSuffix?: string;
}

export interface JavaEditorRef {
  togglePanes: () => boolean; // Returns true if panes are now collapsed, false otherwise
  arePanesCurrentlyForcedCollapsed: () => boolean;
}

const JavaEditor = forwardRef<JavaEditorRef, JavaEditorProps>(
  ({ initialCode, initialUserInput, localStorageSuffix = "" }, ref) => {
    const codeKey = `javaCode${localStorageSuffix}`;
    const userInputKey = `javaUserInput${localStorageSuffix}`;

    const [code, setCode] = useState<string>(initialCode || defaultJavaCode);
    const [userInput, setUserInput] = useState<string>(initialUserInput || "");
    const [output, setOutput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [editorTheme, setEditorTheme] = useState('vs-light');

    // State for accordion items
    const defaultOpenAccordion = ['item-2']; // Output open by default
    const [openAccordionItems, setOpenAccordionItems] = useState<string[]>(defaultOpenAccordion);
    const [forcePanesCollapsed, setForcePanesCollapsed] = useState<boolean>(false);

    useImperativeHandle(ref, () => ({
      togglePanes: () => {
        const newForcedCollapseState = !forcePanesCollapsed;
        setForcePanesCollapsed(newForcedCollapseState);
        if (newForcedCollapseState) {
          setOpenAccordionItems([]); // Collapse all
        } else {
          setOpenAccordionItems(defaultOpenAccordion); // Restore default (e.g. output open)
        }
        return newForcedCollapseState;
      },
      arePanesCurrentlyForcedCollapsed: () => forcePanesCollapsed,
    }));

    useEffect(() => {
      setIsMounted(true);
      if (!initialCode) {
        const savedCode = localStorage.getItem(codeKey);
        if (savedCode) {
          setCode(savedCode);
        }
      }
      if (!initialUserInput) {
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
      if (isMounted && !initialCode) {
        localStorage.setItem(codeKey, code);
      }
    }, [code, isMounted, codeKey, initialCode]);

    useEffect(() => {
      if (isMounted && !initialUserInput) {
        localStorage.setItem(userInputKey, userInput);
      }
    }, [userInput, isMounted, userInputKey, initialUserInput]);

    const handleRunCode = async () => {
      setIsLoading(true);
      setOutput("");
      setError(null);
      try {
        const inputData: CompileCodeInput = { code, userInput: userInput || undefined };
        const result: CompileCodeOutput = await compileCode(inputData);
        setOutput(result.output);
        // If output is generated, ensure output pane is open if not forced collapsed
        if (!forcePanesCollapsed && !openAccordionItems.includes('item-2')) {
            setOpenAccordionItems(prev => [...prev.filter(item => item !== 'item-1'), 'item-2']);
        } else if (!forcePanesCollapsed && openAccordionItems.length === 0) {
             setOpenAccordionItems(['item-2']);
        }

      } catch (e: any) {
        setError(e.message || "An unexpected error occurred during compilation.");
        setOutput("");
         // If error occurs, ensure output pane is open if not forced collapsed
        if (!forcePanesCollapsed && !openAccordionItems.includes('item-2')) {
            setOpenAccordionItems(prev => [...prev.filter(item => item !== 'item-1'), 'item-2']);
        } else if (!forcePanesCollapsed && openAccordionItems.length === 0) {
            setOpenAccordionItems(['item-2']);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    const handleAccordionValueChange = (values: string[]) => {
      setOpenAccordionItems(values);
      if (forcePanesCollapsed) {
        // If user interacts with accordion, turn off force collapse mode
        setForcePanesCollapsed(false);
      }
    };


    if (!isMounted && typeof window !== "undefined") {
      return (
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    const currentAccordionValue = forcePanesCollapsed ? [] : openAccordionItems;

    return (
      <div className="space-y-2 h-full flex flex-col">
        <Card className="flex-grow flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2 text-xl">
              <TerminalSquare className="w-5 h-5" />
              Code Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-1">
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

        <Button onClick={handleRunCode} disabled={isLoading} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Compile & Run
        </Button>

        <Accordion 
            type="multiple" 
            className="w-full space-y-2" 
            value={currentAccordionValue}
            onValueChange={handleAccordionValueChange}
        >
          <AccordionItem value="item-1" className="border-b-0">
            <Card>
              <AccordionTrigger className="w-full p-0 hover:no-underline">
                <CardHeader className="flex flex-row items-center justify-between w-full py-2 px-3">
                  <div className="flex items-center gap-2">
                    <FileInputIcon className="w-5 h-5" />
                    <CardTitle className="font-headline text-base">Standard Input (Optional)</CardTitle>
                  </div>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0 pb-3 px-4">
                  <Textarea
                    placeholder="Enter input for your program here..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="h-24 font-code text-sm"
                  />
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-b-0">
            <Card>
              <AccordionTrigger className="w-full p-0 hover:no-underline">
                <CardHeader className="flex flex-row items-center justify-between w-full py-2 px-3">
                  <CardTitle className="font-headline text-base">Output</CardTitle>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0 pb-3 px-4">
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
                    <p className="text-muted-foreground text-sm">Output will appear here after running code.</p>
                  )}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }
);

JavaEditor.displayName = 'JavaEditor';
export default JavaEditor;
