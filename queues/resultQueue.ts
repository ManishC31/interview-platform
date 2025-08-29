import { Queue } from "bullmq";
import redis from "@/redis/connection";

// Reuse a singleton Queue across hot reloads in dev
const globalForQueues = globalThis as unknown as {
  __resultQueue__: Queue | undefined;
};

function createResultQueue(): Queue {
  const queue = new Queue("process-result", {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: 10, // Keep last 10 completed jobs
      removeOnFail: 10,     // Keep last 10 failed jobs
      attempts: 3,           // Retry failed jobs up to 3 times
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  });

  return queue;
}

export const resultQueue: Queue =
  globalForQueues.__resultQueue__ ?? createResultQueue();

if (!globalForQueues.__resultQueue__) {
  globalForQueues.__resultQueue__ = resultQueue;
}

export default resultQueue;
