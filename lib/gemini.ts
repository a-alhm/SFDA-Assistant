import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY || "";

const genAI = new GoogleGenerativeAI(apiKey);

// Generate embeddings using Google's text-embedding model
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const embeddingModel = process.env.EMBEDDING_MODEL || "text-embedding-004";
    const model = genAI.getGenerativeModel({ model: embeddingModel });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Generate chat response using Gemini
export async function generateChatResponse(
  query: string,
  context: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<string> {
  try {
    const chatModel = process.env.CHAT_MODEL || "gemini-pro";
    const model = genAI.getGenerativeModel({ model: chatModel });

    const systemPrompt = `You are an expert assistant on Saudi Food & Drug Authority (SFDA) regulations, specifically the Guidelines for Variation Requirements Version 6.3.

Your role is to help pharmaceutical companies understand and comply with SFDA variation requirements. Use the provided context from official SFDA documentation to answer questions accurately.

Guidelines:
- Always base your answers on the provided context
- If the context doesn't contain enough information, say so clearly
- Cite specific sections, variation types, or requirements when relevant
- Be precise about regulatory requirements and conditions
- Use clear, professional language suitable for regulatory professionals

Context from SFDA Guidelines:
${context}

Answer the user's question based on the above context.`;

    const chat = model.startChat({
      history: conversationHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(
      systemPrompt + "\n\nUser question: " + query
    );
    return result.response.text();
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error;
  }
}
