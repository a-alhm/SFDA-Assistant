import { z } from "zod";

// Enums
export const ComplianceStatus = z.enum([
  "Compliant",
  "NonCompliant",
  "PartiallyCompliant",
  "NotApplicable",
]);

export const VariationType = z.enum(["Major", "Minor", "Administrative"]);

export const RiskLevel = z.enum(["High", "Medium", "Low"]);

export const FindingSeverity = z.enum(["Critical", "Major", "Minor", "Info"]);

export const RecommendationPriority = z.enum(["High", "Medium", "Low"]);

// Document Metadata Schema
export const DocumentMetadataSchema = z.object({
  productName: z.string().describe("Name of the pharmaceutical product"),
  licenseNumber: z
    .string()
    .nullish()
    .describe("SFDA license/registration number"),
  submissionDate: z.string().describe("Date of submission or document date"),
  variationType: VariationType.describe(
    "Classification of variation type based on SFDA guidelines"
  ),
  variationTypeConfidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Confidence level in variation classification (0-100)"),
  detectedSections: z
    .array(z.string())
    .describe("List of document sections detected in the PDF"),
});

// Compliance Section Schema
export const ComplianceSectionSchema = z.object({
  sectionName: z.string().describe("Name of the compliance section"),
  requirement: z
    .string()
    .describe("Specific SFDA requirement being evaluated"),
  status: ComplianceStatus.describe("Compliance status of this section"),
  evidence: z
    .string()
    .describe("Evidence or quote from the submitted document"),
  findings: z
    .array(z.string())
    .describe("Detailed findings for this section"),
  recommendations: z
    .array(z.string())
    .describe("Specific recommendations to address issues"),
  severity: FindingSeverity.describe(
    "Severity level of non-compliance or issues"
  ),
  sfdaReference: z
    .string()
    .describe("Reference to specific SFDA guideline section"),
});

// Missing Document Schema
export const MissingDocumentSchema = z.object({
  documentName: z.string().describe("Name of the missing document"),
  requirement: z
    .string()
    .describe("SFDA requirement that mandates this document"),
  mandatory: z
    .boolean()
    .describe("Whether this document is mandatory or optional"),
  impact: z
    .string()
    .describe("Impact of not including this document on approval"),
  sfdaReference: z
    .string()
    .describe("Reference to SFDA guideline requiring this document"),
});

// Risk Assessment Schema
export const RiskItemSchema = z.object({
  category: z.string().describe("Category of risk (e.g., Regulatory, Quality)"),
  level: RiskLevel.describe("Risk level"),
  description: z.string().describe("Detailed description of the risk"),
  mitigation: z.string().describe("Recommended mitigation strategy"),
  sfdaReference: z
    .string()
    .describe("Related SFDA guideline reference"),
});

export const RiskAssessmentSchema = z.object({
  overallRisk: RiskLevel.describe("Overall risk level of the submission"),
  risks: z.array(RiskItemSchema).describe("List of identified risks"),
  approvalProbability: z
    .number()
    .min(0)
    .max(100)
    .describe("Estimated probability of approval (0-100)"),
  keyRiskFactors: z
    .array(z.string())
    .describe("Key factors contributing to risk"),
});

// Recommendation Schema
export const RecommendationSchema = z.object({
  priority: RecommendationPriority.describe("Priority level of recommendation"),
  action: z.string().describe("Recommended action to take"),
  rationale: z.string().describe("Rationale behind the recommendation"),
  sfdaReference: z
    .string()
    .describe("Supporting SFDA guideline reference"),
  estimatedImpact: z
    .string()
    .describe("Expected impact of implementing this recommendation"),
});

// Summary Schema
export const EvaluationSummarySchema = z.object({
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall compliance score (0-100)"),
  executiveSummary: z
    .string()
    .describe("High-level executive summary of the evaluation"),
  keyFindings: z
    .array(z.string())
    .describe("Most important findings from the evaluation"),
  criticalIssues: z
    .array(z.string())
    .describe("Critical issues that must be addressed"),
  nextSteps: z
    .array(z.string())
    .describe("Recommended next steps for the applicant"),
});

// Complete Evaluation Result Schema
export const EvaluationResultSchema = z.object({
  metadata: DocumentMetadataSchema.describe("Document metadata and classification"),
  sections: z
    .array(ComplianceSectionSchema)
    .describe("Detailed compliance evaluation by section"),
  missingDocuments: z
    .array(MissingDocumentSchema)
    .describe("List of missing or incomplete documents"),
  riskAssessment: RiskAssessmentSchema.describe(
    "Comprehensive risk assessment"
  ),
  recommendations: z
    .array(RecommendationSchema)
    .describe("Prioritized recommendations"),
  summary: EvaluationSummarySchema.describe("Overall evaluation summary"),
  evaluationDate: z
    .string()
    .describe("Date when evaluation was performed"),
  sfdaGuidelineVersion: z
    .string()
    .describe("Version of SFDA guidelines used for evaluation"),
});

// Export TypeScript types
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type ComplianceSection = z.infer<typeof ComplianceSectionSchema>;
export type MissingDocument = z.infer<typeof MissingDocumentSchema>;
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;
export type RiskItem = z.infer<typeof RiskItemSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type EvaluationSummary = z.infer<typeof EvaluationSummarySchema>;
