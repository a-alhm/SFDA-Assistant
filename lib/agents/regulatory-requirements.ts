import { z } from "zod";
import { generateStructuredOutput } from "../instructor";
import { ComplianceSectionSchema } from "../evaluation-schema";
import type { VariationClassifierOutput } from "./variation-classifier";

// Regulatory requirements output schema
const RegulatoryRequirementsSchema = z.object({
  sections: z.array(ComplianceSectionSchema),
  overallCompliance: z.enum(["Compliant", "NonCompliant", "PartiallyCompliant"]),
  compliancePercentage: z.number().min(0).max(100),
  criticalNonCompliances: z.array(z.string()),
  requirementsChecklist: z.array(
    z.object({
      requirement: z.string(),
      met: z.boolean(),
      evidence: z.string(),
      sfdaReference: z.string(),
    })
  ),
});

export type RegulatoryRequirementsOutput = z.infer<
  typeof RegulatoryRequirementsSchema
>;

/**
 * Agent 3: Regulatory Requirements
 * Checks compliance against SFDA requirements for the identified variation type
 */
export async function checkRegulatoryRequirements(
  pdfText: string,
  variationClassification: VariationClassifierOutput,
  sfdaGuidelines: string
): Promise<RegulatoryRequirementsOutput> {
  const systemPrompt = `You are a specialized regulatory compliance verification agent for SFDA pharmaceutical submissions.

Your task is to systematically verify compliance against ALL applicable SFDA requirements for ${variationClassification.variationType} variations.

For each requirement:
1. Identify the specific SFDA requirement
2. Check if the submission meets this requirement
3. Extract evidence from the submission document
4. Assess compliance status (Compliant/NonCompliant/PartiallyCompliant/NotApplicable)
5. Note severity of any non-compliance
6. Provide specific recommendations

Be thorough and systematic. Check EVERY requirement listed in the SFDA guidelines for this variation type.`;

  const prompt = `Perform a comprehensive regulatory compliance check for this submission.

VARIATION CLASSIFICATION:
${JSON.stringify(variationClassification, null, 2)}

SUBMISSION DOCUMENT:
${pdfText}

COMPLETE SFDA GUIDELINES:
${sfdaGuidelines}

Systematically verify compliance with ALL applicable SFDA requirements for ${variationClassification.variationType} variations.

For each requirement:
- Check if it's addressed in the submission
- Extract relevant evidence or note what's missing
- Assess compliance status
- Determine severity of any issues
- Provide specific, actionable recommendations
- Reference the exact SFDA guideline section

Organize findings by logical sections (e.g., Manufacturing Changes, Quality Control, Labeling, etc.).`;

  return generateStructuredOutput<RegulatoryRequirementsOutput>(
    RegulatoryRequirementsSchema,
    prompt,
    systemPrompt
  );
}
