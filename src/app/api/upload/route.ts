import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { processPdf, storeDocument } from '@/lib/pdf';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const uploadedFiles = formData.getAll('filepond');
    
    // Check if we have files
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No files uploaded',
      }, { status: 400 });
    }
    
    // Get the file (FilePond sends metadata as first item and file as second)
    const uploadedFile = uploadedFiles.length > 1 ? uploadedFiles[1] : uploadedFiles[0];
    
    // Check if it's a file
    if (!(uploadedFile instanceof File)) {
      return NextResponse.json({
        success: false,
        error: 'Uploaded item is not a file',
      }, { status: 400 });
    }
    
    // Check if it's a PDF
    if (!uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({
        success: false,
        error: 'Uploaded file is not a PDF',
      }, { status: 400 });
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    
    // Process the PDF
    const { content, metadata } = await processPdf(buffer);
    
    // Generate a title from the filename
    const fileName = uploadedFile.name;
    const title = fileName
      .replace(/\.[^/.]+$/, '') // Remove file extension
      .replace(/[-_]/g, ' ')    // Replace hyphens and underscores with spaces
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
      .trim();
    
    // Store the document in the database
    const documentId = await storeDocument({
      title,
      content,
      source_file: fileName,
      file_type: 'pdf',
      category: 'global',
      is_active: true,
      metadata,
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      documentId,
      title,
      contentLength: content.length,
      fileName,
    });
  } catch (error) {
    console.error('Error processing uploaded PDF:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
