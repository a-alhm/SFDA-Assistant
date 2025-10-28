"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { EvaluationResult } from "@/lib/evaluation-schema";

export default function EvaluatePage() {
  const t = useTranslations("evaluate");
  const locale = useLocale();
  const [file, setFile] = useState<File | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progressStage, setProgressStage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      setError(t("errors.invalidFileType"));
      return;
    }

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(t("errors.fileTooLarge"));
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleEvaluate = async () => {
    if (!file) {
      setError(t("errors.noFile"));
      return;
    }

    setIsEvaluating(true);
    setError(null);
    setEvaluationResult(null);
    setProgressStage("");
    setProgressPercent(0);

    try {
      // STEP 1: Upload file and get jobId
      const formData = new FormData();
      formData.append("file", file);
      formData.append("locale", locale);

      const uploadResponse = await fetch("/api/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || t("errors.evaluationFailed"));
      }

      const { jobId } = await uploadResponse.json();
      console.log(`Job created: ${jobId}`);

      // STEP 2: Connect to SSE stream for progress updates
      const eventSource = new EventSource(`/api/evaluate/stream?jobId=${jobId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            throw new Error(data.message);
          }

          if (data.done) {
            setEvaluationResult(data.evaluation);
            setIsEvaluating(false);
            eventSource.close();
            console.log("Evaluation completed successfully");
          } else if (data.stage && data.percent !== undefined) {
            setProgressStage(data.stage);
            setProgressPercent(data.percent);
          }
        } catch (parseError) {
          console.error("Error parsing SSE data:", parseError);
          setError(parseError instanceof Error ? parseError.message : t("errors.evaluationFailed"));
          setIsEvaluating(false);
          eventSource.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        setError(t("errors.evaluationFailed"));
        setIsEvaluating(false);
        eventSource.close();
      };

    } catch (err) {
      console.error("Evaluation error:", err);
      setError(
        err instanceof Error ? err.message : t("errors.evaluationFailed")
      );
      setIsEvaluating(false);
    }
  };

  const getRiskColorClass = (risk: string) => {
    switch (risk) {
      case "High":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Low":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "Compliant":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "NonCompliant":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "PartiallyCompliant":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-800";
    }
  };

  const getSeverityColorClass = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "Major":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "Minor":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href={`/${locale}`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center"
          >
            <svg
              className="w-5 h-5 me-2 rtl:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t("back")}
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t("title")}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {t("subtitle")}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {t("version")}
          </p>
        </div>

        {/* Upload Section */}
        {!evaluationResult && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t("upload.title")}
              </h2>

              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>

                <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                  {t("upload.dragDrop")}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("upload.maxSize")} • {t("upload.acceptedFormat")}
                </p>
              </div>

              {/* Selected File */}
              {file && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      className="w-8 h-8 text-blue-600 dark:text-blue-400 me-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Evaluate Button */}
              <button
                onClick={handleEvaluate}
                disabled={!file || isEvaluating}
                className="w-full mt-8 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
              >
                {isEvaluating ? t("upload.evaluating") : t("upload.button")}
              </button>
            </div>

            {/* Progress Indicator */}
            {isEvaluating && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 me-4"></div>
                  <div className="flex-1">
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {progressStage
                        ? t(`progress.${progressStage}`)
                        : t("progress.uploading")}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {progressPercent}%
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>

                {/* Progress Checklist */}
                <div className="mt-6 space-y-2">
                  {[
                    { key: "uploading", percent: 10 },
                    { key: "extracting", percent: 20 },
                    { key: "loading", percent: 30 },
                    { key: "parsing", percent: 40 },
                    { key: "classifying", percent: 50 },
                    { key: "checking", percent: 60 },
                    { key: "validating", percent: 70 },
                    { key: "assessing", percent: 80 },
                    { key: "synthesizing", percent: 90 },
                  ].map((stage) => (
                    <div
                      key={stage.key}
                      className={`flex items-center text-sm ${
                        progressPercent > stage.percent
                          ? "text-green-600 dark:text-green-400"
                          : progressPercent >= stage.percent - 10 && progressPercent <= stage.percent
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {progressPercent > stage.percent ? (
                        <svg
                          className="w-5 h-5 me-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : progressPercent >= stage.percent - 10 && progressPercent <= stage.percent ? (
                        <div className="w-5 h-5 me-2 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        </div>
                      ) : (
                        <svg
                          className="w-5 h-5 me-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {t(`progress.${stage.key}`)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {evaluationResult && (
          <div className="max-w-6xl mx-auto">
            {/* Results Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t("results.title")}
                </h2>
                <button
                  onClick={() => {
                    setEvaluationResult(null);
                    setFile(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {t("results.newEvaluation")}
                </button>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t("results.overallScore")}
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {evaluationResult.summary.overallScore}%
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t("results.variationType")}
                  </p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {evaluationResult.metadata.variationType}
                  </p>
                </div>

                <div
                  className={`rounded-xl p-4 ${getRiskColorClass(evaluationResult.riskAssessment.overallRisk)}`}
                >
                  <p className="text-sm mb-1">{t("results.riskLevel")}</p>
                  <p className="text-xl font-bold">
                    {t(`results.risk.${evaluationResult.riskAssessment.overallRisk}`)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {t("results.approvalProbability")}
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {evaluationResult.riskAssessment.approvalProbability}%
                  </p>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {t("results.executiveSummary")}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {evaluationResult.summary.executiveSummary}
                </p>
              </div>
            </div>

            {/* Key Findings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t("results.keyFindings")}
              </h3>
              <ul className="space-y-2">
                {evaluationResult.summary.keyFindings.map((finding, idx) => (
                  <li
                    key={idx}
                    className="flex items-start text-gray-700 dark:text-gray-300"
                  >
                    <svg
                      className="w-6 h-6 text-blue-600 dark:text-blue-400 me-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>

            {/* Critical Issues */}
            {evaluationResult.summary.criticalIssues.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 mb-6">
                <h3 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-4">
                  {t("results.criticalIssues")}
                </h3>
                <ul className="space-y-2">
                  {evaluationResult.summary.criticalIssues.map((issue, idx) => (
                    <li
                      key={idx}
                      className="flex items-start text-red-700 dark:text-red-300"
                    >
                      <svg
                        className="w-6 h-6 text-red-600 me-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Compliance Sections */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t("results.sections")}
              </h3>
              <div className="space-y-4">
                {evaluationResult.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        {section.sectionName}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColorClass(section.status)}`}
                        >
                          {t(`results.status.${section.status}`)}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColorClass(section.severity)}`}
                        >
                          {t(`results.severity.${section.severity}`)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <strong>{t("results.sfdaReference")}:</strong>{" "}
                      {section.sfdaReference}
                    </p>
                    {section.findings.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t("results.findings")}:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {section.findings.map((finding, fidx) => (
                            <li key={fidx}>{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {section.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t("results.recommendations")}:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {section.recommendations.map((rec, ridx) => (
                            <li key={ridx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Documents */}
            {evaluationResult.missingDocuments.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {t("results.missingDocuments")}
                </h3>
                <div className="space-y-3">
                  {evaluationResult.missingDocuments.map((doc, idx) => (
                    <div
                      key={idx}
                      className="border-s-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 dark:text-white">
                          {doc.documentName}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            doc.mandatory
                              ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                          }`}
                        >
                          {doc.mandatory
                            ? t("results.mandatory")
                            : t("results.optional")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {doc.impact}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <strong>{t("results.sfdaReference")}:</strong>{" "}
                        {doc.sfdaReference}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t("results.recommendations")}
              </h3>
              <div className="space-y-4">
                {evaluationResult.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-5"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                        {rec.action}
                      </h4>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rec.priority === "High"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40"
                            : rec.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40"
                            : "bg-green-100 text-green-800 dark:bg-green-900/40"
                        }`}
                      >
                        {t(`results.priority.${rec.priority}`)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {rec.rationale}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <strong>{t("results.sfdaReference")}:</strong>{" "}
                      {rec.sfdaReference}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t("results.nextSteps")}
              </h3>
              <ol className="space-y-3">
                {evaluationResult.summary.nextSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex items-start text-gray-700 dark:text-gray-300"
                  >
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold me-3">
                      {idx + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
