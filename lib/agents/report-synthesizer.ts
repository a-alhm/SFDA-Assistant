import { z } from "zod";
import { generateStructuredOutput } from "../instructor";
import {
  EvaluationResultSchema,
  RecommendationSchema,
  EvaluationSummarySchema,
} from "../evaluation-schema";
import type { DocumentParserOutput } from "./document-parser";
import type { VariationClassifierOutput } from "./variation-classifier";
import type { RegulatoryRequirementsOutput } from "./regulatory-requirements";
import type { DocumentationValidatorOutput } from "./documentation-validator";
import type { RiskAssessment } from "../evaluation-schema";

// Synthesizer output schema - includes recommendations and summary
const ReportSynthesizerSchema = z.object({
  recommendations: z.array(RecommendationSchema),
  summary: EvaluationSummarySchema,
});

export type ReportSynthesizerOutput = z.infer<typeof ReportSynthesizerSchema>;

/**
 * Agent 6: Report Synthesizer
 * Aggregates all agent outputs and generates final recommendations and summary
 */
export async function synthesizeReport(
  documentMetadata: DocumentParserOutput,
  variationClassification: VariationClassifierOutput,
  regulatoryCompliance: RegulatoryRequirementsOutput,
  documentationValidation: DocumentationValidatorOutput,
  riskAssessment: RiskAssessment,
  locale: string = "en"
): Promise<ReportSynthesizerOutput> {
  const languageInstruction =
    locale === "ar"
      ? "Generate all text in Arabic language."
      : "Generate all text in English language.";

  const systemPrompt = `You are a specialized report synthesis agent for SFDA pharmaceutical submissions.

${languageInstruction}

Your task is to:
1. Synthesize findings from all previous agents
2. Generate prioritized, actionable recommendations
3. Create a comprehensive executive summary
4. Highlight key findings and critical issues
5. Provide clear next steps for the applicant

Your output should be:
- Clear and actionable
- Properly prioritized (Critical → High → Medium → Low)
- Specific with SFDA references
- Realistic about timeline and effort
- Professional and constructive in tone`;

  const prompt = `Synthesize a comprehensive evaluation report from all agent findings.

${languageInstruction}

DOCUMENT METADATA:
${JSON.stringify(documentMetadata, null, 2)}

VARIATION CLASSIFICATION:
${JSON.stringify(variationClassification, null, 2)}

REGULATORY COMPLIANCE:
${JSON.stringify(regulatoryCompliance, null, 2)}

DOCUMENTATION VALIDATION:
${JSON.stringify(documentationValidation, null, 2)}

RISK ASSESSMENT:
${JSON.stringify(riskAssessment, null, 2)}

Generate:

1. **Prioritized Recommendations**:
   - Address all critical issues first
   - Provide specific, actionable steps
   - Include rationale and SFDA references
   - Estimate impact of each recommendation

2. **Executive Summary**:
   - Calculate overall compliance score (0-100)
   - Write a concise executive summary (2-3 paragraphs)
   - List 3-5 key findings
   - Identify critical issues that must be addressed
   - Provide clear next steps in priority order

Ensure recommendations are:
- Specific and actionable
- Properly prioritized
- Referenced to SFDA guidelines
- Realistic about implementation

The summary should be suitable for senior management review.`;

  return generateStructuredOutput<ReportSynthesizerOutput>(
    ReportSynthesizerSchema,
    prompt,
    systemPrompt
  );
}
