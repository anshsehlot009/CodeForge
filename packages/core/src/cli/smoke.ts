/**
 * Smoke-test each provider against real services.
 *
 *   pnpm --filter @code-forge/core smoke              # test everything env allows
 *   pnpm --filter @code-forge/core smoke strong fast  # test a subset
 *
 * Providers whose env vars are absent are skipped (not failed). Needs keys from
 * .env.local — load them however you like, e.g.  `set -a; . .env.local; set +a`.
 * Note: the embedder downloads its model weights (~tens of MB) on first run.
 */
import { GroqLLM } from "../providers/groq.js";
import { CerebrasLLM, GeminiLLM } from "../providers/fast.js";
import { LocalEmbedder } from "../providers/local-embedder.js";
import { SupabaseVectorStore } from "../providers/supabase-vector-store.js";
import type { LLM } from "../interfaces.js";

const env = process.env;
const embedModel = env.EMBED_MODEL === "bge-base" ? "bge-base" : "bge-small";
const selected = new Set(process.argv.slice(2).filter((a) => !a.startsWith("-")));
const want = (name: string) => selected.size === 0 || selected.has(name);

const PING = [{ role: "user" as const, content: "Reply with exactly the word: pong" }];

let failed = 0;
const pass = (name: string, detail: string) => console.log(`  ✓ ${name.padEnd(18)} ${detail}`);
const skip = (name: string, why: string) => console.log(`  – ${name.padEnd(18)} skipped (${why})`);
const fail = (name: string, err: unknown) => {
  failed++;
  console.log(`  ✗ ${name.padEnd(18)} ${err instanceof Error ? err.message : String(err)}`);
};

async function testLLM(name: string, llm: LLM): Promise<void> {
  const text = await llm.complete(PING, { maxTokens: 16, temperature: 0 });
  pass(name, `${llm.model} → ${JSON.stringify(text.trim().slice(0, 40))}`);
}

async function main(): Promise<void> {
  console.log("Code Forge provider smoke test\n");

  if (want("strong")) {
    const key = env.GROQ_API_KEY;
    if (!key) skip("strong (groq)", "GROQ_API_KEY");
    else await testLLM("strong (groq)", new GroqLLM({ apiKey: key, model: env.GROQ_MODEL })).catch((e) => fail("strong (groq)", e));
  }

  if (want("fast")) {
    const provider = (env.FAST_PROVIDER ?? "cerebras").toLowerCase();
    if (provider === "gemini") {
      const key = env.GEMINI_API_KEY;
      if (!key) skip("fast (gemini)", "GEMINI_API_KEY");
      else await testLLM("fast (gemini)", new GeminiLLM({ apiKey: key, model: env.GEMINI_MODEL })).catch((e) => fail("fast (gemini)", e));
    } else {
      const key = env.CEREBRAS_API_KEY;
      if (!key) skip("fast (cerebras)", "CEREBRAS_API_KEY");
      else await testLLM("fast (cerebras)", new CerebrasLLM({ apiKey: key, model: env.CEREBRAS_MODEL })).catch((e) => fail("fast (cerebras)", e));
    }
  }

  if (want("embed")) {
    try {
      const embedder = new LocalEmbedder({ model: embedModel, cacheDir: env.FASTEMBED_CACHE_DIR });
      console.log("  … embedder loading model (first run downloads weights)");
      const vec = await embedder.embed("Code Forge reasons over a codebase with retrieval.");
      pass("embedder", `dim=${vec.length} (declared ${embedder.dimensions})`);
    } catch (e) {
      fail("embedder", e);
    }
  }

  if (want("vector")) {
    const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY;
    if (!env.SUPABASE_URL || !key) {
      skip("vectorStore", "SUPABASE_URL / SUPABASE_*_KEY");
    } else {
      try {
        const store = new SupabaseVectorStore({
          url: env.SUPABASE_URL,
          key,
          table: env.SUPABASE_EMBEDDINGS_TABLE,
          matchFn: env.SUPABASE_MATCH_FN,
        });
        // Probe with a vector of the right width (match the DB's vector(N) column).
        const dim = new LocalEmbedder({ model: embedModel }).dimensions;
        const hits = await store.search("smoke/repo", new Array(dim).fill(0.01), 1);
        pass("vectorStore", `search ok (${hits.length} row[s]) — schema reachable`);
      } catch (e) {
        fail("vectorStore", e);
      }
    }
  }

  console.log(failed === 0 ? "\nAll selected providers OK." : `\n${failed} provider(s) failed.`);
  process.exitCode = failed === 0 ? 0 : 1;
}

void main();
