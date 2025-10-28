import { z } from "zod";
import { generateStructuredOutput } from "../instructor";
import { RiskAssessmentSchema } from "../evaluation-schema";
import type { VariationClassifierOutput } from "./variation-classifier";
import type { RegulatoryRequirementsOutput } from "./regulatory-requirements";
import type { DocumentationValidatorOutput } from "./documentation-validator";

/**
 * Agent 5: Risk Assessor
 * Evaluates overall risks and estimates approval probability
 */
export async function assessRisks(
  variationClassification: VariationClassifierOutput,
  regulatoryCompliance: RegulatoryRequirementsOutput,
  documentationValidation: DocumentationValidatorOutput,
  sfdaGuidelines: string
): Promise<z.infer<typeof RiskAssessmentSchema>> {
  const systemPrompt = `You are a specialized risk assessment agent for SFDA pharmaceutical submissions.

Your task is to:
1. Analyze all findings from previous compliance checks
2. Identify and categorize risks (Regulatory, Documentation, Quality, Timeline, etc.)
3. Assess the severity of each risk
4. Provide mitigation strategies
5. Estimate overall approval probability

Consider:
- Variation type and classification certainty
- Compliance gaps and their severity
- Missing or inadequate documentation
- Historical SFDA approval patterns
- Quality of submission

Be realistic and evidence-based in your risk assessment.`;

  const prompt = `Conduct a comprehensive risk assessment for this SFDA submission.

VARIATION CLASSIFICATION:
${JSON.stringify(variationClassification, null, 2)}

REGULATORY COMPLIANCE FINDINGS:
${JSON.stringify(regulatoryCompliance, null, 2)}

DOCUMENTATION VALIDATION:
${JSON.stringify(documentationValidation, null, 2)}

SFDA GUIDELINES:
${sfdaGuidelines}

Perform a thorough risk analysis:

1. **Regulatory Risks**: Issues related to non-compliance with SFDA requirements
2. **Documentation Risks**: Missing or inadequate documentation
3. **Quality Risks**: Concerns about product quality or manufacturing changes
4. **Classification Risks**: Uncertainty in variation classification
5. **Timeline Risks**: Factors that could delay approval

For each identified risk:
- Categorize it
- Assess severity (High/Medium/Low)
- Explain the potential impact
- Provide specific mitigation strategies with SFDA references

Finally:
- Determine overall risk level
- Estimate approval probability (0-100%)
- List key risk factors
- Provide confidence level in your assessment

Be thorough, evidence-based, and reference specific findings from the compliance checks.`;

  return generateStructuredOutput<z.infer<typeof RiskAssessmentSchema>>(
    RiskAssessmentSchema,
    prompt,
    systemPrompt
  );
}
