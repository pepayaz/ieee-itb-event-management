import Link from "next/link";
import { Suspense } from "react";

import { EventCard } from "@/components/EventCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { prisma } from "@/lib/prisma";

// Tanpa ini Next.js mem-prerender halaman saat build, sehingga event yang
// dibuat admin tidak pernah muncul sampai deploy berikutnya.
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            IEEE ITB Student Branch Events
          </h1>
          <p className="text-sm text-gray-600">
            Upcoming and past events, open to everyone.
          </p>
        </div>
        <Link
          href="/admin/login"
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          Admin login
        </Link>
      </header>

      {/* Suspense dipakai di sini, bukan loading.tsx: loading.tsx di root
          juga membungkus /events/[id], dan boundary itu membuat response
          ter-stream dengan status 200 sebelum notFound() sempat berjalan. */}
      <Suspense fallback={<LoadingState message="Loading events..." />}>
        <PublishedEventList />
      </Suspense>
    </main>
  );
}

async function PublishedEventList() {
  let events;

  try {
    events = await prisma.event.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { date: "asc" },
    });
  } catch (error) {
    console.error("Failed to load published events:", error);

    return (
      <ErrorState message="We could not load the events. Please try again later." />
    );
  }

  if (events.length === 0) {
    return <EmptyState message="No published events yet. Check back soon." />;
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={event.id}>
          <EventCard event={event} />
        </li>
      ))}
    </ul>
  );
}
