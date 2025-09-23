import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "no file" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "not an image" }, { status: 415 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "file too large" }, { status: 413 });
    }

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const key = `products/${crypto.randomUUID()}-${safeName}`;

    const blob = await put(key, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch {
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }
}
