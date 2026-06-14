/**
 * Simulate a GitHub webhook against the local Probot server with a correct HMAC signature.
 *
 *   pnpm --filter @code-forge/github dev          # in one terminal (start the server)
 *   set -a; . .env.local; set +a                  # load WEBHOOK_SECRET / PORT
 *   pnpm --filter @code-forge/github simulate pull_request
 *   pnpm --filter @code-forge/github simulate installation_repositories
 *   pnpm --filter @code-forge/github simulate pull_request_review_comment ./payload.json
 *
 * Signs the body with WEBHOOK_SECRET so Probot's signature verification accepts it.
 */
import { readFileSync } from "node:fs";
import { createHmac, randomUUID } from "node:crypto";

const event = process.argv[2] ?? "pull_request";
const payloadFile = process.argv[3];
const port = process.env.PORT ?? "3000";
const secret = process.env.WEBHOOK_SECRET ?? "";
const url = `http://localhost:${port}/api/github/webhooks`;

const SAMPLES: Record<string, unknown> = {
  pull_request: {
    action: "opened",
    number: 1,
    pull_request: { number: 1, head: { sha: "deadbeefcafe" } },
    repository: { name: "demo", full_name: "acme/demo", owner: { login: "acme" } },
    installation: { id: 1 },
  },
  installation_repositories: {
    action: "added",
    installation: { id: 1 },
    repositories_added: [{ id: 1, name: "demo", full_name: "acme/demo" }],
  },
  pull_request_review_comment: {
    action: "created",
    comment: { id: 10, body: `Heads up <!-- cf:conv=${"ab12cd34".repeat(8)} -->` },
    repository: { name: "demo", full_name: "acme/demo", owner: { login: "acme" } },
    installation: { id: 1 },
  },
};

async function main(): Promise<void> {
  const payload = payloadFile
    ? (JSON.parse(readFileSync(payloadFile, "utf8")) as unknown)
    : SAMPLES[event];
  if (!payload) {
    console.error(`No built-in sample for "${event}". Pass a payload file as the 2nd arg.`);
    process.exitCode = 1;
    return;
  }

  const body = JSON.stringify(payload);
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  if (!secret) console.warn("WEBHOOK_SECRET is empty — the server will reject the signature.");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-github-event": event,
      "x-github-delivery": randomUUID(),
      "x-hub-signature-256": signature,
    },
    body,
  });
  console.log(`POST ${url}  event=${event}  → ${res.status} ${res.statusText}`);
  const text = await res.text();
  if (text) console.log(text);
}

void main();
