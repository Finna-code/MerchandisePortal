"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/toast";

import { ReviewForm } from "./ReviewForm";
import { ReviewList } from "./ReviewList";
import { Stars } from "./Stars";
import type { ReviewDto, ReviewSummary } from "./types";

const DEFAULT_SORT: SortOption = "helpful";

type SortOption = "helpful" | "recent";

type ProductReviewsProps = {
  productId: number;
  initialSummary: ReviewSummary;
  viewerId: number | null;
  viewerIsAdmin: boolean;
};

export function ProductReviews({ productId, initialSummary, viewerId, viewerIsAdmin }: ProductReviewsProps) {
  const { toast } = useToast();
  const [summary, setSummary] = useState<ReviewSummary>(initialSummary);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [viewerReview, setViewerReview] = useState<ReviewDto | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const average = useMemo(() => {
    if (summary.ratingCount <= 0) return 0;
    return Math.round((summary.ratingSum / summary.ratingCount) * 10) / 10;
  }, [summary]);

  const fetchReviews = useCallback(
    async ({ cursor, replace }: { cursor?: string | null; replace?: boolean } = {}) => {
      const isLoadMore = Boolean(cursor);
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "20", sort });
        if (cursor) params.set("cursor", cursor);
        const res = await fetch(`/api/products/${productId}/reviews?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (res.status === 404) {
            setError("Product not found.");
          } else {
            setError("Unable to load reviews right now.");
          }
          return;
        }

        const payload = (await res.json()) as {
          reviews: ReviewDto[];
          nextCursor: string | null;
          viewerReview: ReviewDto | null;
        };

        setViewerReview(payload.viewerReview);
        setNextCursor(payload.nextCursor);
        setReviews((prev) => {
          if (replace || !isLoadMore) {
            return payload.reviews;
          }
          const existingIds = new Set(prev.map((entry) => entry.id));
          const merged = [...prev];
          for (const entry of payload.reviews) {
            if (!existingIds.has(entry.id)) merged.push(entry);
          }
          return merged;
        });
      } catch (err) {
        console.error("fetch reviews", err);
        setError("Unable to load reviews. Please try again later.");
      } finally {
        if (isLoadMore) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [productId, sort],
  );

  useEffect(() => {
    fetchReviews({ replace: true });
  }, [fetchReviews]);

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    setReviews([]);
    setNextCursor(null);
  };

  const handleCreateOrUpdate = (review: ReviewDto, mode: "create" | "update", previous?: ReviewDto | null) => {
    setFormOpen(false);
    setViewerReview(review);
    if (mode === "create" && review.visibility === "public") {
      setSummary((prev) => ({
        ratingCount: prev.ratingCount + 1,
        ratingSum: prev.ratingSum + review.rating,
      }));
    }
    if (mode === "update" && previous && previous.visibility === "public" && review.visibility === "public") {
      const ratingDelta = review.rating - previous.rating;
      if (ratingDelta !== 0) {
        setSummary((prev) => ({
          ratingCount: prev.ratingCount,
          ratingSum: prev.ratingSum + ratingDelta,
        }));
      }
    }
    setReviews((prev) => {
      const exists = prev.some((entry) => entry.id === review.id);
      if (!exists) {
        return [review, ...prev];
      }
      return prev.map((entry) => (entry.id === review.id ? review : entry));
    });
    fetchReviews({ replace: true });
  };

  const handleModerate = async (review: ReviewDto, visibility: "public" | "hidden") => {
    try {
      const endpoint = `/api/admin/reviews/${review.id}/${visibility === "hidden" ? "hide" : "restore"}`;
      const res = await fetch(endpoint, { method: "POST", credentials: "include" });
      if (!res.ok) {
        const payload = await safeParse(res);
        toast({
          variant: "destructive",
          title: payload?.message ?? "Unable to update visibility",
        });
        return;
      }
      const payload = (await res.json()) as { review: ReviewDto };
      setReviews((prev) => prev.map((entry) => (entry.id === review.id ? payload.review : entry)));
      if (viewerReview?.id === review.id) {
        setViewerReview(payload.review);
      }
      if (review.visibility === "public" && payload.review.visibility === "hidden") {
        setSummary((prev) => ({
          ratingCount: Math.max(0, prev.ratingCount - 1),
          ratingSum: prev.ratingSum - review.rating,
        }));
      }
      if (review.visibility === "hidden" && payload.review.visibility === "public") {
        setSummary((prev) => ({
          ratingCount: prev.ratingCount + 1,
          ratingSum: prev.ratingSum + payload.review.rating,
        }));
      }
      toast({ variant: "success", title: payload.review.visibility === "public" ? "Review restored" : "Review hidden" });
    } catch (error) {
      console.error("moderate review", error);
      toast({ variant: "destructive", title: "Unable to update review visibility" });
    }
  };

  const handleLoadMore = async () => {
    if (!nextCursor) return;
    await fetchReviews({ cursor: nextCursor });
  };

  const handleDeleteFromList = async (review: ReviewDto) => {
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 204) {
        if (review.visibility === "public") {
          setSummary((prev) => ({
            ratingCount: Math.max(0, prev.ratingCount - 1),
            ratingSum: prev.ratingSum - review.rating,
          }));
        }
        setReviews((prev) => prev.filter((entry) => entry.id !== review.id));
        if (viewerReview?.id === review.id) {
          setViewerReview(null);
        }
        toast({ variant: "success", title: "Review deleted" });
        void fetchReviews({ replace: true });
        return;
      }
      const payload = await safeParse(res);
      toast({ variant: "destructive", title: payload?.message ?? "Unable to delete review" });
    } catch (error) {
      console.error("delete review", error);
      toast({ variant: "destructive", title: "Unable to delete review" });
    }
  };

  return (
    <section className="mt-10 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Customer feedback</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Stars value={average} size="sm" />
            <span className="font-medium text-foreground">{average.toFixed(1)}</span>
            <span>Based on {summary.ratingCount} review{summary.ratingCount === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      <ReviewForm
        productId={productId}
        viewerId={viewerId}
        viewerReview={viewerReview}
        isOpen={formOpen}
        onOpenChange={setFormOpen}
        onSubmitSuccess={handleCreateOrUpdate}
        onDeleteSuccess={(review) => {
          if (review.visibility === "public") {
            setSummary((prev) => ({
              ratingCount: Math.max(0, prev.ratingCount - 1),
              ratingSum: prev.ratingSum - review.rating,
            }));
          }
          setViewerReview(null);
          setReviews((prev) => prev.filter((entry) => entry.id !== review.id));
          void fetchReviews({ replace: true });
        }}
      />

      <ReviewList
        reviews={reviews}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={Boolean(nextCursor)}
        sort={sort}
        onSortChange={handleSortChange}
        onLoadMore={handleLoadMore}
        onRequestEdit={() => setFormOpen(true)}
        onDelete={handleDeleteFromList}
        onModerate={handleModerate}
        viewerIsAdmin={viewerIsAdmin}
        error={error}
      />
    </section>
  );
}

async function safeParse(res: Response) {
  try {
    return (await res.json()) as { error?: string; message?: string };
  } catch {
    return null;
  }
}

