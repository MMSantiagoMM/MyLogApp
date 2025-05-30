
"use client";

import React from 'react';
import JavaEditor from '@/components/JavaEditor';
import { Loader2 } from 'lucide-react';

export default function JavaEditorPage() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full"> {/* Occupy full height of AppShell's main content area */}
      <div className="py-4"> {/* Compact header for the title */}
        <h1 className="text-3xl font-bold font-headline text-center sm:text-left">
          Java Online Compiler
        </h1>
      </div>
      <div className="flex-grow flex flex-col min-h-0"> {/* Allows JavaEditor to expand */}
        {/* JavaEditor component is designed to fill its container */}
        <JavaEditor localStorageSuffix="_standalone_editor_page" />
      </div>
    </div>
  );
}
