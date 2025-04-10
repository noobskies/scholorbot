'use client';

import React, { useState } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

// Register FilePond plugins
registerPlugin(FilePondPluginFileValidateType);

export default function FileUpload() {
  const [files, setFiles] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Upload PDF Document</h2>
      
      {uploadStatus && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
          {uploadStatus}
        </div>
      )}
      
      <FilePond
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={false}
        maxFiles={1}
        server={{
          process: {
            url: '/api/upload',
            onload: (response: string) => {
              try {
                const data = JSON.parse(response);
                if (data.success) {
                  setUploadStatus(`Document "${data.title}" uploaded successfully!`);
                  setTimeout(() => setUploadStatus(null), 5000);
                }
                return data.documentId;
              } catch (e) {
                return response;
              }
            },
            onerror: (error: string) => {
              setUploadStatus(`Upload failed: ${error}`);
              setTimeout(() => setUploadStatus(null), 5000);
            },
          },
          revert: null,
          restore: null,
          load: null,
          fetch: null,
        }}
        name="filepond"
        labelIdle='Drag & Drop your PDF files or <span class="filepond--label-action">Browse</span>'
        acceptedFileTypes={['application/pdf']}
        fileValidateTypeLabelExpectedTypes="Please upload a PDF file"
        className="w-full"
      />
    </div>
  );
}
