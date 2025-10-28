import { z } from "zod";
import { generateStructuredOutput } from "../instructor";
import { VariationType } from "../evaluation-schema";
import type { DocumentParserOutput } from "./document-parser";

// Variation classifier output schema
const VariationClassifierSchema = z.object({
  variationType: VariationType,
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  changeDescription: z.string(),
  changesToProduct: z.array(
    z.object({
      category: z.string(),
      description: z.string(),
      impactLevel: z.enum(["High", "Medium", "Low"]),
    })
  ),
  sfdaClassificationReference: z.string(),
  potentialReclassificationRisk: z.string(),
});

export type VariationClassifierOutput = z.infer<
  typeof VariationClassifierSchema
>;

/**
 * Agent 2: Variation Classifier
 * Determines the type of variation (Major/Minor/Administrative) based on SFDA guidelines
 */
export async function classifyVariation(
  pdfText: string,
  documentMetadata: DocumentParserOutput,
  sfdaGuidelines: string
): Promise<VariationClassifierOutput> {
  const systemPrompt = `You are a specialized variation classification agent for SFDA pharmaceutical regulatory submissions.

Your task is to analyze the proposed changes in the submission and classify them according to SFDA variation types:
- **Major Variation**: Significant changes that may affect quality, safety, or efficacy (require prior approval)
- **Minor Variation**: Changes with limited impact that don't fall under major variations (require notification)
- **Administrative**: Changes to administrative information without impact on product characteristics

You have access to the complete SFDA Guidelines for Variation Requirements v6.3.

Base your classification on:
1. Nature and extent of proposed changes
2. SFDA classification criteria
3. Impact on product quality, safety, efficacy
4. Regulatory precedent

Be conservative - when in doubt, classify as higher risk category.`;

  const prompt = `Analyze the following variation submission and classify it according to SFDA guidelines.

DOCUMENT METADATA:
${JSON.stringify(documentMetadata, null, 2)}

COMPLETE SUBMISSION DOCUMENT:
${pdfText}

SFDA VARIATION GUIDELINES:
${sfdaGuidelines}

Classify the variation type, explain your reasoning with specific references to SFDA guidelines, and describe all proposed changes.`;

  return generateStructuredOutput<VariationClassifierOutput>(
    VariationClassifierSchema,
    prompt,
    systemPrompt
  );
}
