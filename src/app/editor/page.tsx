
"use client";

import React from 'react';
import JavaEditor from '@/components/JavaEditor'; // Import the new reusable component
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
    <div className="space-y-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold font-headline">Java Online Compiler</h1>
      <div className="flex-grow">
        <JavaEditor localStorageSuffix="_standalone" /> 
      </div>
    </div>
  );
}
