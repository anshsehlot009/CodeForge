import type { Octokit } from "octokit";
import { GroqLLM, LocalEmbedder } from "@code-forge/core";
import {
  createDbClient,
  getNoiseBudget,
  matchConventions,
  recordReview,
  recordSuggestions,
} from "@code-forge/db";
import { retrieveConventions } from "../conventions/retrieve.js";
import { buildFastLLM, embedModelOf, type Env } from "../conventions/providers.js";
import type { ReviewDeps } from "./review.js";

function required(env: Env, key: string): string {
  const v = env[key];
  if (!v) throw new Error(`buildReviewDeps: missing required env var ${key}`);
  return v;
}

/** Wire the review pipeline from env: Groq strong, fast LLM, fastembed, Supabase. */
export function buildReviewDeps(octokit: Octokit, env: Env = process.env): ReviewDeps {
  const db = createDbClient(env);
  const embedder = new LocalEmbedder({ model: embedModelOf(env), cacheDir: env.FASTEMBED_CACHE_DIR });
  const strong = new GroqLLM({ apiKey: required(env, "GROQ_API_KEY"), model: env.GROQ_MODEL });
  const fastLLM = buildFastLLM(env);
  if (!fastLLM) {
    console.warn("[review] no fast LLM configured (FAST_PROVIDER key missing) — triage uses the strong model");
  }
  const fast = fastLLM ?? strong; // fall back to the strong model if no fast key

  return {
    octokit,
    strong,
    fast,
    retrieve: (repo, hunks) =>
      retrieveConventions(repo, hunks, {
        embedder,
        match: (r, e, c) => matchConventions(db, r, e, c),
      }),
    getNoiseBudget: (repo) => getNoiseBudget(db, repo),
    recordMetrics: async (target, findings, conventionsUsed) => {
      const reviewId = await recordReview(db, {
        repo: `${target.owner}/${target.repo}`,
        prNumber: target.prNumber,
        commitSha: target.headSha ?? null,
        model: strong.model,
        conventionsUsed,
        suggestionsCount: findings.length,
        status: "completed",
      });
      await recordSuggestions(
        db,
        findings.map((f) => ({
          reviewId,
          conventionId: f.conventionId,
          path: f.path,
          line: f.line,
          body: f.message,
        })),
      );
    },
  };
}
