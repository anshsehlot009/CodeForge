import { run } from "probot";
import app from "./app.js";
import { closeQueue, startIngestWorker } from "./queue/ingest-queue.js";

// Local dev / Render entrypoint. Probot reads APP_ID, PRIVATE_KEY, WEBHOOK_SECRET, and PORT
// from the environment (see .env.example). Run with `pnpm dev:github`.
void run(app).then(() => {
  // Start the BullMQ ingest worker in-process (no-op without REDIS_URL).
  const worker = startIngestWorker();

  // Graceful shutdown so Redis connections close cleanly on Render/Upstash redeploys.
  for (const sig of ["SIGTERM", "SIGINT"] as const) {
    process.once(sig, () => {
      void (async () => {
        await worker?.close();
        await closeQueue();
        process.exit(0);
      })();
    });
  }
});
