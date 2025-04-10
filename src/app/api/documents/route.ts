import { NextRequest, NextResponse } from "next/server";
import { processPdf, storeDocument } from "@/lib/pdf";

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

    // Process PDF
    const { content, metadata } = await processPdf(buffer);

    // Generate a title from the filename
    const fileName = file.name;
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
        console.error(`Document storage attempt ${retryCount} failed:`, error);

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
      message: "Document processed and stored successfully",
      documentId,
    });
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
