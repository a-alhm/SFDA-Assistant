import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding, generateChatResponse } from "@/lib/gemini";
import { searchDocuments } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from user" },
        { status: 400 }
      );
    }

    const userQuery = lastMessage.content;

    // Step 1: Generate embedding for the user query
    const queryEmbedding = await generateEmbedding(userQuery);

    // Step 2: Search for relevant document chunks using vector similarity
    const relevantChunks = await searchDocuments(queryEmbedding, 5, 0.7);

    // Step 3: Prepare context from retrieved chunks
    const context = relevantChunks
      .map((chunk: any, index: number) => {
        return `[Source ${index + 1}] Section: ${chunk.metadata.section || "N/A"}
Page: ${chunk.metadata.page || "N/A"}
Content: ${chunk.content}
---`;
      })
      .join("\n\n");

    // Step 4: Prepare conversation history (exclude the last message as it's the current query)
    const conversationHistory = messages
      .slice(0, -1)
      .map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

    // Step 5: Generate response using Gemini with retrieved context
    const response = await generateChatResponse(
      userQuery,
      context,
      conversationHistory
    );

    // Step 6: Extract source information for citation
    const sources = relevantChunks.map((chunk: any) => {
      const section = chunk.metadata.section || "Unknown Section";
      const page = chunk.metadata.page || "N/A";
      return `${section} (Page ${page})`;
    });

    return NextResponse.json({
      message: response,
      sources: sources.slice(0, 3), // Return top 3 sources
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "An error occurred while processing your request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
