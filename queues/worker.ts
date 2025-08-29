import "dotenv/config";

import { Worker, Job } from "bullmq";
import redis from "../redis/connection";
import { processInterviewResult } from "@/services/result.service";

const queueName = "process-result";

// Create the worker with proper error handling
export const worker = new Worker(
  queueName,
  async (job: Job) => {
    try {
      await processInterviewResult(job);
    } catch (error) {
      console.error(`[Worker] Error processing job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 1, // Process one job at a time for debugging
  }
);

worker.on("active", (job) => {
  console.log(`[Worker] Job ${job.id} has started processing`);
});

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
  console.error(`[Worker] Failed job data:`, job?.data);
});

worker.on("error", (err) => {
  console.error(`[Worker] Worker error:`, err);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("[Worker] Shutting down worker gracefully...");
  await worker.close();
  process.exit(0);
});
