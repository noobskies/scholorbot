import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/documents/[id] - Get a document by ID
export async function GET(request: NextRequest) {
  try {
    // Extract the ID from the URL
    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get the document
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching document:", error);
      return NextResponse.json(
        { error: error.message || "Failed to fetch document" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete a document by ID
export async function DELETE(request: NextRequest) {
  try {
    // Extract the ID from the URL
    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Delete the document
    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) {
      console.error("Error deleting document:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete document" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
