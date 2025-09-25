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

const schema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
        message: "Password must include at least one letter and one number.",
      }),
    confirmPassword: z.string().min(1, { message: "Confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get("token") ?? null, [searchParams]);
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) return;
    setServerError(null);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data?.error ?? "Unable to reset password. Try again.";
        if (res.status === 429) {
          setServerError("Too many attempts. Please wait a moment and try again.");
        } else {
          setServerError(message);
        }
        return;
      }

      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      router.replace("/signin?reset=1");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Unexpected error occurred.");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Choose a new password to regain access to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!token && (
            <div className="space-y-3">
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Reset token missing. Use the link sent to your email or request a new one.
              </div>
              <Button asChild variant="outline">
                <Link href="/reset/request">Request a new reset link</Link>
              </Button>
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 8 characters" {...field} disabled={isSubmitting || !token} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Repeat your password" {...field} disabled={isSubmitting || !token} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
                {isSubmitting ? "Resetting..." : "Update password"}
              </Button>
            </form>
          </Form>
          <p className="text-sm text-muted-foreground">
            Remembered your password? <Link href="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

