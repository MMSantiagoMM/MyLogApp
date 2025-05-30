
"use client";

import React, { useState, useEffect, useRef } from 'react';
import JavaEditor, { type JavaEditorRef } from '@/components/JavaEditor';
import { Button } from "@/components/ui/button";
import { Loader2, Maximize2, Minimize2 } from 'lucide-react';

export default function JavaCompilerPage() {
  const [isMounted, setIsMounted] = React.useState(false);
  const editorRef = useRef<JavaEditorRef>(null);
  const [panesForceCollapsed, setPanesForceCollapsed] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    // Check initial collapse state from editor after mount
    // and ensure button state is synced if editor was already collapsed/expanded
    if (editorRef.current) {
        setPanesForceCollapsed(editorRef.current.arePanesCurrentlyForcedCollapsed());
    }
  }, []);

  const handleTogglePanes = () => {
    if (editorRef.current) {
      const newCollapseState = editorRef.current.togglePanes();
      setPanesForceCollapsed(newCollapseState);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground mt-4">Loading Editor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-0 m-0 relative">
      <div className="absolute top-2 right-2 z-10">
        <Button variant="outline" size="sm" onClick={handleTogglePanes}>
          {panesForceCollapsed ? (
            <Minimize2 className="mr-2 h-4 w-4" />
          ) : (
            <Maximize2 className="mr-2 h-4 w-4" />
          )}
          {panesForceCollapsed ? 'Restore Panes' : 'Maximize Editor'}
        </Button>
      </div>
      <div className="flex-grow min-h-0"> {/* Ensure JavaEditor can grow properly */}
        {/* Added a unique suffix to avoid localStorage conflicts */}
        <JavaEditor ref={editorRef} localStorageSuffix="_standalone_compiler_page" />
      </div>
    </div>
  );
}
