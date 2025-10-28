import { NextRequest } from "next/server";
import { getJob } from "@/lib/job-manager";

export const runtime = "nodejs";
export const maxDuration = 300; // Match evaluation timeout

/**
 * GET /api/evaluate/stream?jobId=xxx
 * Stream job progress via Server-Sent Events
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "Missing jobId parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Check if job exists
  const job = getJob(jobId);
  if (!job) {
    return new Response(
      JSON.stringify({ error: "Job not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Stream progress updates
  (async () => {
    try {
      let lastPercent = 0;

      // Poll job state and stream updates
      while (true) {
        const currentJob = getJob(jobId);

        if (!currentJob) {
          // Job was cleaned up (TTL expired)
          const errorData = JSON.stringify({
            error: true,
            message: "Job expired or was cleaned up",
          });
          await writer.write(encoder.encode(`data: ${errorData}\n\n`));
          break;
        }

        // Send progress update if changed
        if (currentJob.progress.percent > lastPercent) {
          const progressData = JSON.stringify({
            stage: currentJob.progress.stage,
            percent: currentJob.progress.percent,
          });
          await writer.write(encoder.encode(`data: ${progressData}\n\n`));
          lastPercent = currentJob.progress.percent;
        }

        // Check if completed
        if (currentJob.status === "completed" && currentJob.result) {
          const finalData = JSON.stringify({
            done: true,
            evaluation: currentJob.result,
          });
          await writer.write(encoder.encode(`data: ${finalData}\n\n`));
          break;
        }

        // Check if failed
        if (currentJob.status === "failed") {
          const errorData = JSON.stringify({
            error: true,
            message: currentJob.error || "Evaluation failed",
          });
          await writer.write(encoder.encode(`data: ${errorData}\n\n`));
          break;
        }

        // Poll interval: 100ms for responsive updates
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Error streaming job updates:", error);
      const errorData = JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : "Stream error",
      });
      await writer.write(encoder.encode(`data: ${errorData}\n\n`));
    } finally {
      await writer.close();
    }
  })();

  // Return SSE response with proper headers
  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
