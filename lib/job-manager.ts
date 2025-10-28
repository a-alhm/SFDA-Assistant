import type { EvaluationResult } from "./evaluation-schema";
import { randomUUID } from "crypto";

interface JobState {
  jobId: string;
  status: 'created' | 'processing' | 'completed' | 'failed';
  progress: {
    stage: string;
    percent: number;
  };
  result?: EvaluationResult;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

// In-memory job storage
const jobs = new Map<string, JobState>();

// Configuration
const JOB_TTL = 10 * 60 * 1000; // 10 minutes
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

// Periodic cleanup of old jobs
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [jobId, job] of jobs.entries()) {
    if (now - job.updatedAt > JOB_TTL) {
      jobs.delete(jobId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired jobs`);
  }
}, CLEANUP_INTERVAL);

/**
 * Create a new job and return its ID
 */
export function createJob(): string {
  const jobId = randomUUID();

  jobs.set(jobId, {
    jobId,
    status: 'created',
    progress: {
      stage: 'uploading',
      percent: 0,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  console.log(`Created job ${jobId}`);
  return jobId;
}

/**
 * Update job progress
 */
export function updateProgress(jobId: string, stage: string, percent: number): void {
  const job = jobs.get(jobId);

  if (!job) {
    console.warn(`Cannot update progress: job ${jobId} not found`);
    return;
  }

  job.status = 'processing';
  job.progress = { stage, percent };
  job.updatedAt = Date.now();

  console.log(`Job ${jobId}: ${stage} (${percent}%)`);
}

/**
 * Set job result (success)
 */
export function setResult(jobId: string, result: EvaluationResult): void {
  const job = jobs.get(jobId);

  if (!job) {
    console.warn(`Cannot set result: job ${jobId} not found`);
    return;
  }

  job.status = 'completed';
  job.result = result;
  job.updatedAt = Date.now();

  console.log(`Job ${jobId} completed successfully`);
}

/**
 * Set job error (failure)
 */
export function setError(jobId: string, error: string): void {
  const job = jobs.get(jobId);

  if (!job) {
    console.warn(`Cannot set error: job ${jobId} not found`);
    return;
  }

  job.status = 'failed';
  job.error = error;
  job.updatedAt = Date.now();

  console.log(`Job ${jobId} failed: ${error}`);
}

/**
 * Get job state (for streaming endpoint)
 */
export function getJob(jobId: string): JobState | undefined {
  return jobs.get(jobId);
}

/**
 * Get all jobs (for debugging)
 */
export function getAllJobs(): JobState[] {
  return Array.from(jobs.values());
}

/**
 * Manual cleanup (for testing)
 */
export function cleanupExpiredJobs(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [jobId, job] of jobs.entries()) {
    if (now - job.updatedAt > JOB_TTL) {
      jobs.delete(jobId);
      cleaned++;
    }
  }

  return cleaned;
}
