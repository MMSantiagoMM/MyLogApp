
"use client";

import React from 'react';
import JavaEditor from '@/components/JavaEditor';
import { Loader2 } from 'lucide-react';

export default function NewJavaEditorPage() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col justify-center items-center h-screen w-screen fixed inset-0 bg-background z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground mt-4">Loading Editor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full p-0 m-0">
      {/* 
        This page is designed to give maximum space to the JavaEditor.
        The JavaEditor component itself handles its internal layout,
        including collapsible input/output panes which allow vertical resizing.
        Horizontal size is determined by this page's container, which is set to full width.
      */}
      <JavaEditor localStorageSuffix="_new_standalone_editor_v2" />
    </div>
  );
}
