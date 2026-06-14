import type { Embedder } from "../interfaces.js";

// NOTE: fastembed-js@1.14.4 ships the BGE / MiniLM / E5 families but NOT nomic. The spec
// asked for "bge-small or nomic"; "bge-base" (768-dim, English) is the higher-quality
// stand-in for nomic here. Swap to a nomic-capable backend later without touching callers.
export type FastEmbedModel = "bge-small" | "bge-base";

export interface LocalEmbedderConfig {
  /** Which fastembed model to run. Defaults to "bge-small" (384-dim, fast, English). */
  model?: FastEmbedModel;
  /** Where fastembed caches downloaded weights. */
  cacheDir?: string;
  /** Max tokens per document before truncation. */
  maxLength?: number;
}

interface ModelSpec {
  /** EmbeddingModel enum member in the `fastembed` package. */
  member: "BGESmallENV15" | "BGEBaseENV15";
  dimensions: number;
}

const MODELS: Record<FastEmbedModel, ModelSpec> = {
  "bge-small": { member: "BGESmallENV15", dimensions: 384 },
  "bge-base": { member: "BGEBaseENV15", dimensions: 768 },
};

/**
 * In-process embeddings via `fastembed` (ONNX runtime). No API key; no network at runtime
 * except a one-time model-weight download on first use. `fastembed` is imported lazily, so
 * merely constructing this class (e.g. in the provider factory or its unit test) does not
 * load the native runtime.
 */
export class LocalEmbedder implements Embedder {
  readonly dimensions: number;
  private readonly spec: ModelSpec;
  private readonly cacheDir: string | undefined;
  private readonly maxLength: number | undefined;
  private engine: Promise<import("fastembed").FlagEmbedding> | null = null;

  constructor(cfg: LocalEmbedderConfig = {}) {
    const key = cfg.model ?? "bge-small";
    const spec = MODELS[key];
    if (!spec) {
      throw new Error(
        `LocalEmbedder: unsupported model "${key}" (supported: ${Object.keys(MODELS).join(" | ")})`,
      );
    }
    this.spec = spec;
    this.dimensions = spec.dimensions;
    this.cacheDir = cfg.cacheDir;
    this.maxLength = cfg.maxLength;
  }

  private init(): Promise<import("fastembed").FlagEmbedding> {
    if (!this.engine) {
      this.engine = (async () => {
        const { FlagEmbedding, EmbeddingModel } = await import("fastembed");
        return FlagEmbedding.init({
          model: EmbeddingModel[this.spec.member],
          ...(this.cacheDir !== undefined ? { cacheDir: this.cacheDir } : {}),
          ...(this.maxLength !== undefined ? { maxLength: this.maxLength } : {}),
        });
      })();
    }
    return this.engine;
  }

  async embed(text: string): Promise<number[]> {
    // Route through embedBatch so single and batch embed IDENTICALLY. (fastembed's
    // queryEmbed() prepends a "query:" instruction prefix while embed() adds none —
    // mixing them would put query-time and index-time vectors in different spaces.)
    const [vec] = await this.embedBatch([text]);
    if (!vec) throw new Error("LocalEmbedder.embed: fastembed returned no vector");
    return vec;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const engine = await this.init();
    const out: number[][] = [];
    for await (const batch of engine.embed(texts, 256)) {
      out.push(...batch);
    }
    return out;
  }
}
