import type { Octokit } from "octokit";

/** Signal change per net reaction. */
export const SIGNAL_STEP = 0.5;

const POSITIVE = new Set(["+1", "heart", "hooray", "rocket"]);
const NEGATIVE = new Set(["-1", "confused"]);

// Convention ids are sha256 hex digests (see conventions/ingest.ts → stage()).
const MARKER = /<!--\s*cf:conv=([a-f0-9]{64})\s*-->/;

/** Extract the convention id our review comments embed as an HTML marker. */
export function parseConventionMarker(body: string | null | undefined): string | null {
  if (!body) return null;
  const m = body.match(MARKER);
  return m ? (m[1] ?? null) : null;
}

/** Net signal from a comment's reactions: +1 per upvote-ish, -1 per downvote-ish. */
export function reactionDelta(reactions: { content: string }[]): number {
  let delta = 0;
  for (const r of reactions) {
    if (POSITIVE.has(r.content)) delta += 1;
    else if (NEGATIVE.has(r.content)) delta -= 1;
  }
  return delta;
}

export interface ReactionDeps {
  octokit: Octokit;
  /** Idempotently apply the comment's absolute net reaction delta (DB folds in only the change). */
  applyReaction: (commentId: number, conventionId: string, currentDelta: number) => Promise<unknown>;
}

export interface ReactionTarget {
  owner: string;
  repo: string;
  commentId: number;
  commentBody: string | null | undefined;
}

/**
 * Read the reactions on one of our review comments and fold them into the cited convention's
 * signal — idempotently (safe to call repeatedly). No-op for comments without our marker.
 */
export async function recordReactionSignal(
  deps: ReactionDeps,
  target: ReactionTarget,
): Promise<{ conventionId: string; currentDelta: number } | null> {
  const conventionId = parseConventionMarker(target.commentBody);
  if (!conventionId) return null;

  const reactions = await deps.octokit.paginate(
    "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
    { owner: target.owner, repo: target.repo, comment_id: target.commentId, per_page: 100 },
  );
  const currentDelta = reactionDelta(reactions);
  await deps.applyReaction(target.commentId, conventionId, currentDelta);
  return { conventionId, currentDelta };
}

/**
 * Production reaction trigger: GitHub does NOT emit a webhook when someone reacts to a review
 * comment, so a scheduled job should call this to re-sync reactions on our recent comments.
 * Idempotent, so running it on any cadence is safe. Returns the number of comments synced.
 */
export async function pollCommentReactions(
  deps: ReactionDeps,
  owner: string,
  repo: string,
  opts: { since?: string } = {},
): Promise<number> {
  const comments = await deps.octokit.paginate("GET /repos/{owner}/{repo}/pulls/comments", {
    owner,
    repo,
    per_page: 100,
    sort: "updated",
    direction: "desc",
    ...(opts.since ? { since: opts.since } : {}),
  });

  let synced = 0;
  for (const c of comments) {
    if (!parseConventionMarker(c.body)) continue;
    await recordReactionSignal(deps, { owner, repo, commentId: c.id, commentBody: c.body });
    synced += 1;
  }
  return synced;
}
