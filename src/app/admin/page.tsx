'use client';

import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage('');
      setError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!fileType || !['pdf', 'csv'].includes(fileType)) {
      setError('Unsupported file type. Please upload PDF or CSV files.');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/scholarships', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setMessage(data.message || 'File uploaded successfully');
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Scholarship Data Admin</h1>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Upload Scholarship Data</h2>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <span className="block text-sm font-medium">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    PDF or CSV files only
                  </span>
                  <Input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.csv"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <Button
                type="submit"
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Scholarship Data'
                )}
              </Button>
            </form>

            {message && (
              <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
