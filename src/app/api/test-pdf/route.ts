import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { processPdf } from "@/lib/pdf";

export async function GET() {
  try {
    // Path to the test PDF file
    const PDF_PATH = path.join(
      process.cwd(),
      "src/lib/data/20242025FAFSAPellEligibilityandSAIGuide.pdf"
    );

    // Read the PDF file
    const pdfBuffer = await fs.readFile(PDF_PATH);

    // Process the PDF
    const result = await processPdf(pdfBuffer);

    // Return the results
    return NextResponse.json({
      success: true,
      textLength: result.content.length,
      pageCount: result.metadata.pageCount,
      sample: result.content.substring(0, 500) + "...",
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
