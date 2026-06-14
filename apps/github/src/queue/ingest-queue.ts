import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { App } from "octokit";
import type { Octokit } from "octokit";
import { ingestRepo } from "../conventions/ingest.js";
import { buildIngestDeps } from "../conventions/providers.js";

export interface IngestJob {
  installationId: number;
  owner: string;
  repo: string;
}

type Env = Record<string, string | undefined>;

const QUEUE_NAME = "ingest";

// Parse the Redis URL into options so BullMQ creates the connection with its own ioredis
// (avoids a second, version-mismatched ioredis copy in this package).
function connection(env: Env): ConnectionOptions | null {
  const url = env.REDIS_URL ?? env.UPSTASH_REDIS_URL;
  if (!url) return null;
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 6379,
    username: u.username || undefined,
    password: u.password || undefined,
    maxRetriesPerRequest: null, // required by BullMQ
    ...(u.protocol === "rediss:" ? { tls: {} } : {}),
  };
}

// Memoized singleton — binds to the env of the FIRST getQueue() call (fine for the server,
// which uses process.env throughout).
let queue: Queue | null = null;

function getQueue(env: Env): Queue | null {
  if (queue) return queue;
  const conn = connection(env);
  if (!conn) return null;
  queue = new Queue(QUEUE_NAME, { connection: conn });
  return queue;
}

/** Close the queue connection (for graceful shutdown). */
export async function closeQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
}

/**
 * Enqueue a repo ingest so the webhook can return immediately. If no Redis is configured,
 * fall back to processing in the background (still non-blocking for the webhook).
 */
export async function enqueueIngest(job: IngestJob, env: Env = process.env): Promise<void> {
  const q = getQueue(env);
  if (q) {
    await q.add("ingest", job, {
      jobId: `${job.installationId}:${job.owner}/${job.repo}`,
      removeOnComplete: true,
      removeOnFail: 100,
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
    });
    return;
  }
  // No Redis: don't block the webhook — run detached.
  void processIngest(job, env).catch((err) => console.error("[ingest] inline run failed:", err));
}

/** Actually ingest a repo (used by the worker and the no-Redis fallback). */
export async function processIngest(job: IngestJob, env: Env = process.env): Promise<void> {
  const octokit = await installationOctokit(job.installationId, env);
  await ingestRepo(octokit, job.owner, job.repo, buildIngestDeps(env));
}

/** Start the BullMQ worker (no-op without Redis — the inline fallback covers that case). */
export function startIngestWorker(env: Env = process.env): Worker | null {
  const conn = connection(env);
  if (!conn) {
    console.warn("[ingest] no REDIS_URL — ingest runs inline (set REDIS_URL to use the queue)");
    return null;
  }
  const worker = new Worker(QUEUE_NAME, (job) => processIngest(job.data as IngestJob, env), {
    connection: conn,
  });
  worker.on("failed", (job, err) => console.error(`[ingest] job ${job?.id} failed:`, err));
  return worker;
}

async function installationOctokit(installationId: number, env: Env): Promise<Octokit> {
  const appId = env.APP_ID;
  const privateKey = env.PRIVATE_KEY;
  if (!appId || !privateKey) {
    throw new Error("processIngest: APP_ID and PRIVATE_KEY are required to authenticate the installation");
  }
  const app = new App({ appId, privateKey });
  return app.getInstallationOctokit(installationId);
}
