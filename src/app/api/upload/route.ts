import { NextRequest, NextResponse } from "next/server";
import { processPdf } from "@/lib/pdf";
import { processAndEnhancePdf } from "@/lib/ai/pdf-processor";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const uploadedFiles = formData.getAll("filepond");

    // Check if we have files
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No files uploaded",
        },
        { status: 400 }
      );
    }

    // Get the file (FilePond sends metadata as first item and file as second)
    const uploadedFile =
      uploadedFiles.length > 1 ? uploadedFiles[1] : uploadedFiles[0];

    // Check if it's a file
    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "Uploaded item is not a file",
        },
        { status: 400 }
      );
    }

    // Check if it's a PDF
    if (!uploadedFile.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        {
          success: false,
          error: "Uploaded file is not a PDF",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await uploadedFile.arrayBuffer());
    const fileName = uploadedFile.name;

    // Try to use AI-enhanced processing with fallback to regular processing
    try {
      console.log("Starting AI-enhanced PDF processing...");

      // Process the PDF with AI enhancements
      const result = await processAndEnhancePdf(
        buffer,
        fileName,
        "global" // Use global category for uploaded files
      );

      console.log("AI-enhanced processing complete:", {
        documentId: result.documentId,
        title: result.title,
        chunkCount: result.chunkCount,
        hasSummary: !!result.summary,
      });

      // Return success response with enhanced data
      return NextResponse.json({
        success: true,
        documentId: result.documentId,
        title: result.title,
        summary: result.summary.substring(0, 100) + "...", // Send a preview of the summary
        chunkCount: result.chunkCount,
        enhanced: true,
        fileName,
      });
    } catch (aiError) {
      console.warn(
        "AI-enhanced processing failed, falling back to standard processing:",
        aiError
      );

      // Fall back to regular processing
      const { content, metadata } = await processPdf(buffer);

      // Generate a title from the filename
      const title = fileName
        .replace(/\.[^/.]+$/, "") // Remove file extension
        .replace(/[-_]/g, " ") // Replace hyphens and underscores with spaces
        .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space between camelCase
        .trim();

      // Import storeDocument dynamically to avoid circular dependencies
      const { storeDocument } = await import("@/lib/pdf");

      // Store the document in the database
      const documentId = await storeDocument({
        title,
        content,
        source_file: fileName,
        file_type: "pdf",
        category: "global",
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
        enhanced: false,
      });
    }
  } catch (error) {
    console.error("Error processing uploaded PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
