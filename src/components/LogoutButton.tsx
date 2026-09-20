"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      // Cache router masih menyimpan halaman yang dirender saat sesi aktif.
      // Tanpa refresh, kembali ke dashboard bisa menampilkan versi lama.
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
    >
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
