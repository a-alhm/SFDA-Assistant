import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { orchestrateEvaluation } from "@/lib/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for complex evaluations

/**
 * POST /api/evaluate
 * Accepts PDF upload and performs comprehensive SFDA compliance evaluation
 */
export async function POST(request: NextRequest) {
  try {
    // Get the form data (PDF file and optional locale)
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const locale = (formData.get("locale") as string) || "en";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are accepted." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    console.log(
      `Processing evaluation request: ${file.name} (${file.size} bytes, locale: ${locale})`
    );

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    console.log("Extracting text from PDF...");
    let pdfText: string;
    let parser: PDFParse | null = null;

    try {
      parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      pdfText = result.text;
      console.log(`Extracted ${pdfText.length} characters from PDF`);
    } catch (error) {
      console.error("PDF parsing error:", error);
      return NextResponse.json(
        {
          error: "Failed to parse PDF. Please ensure the file is a valid PDF document.",
        },
        { status: 400 }
      );
    } finally {
      // Clean up parser to free memory
      if (parser) {
        await parser.destroy();
      }
    }

    // Validate that we got meaningful text
    if (!pdfText || pdfText.trim().length < 100) {
      return NextResponse.json(
        {
          error:
            "Could not extract sufficient text from PDF. The document may be scanned or image-based.",
        },
        { status: 400 }
      );
    }

    // Create SSE stream for real-time progress updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send progress events
    const sendProgress = (stage: string, percent: number) => {
      const data = JSON.stringify({ stage, percent });
      writer.write(encoder.encode(`data: ${data}\n\n`));
    };

    // Run evaluation in background and stream progress
    (async () => {
      try {
        // Send initial extraction progress
        sendProgress("uploading", 10);
        sendProgress("extracting", 20);

        // Run the evaluation orchestration with progress callback
        console.log("Starting evaluation orchestration...");
        const evaluationResult = await orchestrateEvaluation(
          pdfText,
          locale,
          sendProgress
        );

        console.log("Evaluation completed successfully");

        // Send final result
        sendProgress("complete", 100);
        const finalData = JSON.stringify({
          done: true,
          evaluation: evaluationResult,
        });
        writer.write(encoder.encode(`data: ${finalData}\n\n`));
      } catch (error) {
        console.error("Error in evaluation endpoint:", error);

        // Send error event
        const errorMessage =
          error instanceof Error ? error.message : "An unexpected error occurred";
        const errorData = JSON.stringify({
          error: true,
          message: errorMessage,
        });
        writer.write(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        writer.close();
      }
    })();

    // Return SSE response
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in evaluation endpoint:", error);

    // Return appropriate error response
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      {
        error: "Evaluation failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
