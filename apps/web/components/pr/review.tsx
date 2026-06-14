import Link from "next/link";
import { GlassPanel, StatusPill, cn, focusRing, type Status } from "@/components/primitives";
import { ExternalLinkIcon } from "@/components/icons";
import type {
  DiffFile,
  PrDetail,
  PrStatus,
  PrSummary,
  ReviewCommentData,
  Severity,
  Source,
} from "@/lib/mock";
import { CommentActions } from "./CommentActions";

const SOURCE_LABEL: Record<Source, string> = {
  pr_comment: "PR comment",
  contributing: "CONTRIBUTING.md",
  styleguide: "docs/STYLE.md",
};

const SEVERITY_DOT: Record<Severity, string> = {
  high: "bg-danger",
  medium: "bg-warning",
  low: "bg-muted",
};

function PrStatusPill({ status, commentCount }: { status: PrStatus; commentCount: number }) {
  const map: Record<PrStatus, { status: Status; label: string; pulse?: boolean }> = {
    reviewed: { status: "success", label: `Reviewed · ${commentCount}` },
    silent: { status: "info", label: "Silent · clean" },
    reviewing: { status: "neutral", label: "Reviewing…", pulse: true },
  };
  const m = map[status];
  return (
    <StatusPill status={m.status} pulse={m.pulse}>
      {m.label}
    </StatusPill>
  );
}

/** Dense left-pane PR queue. Selecting a row is a navigation (RSC re-render). */
export function PrQueue({ items, selectedId }: { items: PrSummary[]; selectedId: string }) {
  return (
    <nav aria-label="Pull requests" className="flex flex-col">
      {items.map((pr) => {
        const active = pr.id === selectedId;
        return (
          <Link
            key={pr.id}
            href={`/pr?pr=${pr.id}`}
            aria-current={active ? "true" : undefined}
            className={cn(
              "flex flex-col gap-1.5 border-b border-l-2 border-subtle px-3 py-3 transition-colors",
              focusRing,
              active ? "border-l-accent-violet bg-elevated" : "border-l-transparent hover:bg-elevated",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-fg">{pr.title}</span>
              <span className="shrink-0 text-xs text-muted">#{pr.number}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <PrStatusPill status={pr.status} commentCount={pr.commentCount} />
              <span className="shrink-0 text-xs text-muted">
                {pr.author} · {pr.updatedAt}
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function Diff({ files }: { files: DiffFile[] }) {
  return (
    <div className="flex flex-col gap-3">
      {files.map((file) => (
        <div key={file.path} className="overflow-hidden rounded-md border border-subtle">
          <div className="border-b border-subtle bg-elevated px-3 py-1.5 font-mono text-xs text-muted">
            {file.path}
          </div>
          <div className="overflow-x-auto bg-surface py-1 text-xs leading-5">
            {file.patch.split("\n").map((line, i) => {
              const add = line.startsWith("+") && !line.startsWith("+++");
              const del = line.startsWith("-") && !line.startsWith("---");
              const hunk = line.startsWith("@@");
              return (
                <code
                  key={i}
                  className={cn(
                    "block whitespace-pre px-3 font-mono",
                    add && "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-fg",
                    del && "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-muted",
                    hunk && "text-accent-blue",
                    !add && !del && !hunk && "text-muted",
                  )}
                >
                  {line || " "}
                </code>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProvenanceChip({ comment }: { comment: ReviewCommentData }) {
  const inner = (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-elevated px-2 py-0.5 text-xs text-muted">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
      {SOURCE_LABEL[comment.source]}
      {comment.sourceUrl ? <ExternalLinkIcon size={11} /> : null}
    </span>
  );
  if (!comment.sourceUrl) return inner;
  return (
    <a
      href={comment.sourceUrl}
      target="_blank"
      rel="noreferrer"
      title={`Source: ${comment.conventionLabel}`}
      className={cn("inline-flex rounded-full", focusRing)}
    >
      {inner}
    </a>
  );
}

function ReviewComment({ comment }: { comment: ReviewCommentData }) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-subtle bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted">
          {comment.path}:{comment.line}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted">
          <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", SEVERITY_DOT[comment.severity])} />
          {comment.severity} · {Math.round(comment.confidence * 100)}%
        </span>
      </div>
      <p className="text-sm text-fg">{comment.message}</p>
      <p className="text-xs text-muted">
        <span className="text-faint">Convention:</span> {comment.conventionLabel}
      </p>
      <div className="flex items-center justify-between gap-2">
        <ProvenanceChip comment={comment} />
        <CommentActions commentId={comment.id} />
      </div>
    </div>
  );
}

/** Right-pane detail: header + diff + the single deduped review. */
export function PrDetailView({ detail }: { detail: PrDetail }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-fg">{detail.title}</h2>
          <span className="text-sm text-muted">#{detail.number}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="font-mono">{detail.branch}</span>
          <span aria-hidden="true">·</span>
          <span>{detail.repo}</span>
          <PrStatusPill status={detail.status} commentCount={detail.comments.length} />
        </div>
      </header>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-fg">Diff</h3>
        {detail.files.length === 0 ? (
          <GlassPanel className="text-sm text-muted">No file diff loaded for this PR yet.</GlassPanel>
        ) : (
          <Diff files={detail.files} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Review</h3>
          <span className="text-xs text-muted">
            1 review · {detail.comments.length} comment{detail.comments.length === 1 ? "" : "s"} · deduped
          </span>
        </div>
        {detail.comments.length === 0 ? (
          <GlassPanel className="text-sm text-muted">Silent — nothing here violated a convention.</GlassPanel>
        ) : (
          <div className="flex flex-col gap-3">
            {detail.comments.map((c) => (
              <ReviewComment key={c.id} comment={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
