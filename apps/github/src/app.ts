import type { Probot } from "probot";
import type { Octokit } from "octokit";
import { enqueueIngest } from "./queue/ingest-queue.js";
import { reviewPullRequest } from "./review/review.js";
import { buildReviewDeps } from "./review/providers.js";
import { recordReactionSignal } from "./signal/reaction.js";
import { buildReactionDeps } from "./signal/providers.js";

/**
 * Code Forge GitHub App. Probot verifies the webhook HMAC (X-Hub-Signature-256) against
 * WEBHOOK_SECRET before any handler runs, so handlers only see authentic events.
 *
 * Handlers catch and log their own errors: a thrown handler would make Probot return 500,
 * and GitHub would retry the delivery — re-running the whole pipeline and risking duplicate
 * reviews. We swallow transient failures (LLM 429s, DB blips) and return 200.
 */
export default function codeForgeApp(probot: Probot): void {
  // Installation → queue an ingest per added repo (webhook returns immediately).
  probot.on(["installation.created", "installation_repositories.added"], async (ctx) => {
    try {
      const installationId = ctx.payload.installation.id;
      const repos =
        "repositories_added" in ctx.payload
          ? ctx.payload.repositories_added
          : ctx.payload.repositories;
      for (const r of repos ?? []) {
        const [owner, repo] = r.full_name.split("/");
        if (owner && repo) await enqueueIngest({ installationId, owner, repo });
      }
      ctx.log.info({ installationId, count: (repos ?? []).length }, "queued repo ingest");
    } catch (err) {
      ctx.log.error({ err }, "installation ingest enqueue failed");
    }
  });

  // PR opened/synced → review against the repo's conventions.
  probot.on(["pull_request.opened", "pull_request.synchronize"], async (ctx) => {
    const pr = ctx.payload.pull_request;
    try {
      const { owner, repo } = ctx.repo();
      const deps = buildReviewDeps(ctx.octokit as unknown as Octokit);
      const outcome = await reviewPullRequest(deps, {
        owner,
        repo,
        prNumber: pr.number,
        headSha: pr.head.sha,
      });
      ctx.log.info({ pr: pr.number, ...outcome }, "code-forge review");
    } catch (err) {
      ctx.log.error({ err, pr: pr.number }, "code-forge review failed");
    }
  });

  // Review-comment activity → fold reactions into the cited convention's signal (idempotent).
  // NOTE: GitHub does not webhook reactions; this is best-effort. The authoritative trigger is
  // a scheduled poller calling pollCommentReactions() (see signal/reaction.ts).
  probot.on(["pull_request_review_comment.created", "pull_request_review_comment.edited"], async (ctx) => {
    try {
      const { owner, repo } = ctx.repo();
      const comment = ctx.payload.comment;
      const deps = buildReactionDeps(ctx.octokit as unknown as Octokit);
      await recordReactionSignal(deps, {
        owner,
        repo,
        commentId: comment.id,
        commentBody: comment.body,
      });
    } catch (err) {
      ctx.log.error({ err }, "reaction signal update failed");
    }
  });
}
