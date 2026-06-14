import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type DbEnv = Record<string, string | undefined>;

/** A Supabase client for server-side use (service-role preferred; anon works read-only). */
export function createDbClient(env: DbEnv = process.env): SupabaseClient {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "createDbClient: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY",
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
