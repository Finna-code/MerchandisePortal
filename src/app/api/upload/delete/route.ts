import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { blobPathFromUrl } from "@/lib/blob";

export async function POST(req: Request) {
  const { url, path } = await req.json();
  const target = path ?? (url ? blobPathFromUrl(url) : "");
  if (!target) return NextResponse.json({ error: "missing path/url" }, { status: 400 });

  await del(target, { token: process.env.BLOB_READ_WRITE_TOKEN });
  return NextResponse.json({ ok: true });
}

