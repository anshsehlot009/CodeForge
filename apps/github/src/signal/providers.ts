import type { Octokit } from "octokit";
import { applyReactionSignal, createDbClient } from "@code-forge/db";
import { SIGNAL_STEP, type ReactionDeps } from "./reaction.js";

type Env = Record<string, string | undefined>;

/** Wire reaction handling to the DB (idempotent signal updates). */
export function buildReactionDeps(octokit: Octokit, env: Env = process.env): ReactionDeps {
  const db = createDbClient(env);
  return {
    octokit,
    applyReaction: (commentId, conventionId, currentDelta) =>
      applyReactionSignal(db, commentId, conventionId, currentDelta, SIGNAL_STEP),
  };
}
