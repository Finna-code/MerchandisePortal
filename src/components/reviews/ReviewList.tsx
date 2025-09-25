"use client";

import { useMemo, useState } from "react";
import { Loader2, MessageSquare, Pencil, ShieldCheck, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";

import { Stars } from "./Stars";
import type { ReviewDto } from "./types";

type SortOption = "helpful" | "recent";

type ReviewListProps = {
  reviews: ReviewDto[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onLoadMore: () => Promise<void> | void;
  onRequestEdit: () => void;
  onDelete: (review: ReviewDto) => Promise<void>;
  onModerate: (review: ReviewDto, visibility: "public" | "hidden") => Promise<void>;
  viewerIsAdmin: boolean;
  error?: string | null;
};

export function ReviewList({
  reviews,
  loading,
  loadingMore,
  hasMore,
  sort,
  onSortChange,
  onLoadMore,
  onRequestEdit,
  onDelete,
  onModerate,
  viewerIsAdmin,
  error,
}: ReviewListProps) {
  const [pending, setPending] = useState<Record<number, "delete" | "moderate">>({});

  const sortedLabel = useMemo(() => (sort === "helpful" ? "Most helpful" : "Most recent"), [sort]);

  const handleDelete = async (review: ReviewDto) => {
    setPending((prev) => ({ ...prev, [review.id]: "delete" }));
    try {
      await onDelete(review);
    } finally {
      setPending((prev) => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
    }
  };

  const handleModerate = async (review: ReviewDto, visibility: "public" | "hidden") => {
    setPending((prev) => ({ ...prev, [review.id]: "moderate" }));
    try {
      await onModerate(review, visibility);
    } finally {
      setPending((prev) => {
        const next = { ...prev };
        delete next[review.id];
        return next;
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold">Reviews</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by</span>
          <Select
            value={sort}
            onValueChange={(value) => onSortChange(value as SortOption)}
            className="w-40 text-sm"
            placeholder={sortedLabel}
          >
            <SelectItem value="helpful">Most helpful</SelectItem>
            <SelectItem value="recent">Most recent</SelectItem>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-muted px-4 py-6 text-muted-foreground">
          <MessageSquare className="size-5" />
          <div className="text-sm">No reviews yet. Be the first to review.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const isOwner = review.isOwner;
            const isHidden = review.visibility === "hidden";
            const isPendingDelete = pending[review.id] === "delete";
            const isPendingModerate = pending[review.id] === "moderate";
            return (
              <article key={review.id} className="rounded-lg border px-4 py-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Stars value={review.rating} size="sm" />
                      <span className="text-sm font-medium text-foreground">{review.author.name}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                      {isHidden && <Badge variant="outline">Hidden</Badge>}
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-foreground">{review.body}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {isOwner && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onRequestEdit}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="mr-1 size-4" /> Edit
                      </Button>
                    )}
                    {isOwner && review.canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(review)}
                        disabled={isPendingDelete}
                      >
                        {isPendingDelete ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Trash2 className="mr-1 size-4" />}
                        Delete
                      </Button>
                    )}
                    {viewerIsAdmin && review.canModerate && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleModerate(review, isHidden ? "public" : "hidden")}
                        disabled={isPendingModerate}
                      >
                        {isPendingModerate ? (
                          <Loader2 className="mr-1 size-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="mr-1 size-4" />
                        )}
                        {isHidden ? "Restore" : "Hide"}
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {hasMore && !loading && (
        <Button type="button" variant="outline" onClick={async () => { await onLoadMore(); }} disabled={loadingMore}>
          {loadingMore ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Load more
        </Button>
      )}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}





