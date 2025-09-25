"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface State {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams?.get("token") ?? null, [searchParams]);
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", message: "Verification token is missing." });
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function verify() {
      setState({ status: "loading" });
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });

        if (cancelled) return;

        if (res.ok) {
          setState({ status: "success", message: "Email verified. Redirecting to sign in..." });
          setTimeout(() => {
            router.replace("/signin?verified=1");
          }, 1800);
          return;
        }

        const data = await res.json().catch(() => ({}));
        const message = data?.error ?? "Verification link is no longer valid.";
        setState({ status: "error", message });
      } catch (error) {
        if (cancelled) return;
        setState({ status: "error", message: error instanceof Error ? error.message : "Something went wrong." });
      }
    }

    verify();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [router, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
          <CardDescription>We&apos;re confirming your email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.status === "loading" && <p className="text-sm text-muted-foreground">Verifying your account...</p>}
          {state.status === "success" && (
            <p className="text-sm text-emerald-600">{state.message}</p>
          )}
          {state.status === "error" && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </div>
          )}
          {state.status === "error" && (
            <div className="space-y-2">
              <Button asChild variant="outline">
                <Link href="/signin">Back to sign in</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Need a new link? Request another by trying to sign in again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

