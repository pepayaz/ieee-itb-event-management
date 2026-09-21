"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Card, FormField, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    try {
      const result = await apiFetch<{ username: string }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      router.push("/admin/dashboard");
      // Dashboard adalah Server Component; tanpa refresh, router dapat
      // menyajikan versi yang dirender sebelum cookie sesi ada.
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ieee-light via-white to-gray-100 px-4 py-12">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ieee">
          IEEE ITB Student Branch
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">Admin sign in</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Use your administrator account to manage events.
        </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5" noValidate>
        <FormField id="username" label="Username">
          <Input
            id="username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </FormField>

        <FormField id="password" label="Password">
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </FormField>

        {error ? (
          <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      </Card>
    </main>
  );
}
