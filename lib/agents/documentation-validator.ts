import { z } from "zod";
import { generateStructuredOutput } from "../instructor";
import { MissingDocumentSchema } from "../evaluation-schema";
import type { VariationClassifierOutput } from "./variation-classifier";

// Documentation validator output schema
const DocumentationValidatorSchema = z.object({
  missingDocuments: z.array(MissingDocumentSchema),
  presentDocuments: z.array(
    z.object({
      documentName: z.string(),
      status: z.enum(["Complete", "Incomplete", "Unclear"]),
      quality: z.enum(["Excellent", "Good", "Acceptable", "Poor"]),
      issues: z.array(z.string()),
      location: z.string(),
    })
  ),
  documentationCompleteness: z.number().min(0).max(100),
  criticalMissingDocuments: z.array(z.string()),
  recommendedAdditionalDocuments: z.array(
    z.object({
      documentName: z.string(),
      rationale: z.string(),
      sfdaReference: z.string(),
    })
  ),
});

export type DocumentationValidatorOutput = z.infer<
  typeof DocumentationValidatorSchema
>;

/**
 * Agent 4: Documentation Validator
 * Validates completeness and quality of all required documentation
 */
export async function validateDocumentation(
  pdfText: string,
  variationClassification: VariationClassifierOutput,
  sfdaGuidelines: string
): Promise<DocumentationValidatorOutput> {
  const systemPrompt = `You are a specialized documentation validation agent for SFDA pharmaceutical submissions.

Your task is to:
1. Identify ALL documents required for ${variationClassification.variationType} variations according to SFDA guidelines
2. Check which documents are present in the submission
3. Assess quality and completeness of present documents
4. Identify missing mandatory and optional documents
5. Evaluate the impact of any missing documentation
6. Recommend additional supporting documents

Be meticulous - missing critical documents can lead to rejection.`;

  const prompt = `Validate the documentation for this SFDA variation submission.

VARIATION TYPE: ${variationClassification.variationType}
CHANGE DESCRIPTION: ${variationClassification.changeDescription}

SUBMISSION DOCUMENT:
${pdfText}

SFDA GUIDELINES (with required documentation lists):
${sfdaGuidelines}

Tasks:
1. List ALL documents required for this variation type per SFDA guidelines
2. Check which required documents are present/referenced in the submission
3. Assess quality of present documents (completeness, clarity, format)
4. Identify all missing documents (both mandatory and optional)
5. For each missing document:
   - Indicate if it's mandatory or optional
   - Explain the impact on approval probability
   - Provide the SFDA guideline reference
6. Recommend any additional supporting documents that would strengthen the submission

Be comprehensive and reference specific SFDA guideline sections.`;

  return generateStructuredOutput<DocumentationValidatorOutput>(
    DocumentationValidatorSchema,
    prompt,
    systemPrompt
  );
}
