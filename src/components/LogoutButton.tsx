"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
      // Cache router masih menyimpan halaman yang dirender saat sesi aktif.
      // Tanpa refresh, kembali ke dashboard bisa menampilkan versi lama.
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      variant="secondary"
      size="sm"
    >
      {isPending ? "Logging out..." : "Log out"}
    </Button>
  );
}
