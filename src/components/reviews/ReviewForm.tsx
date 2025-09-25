"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

import { Stars } from "./Stars";
import type { ReviewDto } from "./types";

type ReviewFormProps = {
  productId: number;
  viewerId: number | null;
  viewerReview: ReviewDto | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitSuccess: (review: ReviewDto, mode: "create" | "update", previous?: ReviewDto | null) => void;
  onDeleteSuccess: (review: ReviewDto) => void;
};

export function ReviewForm({
  productId,
  viewerId,
  viewerReview,
  isOpen,
  onOpenChange,
  onSubmitSuccess,
  onDeleteSuccess,
}: ReviewFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [rating, setRating] = useState<number>(viewerReview?.rating ?? 0);
  const [body, setBody] = useState<string>(viewerReview?.body ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (viewerReview) {
      setRating(viewerReview.rating);
      setBody(viewerReview.body);
    } else {
      setRating(0);
      setBody("");
    }
  }, [viewerReview]);

  const mode: "create" | "update" = viewerReview ? "update" : "create";
  const editable = viewerReview ? viewerReview.visibility === "public" : true;
  const remaining = 1_000 - body.length;

  const heading = viewerReview ? "Edit your review" : "Write a review";
  const actionLabel = viewerReview ? "Update review" : "Submit review";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!viewerId) {
      toast({
        variant: "invert",
        title: "Sign in required",
        description: "Please sign in to leave a review.",
      });
      router.push("/signin");
      return;
    }

    if (!editable) {
      toast({
        variant: "invert",
        title: "Cannot edit",
        description: "Hidden reviews cannot be edited.",
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      toast({
        variant: "invert",
        title: "Select a rating",
        description: "Choose a rating between 1 and 5 stars.",
      });
      return;
    }

    const trimmed = body.trim();
    if (trimmed.length === 0) {
      toast({
        variant: "invert",
        title: "Review is empty",
        description: "Share a few words about the product.",
      });
      return;
    }
    if (trimmed.length > 1_000) {
      toast({
        variant: "invert",
        title: "Review too long",
        description: "Reviews can be up to 1,000 characters.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = viewerReview
        ? `/api/reviews/${viewerReview.id}`
        : `/api/products/${productId}/reviews`;
      const method = viewerReview ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, body: trimmed }),
      });

      if (!res.ok) {
        const payload = await safeParse(res);
        if (res.status === 401) {
          toast({ variant: "invert", title: "Sign in required", description: "Please sign in to continue." });
          router.push("/signin");
          return;
        }
        if (res.status === 403) {
          toast({ variant: "destructive", title: "Forbidden", description: payload?.message ?? "You cannot update this review." });
          return;
        }
        if (res.status === 409) {
          toast({ variant: "invert", title: "Review already exists", description: payload?.message ?? "You have already reviewed this product." });
          return;
        }
        if (res.status === 422) {
          toast({ variant: "invert", title: "Invalid review", description: payload?.message ?? "Please check your review and try again." });
          return;
        }
        toast({ variant: "destructive", title: "Something went wrong", description: "We couldn't save your review." });
        return;
      }

      const payload = (await res.json()) as { review: ReviewDto };
      onSubmitSuccess(payload.review, mode, viewerReview);
      toast({
        variant: "success",
        title: mode === "create" ? "Review published" : "Review updated",
        description: mode === "create" ? "Thanks for sharing your feedback!" : "Your review has been updated.",
      });
    } catch (error) {
      console.error("submit review", error);
      toast({ variant: "destructive", title: "Network error", description: "Unable to save your review." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!viewerReview) return;
    const confirmed = window.confirm("Delete this review? This action cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/reviews/${viewerReview.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 204) {
        onDeleteSuccess(viewerReview);
        toast({ variant: "success", title: "Review removed", description: "Your review has been deleted." });
        onOpenChange(false);
        return;
      }

      const payload = await safeParse(res);
      if (res.status === 401) {
        toast({ variant: "invert", title: "Sign in required", description: "Please sign in to continue." });
        router.push("/signin");
        return;
      }
      if (res.status === 403) {
        toast({ variant: "invert", title: "Forbidden", description: payload?.message ?? "You cannot delete this review." });
        return;
      }
      if (res.status === 404) {
        toast({ variant: "invert", title: "Not found", description: "Review not found or already removed." });
        return;
      }
      toast({ variant: "destructive", title: "Unable to delete", description: "Please try again later." });
    } catch (error) {
      console.error("delete review", error);
      toast({ variant: "destructive", title: "Network error", description: "Unable to delete your review." });
    } finally {
      setDeleting(false);
    }
  };

  const buttonLabel = viewerReview ? "Edit your review" : "Write a review";

  return (
    <div className="border rounded-lg p-4 bg-card text-card-foreground">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{heading}</h3>
          <p className="text-sm text-muted-foreground">
            {viewerReview ? "Update what you shared previously." : "Tell others what you liked or what could be better."}
          </p>
        </div>
        {viewerId ? (
          <Button type="button" variant={isOpen ? "secondary" : "default"} onClick={() => onOpenChange(!isOpen)}>
            {viewerReview ? <Pencil className="mr-2 size-4" /> : <Plus className="mr-2 size-4" />}
            {buttonLabel}
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/signin">Sign in to review</Link>
          </Button>
        )}
      </div>

      {isOpen && viewerId && (
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {!editable && (
            <div className="rounded border border-dashed border-yellow-500/50 bg-yellow-100/40 px-3 py-2 text-sm text-yellow-700">
              This review is hidden by an administrator. You can delete it or wait for it to be restored.
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground">Your rating</label>
            <Stars value={rating} onChange={editable ? setRating : undefined} disabled={!editable || submitting} size="lg" className="mt-1" />
          </div>
          <div>
            <label htmlFor="review-body" className="text-sm font-medium text-foreground">
              Share your thoughts
            </label>
            <textarea
              id="review-body"
              className={cn(
                "mt-2 h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                !editable && "opacity-70"
              )}
              maxLength={1_000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={!editable || submitting}
              placeholder="What did you enjoy? What could be better?"
            />
            <div className="mt-1 text-xs text-muted-foreground">{remaining} characters left</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitting || !editable}>
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {actionLabel}
            </Button>
            {viewerReview && (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}Delete
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

async function safeParse(res: Response) {
  try {
    return (await res.json()) as { error?: string; message?: string };
  } catch {
    return null;
  }
}

