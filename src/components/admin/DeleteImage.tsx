"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export default function DeleteImage({
  imageUrl,
  onDeleted,
  editMode,
}: {
  imageUrl: string | null | undefined;
  onDeleted: () => void;
  editMode: boolean; // controls visibility
}) {
  const [busy, setBusy] = useState(false);
  const hasImage = Boolean(imageUrl);

  if (!editMode || !hasImage) return null;

  async function handleDelete() {
    setBusy(true);
    try {
      const r = await fetch("/api/upload/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl }),
      });
      if (!r.ok) throw new Error("delete failed");
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" className="gap-2" disabled={busy}>
          <Trash2 className="h-4 w-4" />
          {busy ? "Deleting..." : "Delete image"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete image?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure? You can’t undelete an image!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
