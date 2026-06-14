import type { Embedder } from "@code-forge/core";
import type { ConventionMatch } from "@code-forge/db";

/** A changed region of the diff: the file it touches and its (new) content. */
export interface Hunk {
  path: string;
  content: string;
}

export interface RetrieveDeps {
  embedder: Embedder;
  /** Cosine search over the conventions table (injected — DB in prod, fake in tests). */
  match: (repo: string, embedding: number[], count: number) => Promise<ConventionMatch[]>;
}

export interface RetrieveOptions {
  /** Number of conventions to return. */
  k?: number;
  /** Candidate pool pulled from the vector search before glob filtering. Keep it well
   *  above `k` (default 50 vs 8) since the path-glob filter runs after the SQL LIMIT. */
  poolSize?: number;
  /** Weight applied to a convention's signal in the re-rank. */
  signalWeight?: number;
}

export interface RankedConvention extends ConventionMatch {
  rankScore: number;
}

const DEFAULTS = { k: 8, poolSize: 50, signalWeight: 0.15 } as const;

/**
 * Tiny glob → RegExp for the path globs we generate ("**", "** /*.ts", "src/**", "docs/*.md").
 * `*` stays within a path segment; `**` spans segments. Not a full glob engine.
 */
export function globToRegExp(glob: string): RegExp {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*"; // ** spans path segments
        i += 1;
        if (glob[i + 1] === "/") i += 1; // swallow the slash in "**/"
      } else {
        re += "[^/]*"; // * stays within a segment
      }
    } else if (c === "?") {
      re += "[^/]";
    } else if (c && "\\^$.|+()[]{}".includes(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

/** A convention applies when it has no glob (repo-wide) or its glob matches a changed file. */
export function pathGlobMatches(pathGlob: string | null, changedFiles: string[]): boolean {
  if (!pathGlob || pathGlob === "*" || pathGlob === "**" || pathGlob === "**/*") return true;
  const re = globToRegExp(pathGlob);
  return changedFiles.some((f) => re.test(f));
}

/** Keep conventions relevant to the changed files, then re-rank by similarity + w·signal. */
export function rankConventions(
  candidates: ConventionMatch[],
  changedFiles: string[],
  signalWeight: number = DEFAULTS.signalWeight,
): RankedConvention[] {
  return candidates
    .filter((c) => pathGlobMatches(c.pathGlob, changedFiles))
    .map((c) => ({ ...c, rankScore: c.similarity + signalWeight * c.signal }))
    .sort((a, b) => b.rankScore - a.rankScore);
}

/**
 * Retrieve the conventions most relevant to a diff: embed the diff, cosine-search the repo's
 * conventions, filter by path-glob against the changed files, and re-rank by
 * similarity + signalWeight·signal.
 */
export async function retrieveConventions(
  repo: string,
  hunks: Hunk[],
  deps: RetrieveDeps,
  opts: RetrieveOptions = {},
): Promise<RankedConvention[]> {
  if (hunks.length === 0) return [];

  const k = opts.k ?? DEFAULTS.k;
  const poolSize = opts.poolSize ?? DEFAULTS.poolSize;
  const signalWeight = opts.signalWeight ?? DEFAULTS.signalWeight;

  const changedFiles = [...new Set(hunks.map((h) => h.path))];
  const queryText = hunks.map((h) => `// ${h.path}\n${h.content}`).join("\n\n");

  const embedding = await deps.embedder.embed(queryText);
  const candidates = await deps.match(repo, embedding, poolSize);

  return rankConventions(candidates, changedFiles, signalWeight).slice(0, k);
}
