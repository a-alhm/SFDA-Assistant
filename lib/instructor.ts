import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";

// Get the model name from environment
const chatModel = process.env.CHAT_MODEL || "gemini-2.5-flash";

/**
 * Generate structured output from Gemini using a Zod schema
 * Uses Vercel AI SDK with official Google provider for reliable structured outputs
 *
 * Supports multilingual content (Arabic, English) in JSON values while maintaining
 * valid JSON structure with English field names.
 */
export async function generateStructuredOutput<T>(
  schema: any,
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  try {
    const result = await generateObject({
      model: google(chatModel),
      schema,
      prompt,
      system: systemPrompt,
      mode: "json", // Use JSON mode for structured generation
    });

    return result.object as T;
  } catch (error) {
    console.error("Error generating structured output:", error);
    throw new Error(
      `Failed to generate structured output: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Generate content with Gemini (non-structured)
 * For cases where you need plain text responses instead of structured JSON
 */
export async function generateContent(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  try {
    const result = await generateText({
      model: google(chatModel),
      prompt,
      system: systemPrompt,
    });

    return result.text;
  } catch (error) {
    console.error("Error generating content:", error);
    throw new Error(
      `Failed to generate content: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
