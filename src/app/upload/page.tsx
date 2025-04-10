'use client';

import React from 'react';
import FileUpload from '@/components/FileUpload';

export default function UploadPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">PDF Upload and Processing</h1>
      <p className="mb-6">
        Upload a PDF document to extract and process its content. The processed text will be stored in the database
        and can be used for searching and retrieval.
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <FileUpload />
      </div>
    </div>
  );
}
