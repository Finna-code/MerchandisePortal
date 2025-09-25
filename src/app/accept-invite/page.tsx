"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(120, { message: "Name is too long." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
      message: "Password must include at least one letter and one number.",
    }),
});

type FormValues = z.infer<typeof schema>;

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get("token") ?? null, [searchParams]);
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) return;
    setServerError(null);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data?.error ?? "Unable to accept invite. Try again.";
        if (res.status === 429) {
          setServerError("Too many attempts. Please wait a moment and try again.");
        } else {
          setServerError(message);
        }
        return;
      }

      toast({
        title: "Invite accepted",
        description: "You can now sign in with your new credentials.",
      });
      router.replace("/signin?invited=1");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unexpected error occurred.");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept your invite</CardTitle>
          <CardDescription>
            Set your name and password to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!token && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Invite token missing. Please use the link from your email.
            </div>
          )}
          {serverError && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} disabled={isSubmitting || !token} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 8 characters" {...field} disabled={isSubmitting || !token} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
                {isSubmitting ? "Setting password..." : "Activate account"}
              </Button>
            </form>
          </Form>
          <p className="text-sm text-muted-foreground">
            Already verified? <Link href="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">Loading...</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}

