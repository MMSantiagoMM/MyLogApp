"use client"; // For handling form state and interactions

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, FileText, Download, Trash2, FolderArchive } from "lucide-react";
import { mockFiles, FileData } from '@/lib/data'; // Using mock data

export default function FileRepositoryPage() {
  const [files, setFiles] = useState<FileData[]>(mockFiles);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      const newFile: FileData = {
        id: String(files.length + 1),
        name: selectedFile.name,
        type: selectedFile.type.split('/')[1] || 'file',
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`,
        date: new Date().toLocaleDateString(),
        url: URL.createObjectURL(selectedFile) // Temporary URL for demo
      };
      setFiles(prevFiles => [newFile, ...prevFiles]);
      setSelectedFile(null);
      // In a real app, you would upload to a server here
      alert(`File "${selectedFile.name}" uploaded (simulated).`);
    }
  };

  const handleDelete = (fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    alert(`File with ID ${fileId} deleted (simulated).`);
  };
  
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('zip') || type.includes('archive')) return <FolderArchive className="w-5 h-5 text-yellow-500" />;
    if (type.includes('image')) return <FileText className="w-5 h-5 text-blue-500" />; // Placeholder, could use specific image icon
    return <FileText className="w-5 h-5 text-gray-500" />;
  };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">File Repository</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <UploadCloud className="w-6 h-6" />
            Upload New File
          </CardTitle>
          <CardDescription>
            Select a file from your computer to upload to DevSpace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input type="file" onChange={handleFileChange} className="flex-grow" />
            <Button onClick={handleUpload} disabled={!selectedFile}>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload File
            </Button>
          </div>
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Uploaded Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">
                <FolderArchive className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No files uploaded yet.</p>
                <p>Start by uploading your documents and resources.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Date Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>{getFileIcon(file.type)}</TableCell>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>{file.size}</TableCell>
                    <TableCell>{file.date}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" asChild>
                        <a href={file.url} download={file.name} aria-label={`Download ${file.name}`}>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(file.id)} aria-label={`Delete ${file.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
