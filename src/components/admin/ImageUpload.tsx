"use client";
import { useRef, useState } from "react";
import { compressImageToWebP } from "@/lib/image-compress";
import { Button } from "@/components/ui/button";

export default function ImageUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(f: File) {
    setBusy(true);
    setErr(null);
    try {
      // Basic client-side validations
      if (!f.type.startsWith("image/")) throw new Error("Please select an image file");
      const MAX = 5 * 1024 * 1024; // 5MB
      if (f.size > MAX) throw new Error("Image is too large (max 5MB)");
      // Compress before upload
      const compressed = await compressImageToWebP(f, {
        maxWidth: 1600,
        maxHeight: 1600,
        targetKB: 300,
        minQuality: 0.5,
      });
      const fd = new FormData();
      // Preserve extension as .webp for clarity
      const webpFile = new File(
        [compressed],
        (f.name.replace(/\.[^.]+$/, "") || "image") + ".webp",
        { type: "image/webp" }
      );
      fd.append("file", webpFile);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Upload failed");
      onUploaded(j.url as string);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-9 shrink-0 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm focus-visible:shadow-sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading..." : "Upload image"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}

