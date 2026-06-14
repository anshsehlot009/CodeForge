-- Code Forge — conventions (pgvector retrieval) + reviews/suggestions (metrics).
-- Apply with the Supabase CLI:  supabase db push   (or paste into the SQL editor).

create extension if not exists vector;

-- ── conventions ──────────────────────────────────────────────────────────────
-- Learned coding conventions, embedded for retrieval.
-- `embedding` is vector(384) to match the default LocalEmbedder (bge-small). If you
-- switch EMBED_MODEL to bge-base, change 384 -> 768 here AND in match_conventions().
-- `id` is a deterministic content key (set by the ingester) so re-ingest upserts.
create table if not exists conventions (
  id          text primary key,
  repo        text        not null,
  source      text        not null check (source in ('pr_comment', 'contributing', 'styleguide')),
  source_url  text,
  path_glob   text,
  body        text        not null,
  embedding   vector(384) not null,
  signal      real        not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists conventions_embedding_hnsw
  on conventions using hnsw (embedding vector_cosine_ops);
create index if not exists conventions_repo_idx on conventions (repo);

-- Top-k conventions for a repo by cosine similarity. The path-glob filter (against a
-- specific diff's changed files) and the signal re-rank happen in the app layer.
-- We widen hnsw.ef_search to >= p_match_count: HNSW applies the `repo` filter inside the
-- candidate window, so a window narrower than the requested count would under-return.
create or replace function match_conventions(
  p_repo            text,
  p_query_embedding vector(384),
  p_match_count     int default 50
)
returns table (
  id         text,
  repo       text,
  source     text,
  source_url text,
  path_glob  text,
  body       text,
  signal     real,
  similarity real
)
language plpgsql
as $$
begin
  perform set_config('hnsw.ef_search', greatest(p_match_count, 40)::text, true);
  return query
    select
      c.id, c.repo, c.source, c.source_url, c.path_glob, c.body, c.signal,
      (1 - (c.embedding <=> p_query_embedding))::real
    from conventions c
    where c.repo = p_repo
    order by c.embedding <=> p_query_embedding
    limit p_match_count;
end;
$$;

-- Prune: delete a repo's conventions that were NOT in the latest ingest (keeps re-ingest
-- authoritative, so a rule deleted from a PR comment / style doc stops being retrieved).
create or replace function prune_conventions(p_repo text, p_keep_ids text[])
returns integer
language sql
as $$
  with deleted as (
    delete from conventions
    where repo = p_repo
      and array_length(p_keep_ids, 1) is not null  -- never wipe a repo on an empty keep-set
      and not (id = any(p_keep_ids))
    returning 1
  )
  select count(*)::int from deleted;
$$;

-- Atomically nudge a convention's signal (from 👍/👎 reactions on review comments).
create or replace function bump_convention_signal(p_id text, p_delta real)
returns real
language sql
as $$
  update conventions set signal = signal + p_delta where id = p_id
  returning signal;
$$;

-- Idempotent reaction ledger: stores the last absolute net-reaction delta applied per
-- review comment, so re-reading a comment's reactions (webhook edit OR poller) applies only
-- the *change* — never double-counts.
create table if not exists comment_reactions (
  comment_id    bigint      primary key,
  convention_id text        references conventions (id) on delete cascade,
  applied_delta real        not null default 0,
  updated_at    timestamptz not null default now()
);

create or replace function apply_reaction_signal(
  p_comment_id    bigint,
  p_convention_id text,
  p_current_delta real,
  p_step          real
)
returns real
language plpgsql
as $$
declare
  last_delta real;
  change real;
begin
  select applied_delta into last_delta from comment_reactions where comment_id = p_comment_id;
  change := (p_current_delta - coalesce(last_delta, 0)) * p_step;
  if change <> 0 then
    update conventions set signal = signal + change where id = p_convention_id;
  end if;
  insert into comment_reactions (comment_id, convention_id, applied_delta)
    values (p_comment_id, p_convention_id, p_current_delta)
    on conflict (comment_id) do update
      set applied_delta = excluded.applied_delta, updated_at = now();
  return change;
end;
$$;

-- ── per-repo noise budget (review comment limits) ────────────────────────────
create table if not exists noise_budgets (
  repo           text        primary key,
  min_confidence real        not null default 0.55,
  max_comments   int         not null default 10,
  updated_at     timestamptz not null default now()
);

-- Add the range checks idempotently (so a table created before they existed gets them too).
do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'noise_budgets'::regclass and conname = 'noise_budgets_min_confidence_chk') then
    alter table noise_budgets
      add constraint noise_budgets_min_confidence_chk check (min_confidence >= 0 and min_confidence <= 1);
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'noise_budgets'::regclass and conname = 'noise_budgets_max_comments_chk') then
    alter table noise_budgets
      add constraint noise_budgets_max_comments_chk check (max_comments >= 0);
  end if;
end $$;

-- ── reviews / suggestions (metrics, populated later) ─────────────────────────
create table if not exists reviews (
  id                uuid        primary key default gen_random_uuid(),
  repo              text        not null,
  pr_number         int         not null,
  commit_sha        text,
  model             text,
  conventions_used  int         not null default 0,
  suggestions_count int         not null default 0,
  latency_ms        int,
  status            text        not null default 'completed'
                      check (status in ('completed', 'failed', 'skipped')),
  created_at        timestamptz not null default now()
);

create index if not exists reviews_repo_idx on reviews (repo);

create table if not exists suggestions (
  id            uuid        primary key default gen_random_uuid(),
  review_id     uuid        not null references reviews (id) on delete cascade,
  convention_id text        references conventions (id) on delete set null,
  path          text        not null,
  line          int,
  body          text        not null,
  accepted      boolean,
  created_at    timestamptz not null default now()
);

create index if not exists suggestions_review_idx on suggestions (review_id);
