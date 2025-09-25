export function blobPathFromUrl(url: string) {
  const u = new URL(url);
  return u.pathname.replace(/^\//, "");
}

