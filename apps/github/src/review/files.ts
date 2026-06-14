import type { Octokit } from "octokit";

/** A changed file we're willing to review. */
export interface ChangedFile {
  path: string;
  changes: number;
  patch: string;
  status: string;
}

/** Files above this many changes are too big to review usefully. */
export const MAX_FILE_CHANGES = 1500;

const GENERATED_PATTERNS: RegExp[] = [
  /(^|\/)node_modules\//,
  /(^|\/)(dist|build|out|coverage|\.next)\//,
  /(^|\/)vendor\//,
  /\.min\.(js|css)$/,
  /\.(map|snap)$/,
  /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb)$/,
  /\.(generated|gen)\.[a-z0-9]+$/i,
  /(^|\/)__generated__\//,
];

export function isGenerated(path: string): boolean {
  return GENERATED_PATTERNS.some((re) => re.test(path));
}

/** Keep only added/modified text files with a patch, under the size cap, and not generated. */
export function isReviewable(file: {
  filename: string;
  changes: number;
  status: string;
  patch?: string;
}): boolean {
  if (file.status === "removed") return false;
  if (!file.patch) return false; // binary or no textual diff
  if (file.changes > MAX_FILE_CHANGES) return false;
  if (isGenerated(file.filename)) return false;
  return true;
}

/**
 * New-side line numbers a review comment can anchor to (added `+` and context ` ` lines).
 * GitHub rejects comments on lines not present in the diff, so we filter to these.
 */
export function addressableLines(patch: string): Set<number> {
  const lines = new Set<number>();
  let newLine = 0;
  for (const row of patch.split("\n")) {
    const header = row.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (header) {
      newLine = Number(header[1]);
      continue;
    }
    if (row.startsWith("+") || row.startsWith(" ")) {
      lines.add(newLine);
      newLine += 1;
    }
    // '-' lines exist only on the old side; '\' / metadata lines don't advance the new side.
  }
  return lines;
}

/** Fetch a PR's changed files, dropping generated / oversized / non-text ones. */
export async function fetchReviewableFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<ChangedFile[]> {
  const files = await octokit.paginate("GET /repos/{owner}/{repo}/pulls/{pull_number}/files", {
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });
  return files
    .filter((f) => isReviewable(f))
    .map((f) => ({ path: f.filename, changes: f.changes, patch: f.patch ?? "", status: f.status }));
}
