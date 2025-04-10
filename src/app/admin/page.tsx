'use client';

import React, { useState, useEffect } from 'react';
import { Upload, Loader2, FileText, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';

// Interface for document data
interface Document {
  id: string;
  title: string;
  source_file: string;
  file_type: string;
  category: 'global' | 'school-specific';
  source?: string;
  is_active: boolean;
  created_at: string;
  last_updated: string;
}

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('documents');
  const [documentCategory, setDocumentCategory] = useState<'global' | 'school-specific'>('school-specific');
  const [documentSource, setDocumentSource] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage('');
      setError('');
    }
  };

  // Fetch documents and scholarships on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Function to fetch documents and scholarships
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, title, source_file, file_type, category, source, is_active, created_at, last_updated')
        .order('last_updated', { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);

      // Fetch scholarships
      const { data: scholarshipsData, error: scholarshipsError } = await supabase
        .from('scholarships')
        .select('id, name, description, amount, deadline, organization')
        .order('created_at', { ascending: false });

      if (scholarshipsError) throw scholarshipsError;
      setScholarships(scholarshipsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload for documents
  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!fileType || fileType !== 'pdf') {
      setError('Unsupported file type. Please upload PDF files only.');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', documentCategory);
      formData.append('source', documentSource);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setMessage('Document uploaded and processed successfully');
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Refresh the documents list
      fetchData();
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file upload for scholarships
  const handleScholarshipUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (!fileType || !['csv'].includes(fileType)) {
      setError('Unsupported file type. Please upload CSV files for scholarships.');
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

      setMessage(data.message || 'Scholarships uploaded successfully');
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('scholarship-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Refresh the scholarships list
      fetchData();
    } catch (error) {
      console.error('Error uploading scholarships:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Scholarship Chatbot Admin</h1>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        <Tabs defaultValue="documents" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="documents" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="scholarships" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Scholarships
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Upload PDF Documents</h2>
                <p className="text-sm text-muted-foreground">
                  Upload PDF documents containing scholarship information that the chatbot can reference.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleDocumentUpload} className="space-y-6">
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                    <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <span className="block text-sm font-medium">
                        {file ? file.name : 'Click to upload or drag and drop'}
                      </span>
                      <span className="mt-2 block text-xs text-muted-foreground">
                        PDF files only
                      </span>
                      <Input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="category" className="text-sm font-medium">
                        Document Category
                      </label>
                      <select
                        id="category"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={documentCategory}
                        onChange={(e) => setDocumentCategory(e.target.value as 'global' | 'school-specific')}
                      >
                        <option value="school-specific">School-Specific</option>
                        <option value="global">Global (Federal/State)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="source" className="text-sm font-medium">
                        Document Source
                      </label>
                      <Input
                        id="source"
                        placeholder="e.g., Federal, State, School"
                        value={documentSource}
                        onChange={(e) => setDocumentSource(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!file || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Document...
                      </>
                    ) : (
                      'Upload Document'
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

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Uploaded Documents</h3>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="border rounded-md divide-y">
                      {documents.map((doc) => (
                        <div key={doc.id} className="p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{doc.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                              {doc.source && ` • Source: ${doc.source}`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${doc.category === 'global' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {doc.category === 'global' ? 'Global' : 'School'}
                            </span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {doc.file_type.toUpperCase()}
                            </span>
                            {!doc.is_active && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No documents uploaded yet. Upload PDF documents to get started.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scholarships">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Upload Scholarship Data</h2>
                <p className="text-sm text-muted-foreground">
                  Upload CSV files containing structured scholarship data.
                </p>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleScholarshipUpload} className="space-y-6">
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                    <label htmlFor="scholarship-upload" className="cursor-pointer block w-full h-full">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <span className="block text-sm font-medium">
                        {file ? file.name : 'Click to upload or drag and drop'}
                      </span>
                      <span className="mt-2 block text-xs text-muted-foreground">
                        CSV files only
                      </span>
                      <Input
                        id="scholarship-upload"
                        name="scholarship-upload"
                        type="file"
                        className="sr-only"
                        accept=".csv"
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
                        Processing Scholarships...
                      </>
                    ) : (
                      'Upload Scholarships'
                    )}
                  </Button>
                </form>

                {message && activeTab === 'scholarships' && (
                  <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
                    {message}
                  </div>
                )}

                {error && activeTab === 'scholarships' && (
                  <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                  </div>
                )}

                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Uploaded Scholarships</h3>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : scholarships.length > 0 ? (
                    <div className="border rounded-md divide-y">
                      {scholarships.map((scholarship) => (
                        <div key={scholarship.id} className="p-4">
                          <h4 className="font-medium">{scholarship.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {scholarship.description.substring(0, 100)}...
                          </p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {scholarship.amount}
                            </span>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                              Deadline: {scholarship.deadline}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No scholarships uploaded yet. Upload CSV files to add scholarships.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
