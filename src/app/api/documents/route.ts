import { NextRequest, NextResponse } from "next/server";
import { processPdf, storeDocument } from "@/lib/pdf";
import { processAndEnhancePdf } from "@/lib/ai/pdf-processor";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = (formData.get("category") as string) || "school-specific";
    const source = (formData.get("source") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    const fileType = file.name.split(".").pop()?.toLowerCase();

    if (!fileType || fileType !== "pdf") {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF files." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;

    // Try to use AI-enhanced processing with fallback to regular processing
    try {
      console.log("Starting AI-enhanced PDF processing...");

      // Process the PDF with AI enhancements
      const result = await processAndEnhancePdf(
        buffer,
        fileName,
        category as "global" | "school-specific"
      );

      console.log("AI-enhanced processing complete:", {
        documentId: result.documentId,
        title: result.title,
        chunkCount: result.chunkCount,
        hasSummary: !!result.summary,
        source,
      });

      // Return success response with enhanced data
      return NextResponse.json({
        message:
          "Document processed and stored successfully with AI enhancements",
        documentId: result.documentId,
        title: result.title,
        summary: result.summary
          ? result.summary.substring(0, 100) + "..."
          : null,
        chunkCount: result.chunkCount,
        enhanced: true,
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

      // Store document in database with retry logic
      let documentId;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          documentId = await storeDocument({
            title,
            content,
            source_file: fileName,
            file_type: "pdf",
            category: category as "global" | "school-specific",
            source,
            is_active: true,
            metadata,
          });
          break; // Success, exit the loop
        } catch (error) {
          retryCount++;
          console.error(
            `Document storage attempt ${retryCount} failed:`,
            error
          );

          if (retryCount >= maxRetries) {
            throw new Error(
              `Failed to store document after ${maxRetries} attempts: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }

          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retryCount))
          );
        }
      }

      return NextResponse.json({
        message:
          "Document processed and stored successfully (standard processing)",
        documentId,
        enhanced: false,
      });
    }
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
