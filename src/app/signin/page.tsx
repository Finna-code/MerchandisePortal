"use client";
import { signIn } from "next-auth/react";
export default function SignIn() {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await signIn("credentials", {
      email: f.get("email"),
      password: f.get("password"),
      callbackUrl: "/",
    });
  }
  return (
    <main className="mx-auto max-w-sm p-6 space-y-3">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-2">
        <input name="email" type="email" placeholder="email" className="border p-2 w-full" />
        <input name="password" type="password" placeholder="password" className="border p-2 w-full" />
        <button className="border px-3 py-2 w-full">Sign in</button>
      </form>
    </main>
  );
}
