import type { EvaluationResult } from "./evaluation-schema";
import { parseDocument } from "./agents/document-parser";
import { classifyVariation } from "./agents/variation-classifier";
import { checkRegulatoryRequirements } from "./agents/regulatory-requirements";
import { validateDocumentation } from "./agents/documentation-validator";
import { assessRisks } from "./agents/risk-assessor";
import { synthesizeReport } from "./agents/report-synthesizer";
import { getAllDocumentChunks } from "./supabase";

/**
 * Agent Orchestrator
 * Coordinates the execution of all evaluation agents in sequence
 */
export async function orchestrateEvaluation(
  pdfText: string,
  locale: string = "en"
): Promise<EvaluationResult> {
  console.log("Starting evaluation orchestration...");

  try {
    // Step 0: Load full SFDA guidelines from vector database
    console.log("Loading SFDA guidelines from database...");
    const guidelineChunks = await getAllDocumentChunks();
    const sfdaGuidelines = guidelineChunks
      .map((chunk) => chunk.content)
      .join("\n\n");
    console.log(
      `Loaded ${guidelineChunks.length} chunks (${sfdaGuidelines.length} characters)`
    );

    // Agent 1: Parse Document
    console.log("Agent 1: Parsing document structure...");
    const documentMetadata = await parseDocument(pdfText);
    console.log(
      `Parsed document: ${documentMetadata.productName} (${documentMetadata.detectedSections.length} sections)`
    );

    // Agent 2: Classify Variation
    console.log("Agent 2: Classifying variation type...");
    const variationClassification = await classifyVariation(
      pdfText,
      documentMetadata,
      sfdaGuidelines
    );
    console.log(
      `Classification: ${variationClassification.variationType} (${variationClassification.confidence}% confidence)`
    );

    // Agent 3: Check Regulatory Requirements
    console.log("Agent 3: Checking regulatory compliance...");
    const regulatoryCompliance = await checkRegulatoryRequirements(
      pdfText,
      variationClassification,
      sfdaGuidelines
    );
    console.log(
      `Compliance: ${regulatoryCompliance.overallCompliance} (${regulatoryCompliance.compliancePercentage}%)`
    );

    // Agent 4: Validate Documentation
    console.log("Agent 4: Validating documentation...");
    const documentationValidation = await validateDocumentation(
      pdfText,
      variationClassification,
      sfdaGuidelines
    );
    console.log(
      `Documentation completeness: ${documentationValidation.documentationCompleteness}% (${documentationValidation.missingDocuments.length} missing)`
    );

    // Agent 5: Assess Risks
    console.log("Agent 5: Assessing risks...");
    const riskAssessment = await assessRisks(
      variationClassification,
      regulatoryCompliance,
      documentationValidation,
      sfdaGuidelines
    );
    console.log(
      `Overall risk: ${riskAssessment.overallRisk} (approval probability: ${riskAssessment.approvalProbability}%)`
    );

    // Agent 6: Synthesize Report
    console.log("Agent 6: Synthesizing final report...");
    const { recommendations, summary } = await synthesizeReport(
      documentMetadata,
      variationClassification,
      regulatoryCompliance,
      documentationValidation,
      riskAssessment,
      locale
    );
    console.log(
      `Generated ${recommendations.length} recommendations and executive summary`
    );

    // Assemble final evaluation result
    const evaluationResult: EvaluationResult = {
      metadata: {
        productName: documentMetadata.productName,
        licenseNumber: documentMetadata.licenseNumber,
        submissionDate: documentMetadata.submissionDate,
        variationType: variationClassification.variationType,
        variationTypeConfidence: variationClassification.confidence,
        detectedSections: documentMetadata.detectedSections,
      },
      sections: regulatoryCompliance.sections,
      missingDocuments: documentationValidation.missingDocuments,
      riskAssessment,
      recommendations,
      summary,
      evaluationDate: new Date().toISOString(),
      sfdaGuidelineVersion: "v6.3",
    };

    console.log("Evaluation orchestration completed successfully!");
    return evaluationResult;
  } catch (error) {
    console.error("Error during evaluation orchestration:", error);
    throw new Error(
      `Evaluation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
