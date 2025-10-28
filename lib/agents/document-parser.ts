import { z } from "zod";
import { generateStructuredOutput } from "../instructor";

// Document parsing output schema
const DocumentParserSchema = z.object({
  productName: z.string(),
  licenseNumber: z.string().nullish(),
  submissionDate: z.string(),
  detectedSections: z.array(z.string()),
  documentStructure: z.object({
    hasTableOfContents: z.boolean(),
    totalPages: z.number(),
    mainSections: z.array(
      z.object({
        title: z.string(),
        content: z.string(),
        pageNumber: z.number().nullish(),
      })
    ),
  }),
  documentType: z.string(),
  language: z.enum(["English", "Arabic", "Both"]),
});

export type DocumentParserOutput = z.infer<typeof DocumentParserSchema>;

/**
 * Agent 1: Document Parser
 * Analyzes the uploaded PDF and extracts structure, metadata, and key sections
 */
export async function parseDocument(
  pdfText: string
): Promise<DocumentParserOutput> {
  const systemPrompt = `You are a specialized document parsing agent for pharmaceutical regulatory submissions to the Saudi Food & Drug Authority (SFDA).

Your task is to analyze the submitted document and extract:
1. Product information (name, license number if available)
2. Document structure (sections, table of contents)
3. Document metadata (date, type, language)
4. Key sections relevant to variation submissions

Be thorough and accurate in your analysis.`;

  const prompt = `Analyze the following pharmaceutical document submitted for SFDA variation review:

DOCUMENT TEXT:
${pdfText}

Extract and structure the document information according to the schema. Identify all major sections, product details, and document structure.`;

  return generateStructuredOutput<DocumentParserOutput>(
    DocumentParserSchema,
    prompt,
    systemPrompt
  );
}
