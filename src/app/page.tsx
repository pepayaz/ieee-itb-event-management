import Link from "next/link";
import { Suspense } from "react";

import { EventCard } from "@/components/EventCard";
import {
  EventSearchBar,
  PaginationControls,
  TimeframeTabs,
} from "@/components/EventFilters";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateViews";
import { listPublishedEvents, type EventTimeframe } from "@/lib/events";

// Tanpa ini Next.js mem-prerender halaman saat build, sehingga event yang
// dibuat admin tidak pernah muncul sampai deploy berikutnya.
export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const search =
    typeof params.search === "string" ? params.search.trim() : undefined;
  const timeframeParam =
    typeof params.timeframe === "string" ? params.timeframe : undefined;
  const timeframe: EventTimeframe =
    timeframeParam === "upcoming" ||
    timeframeParam === "past" ||
    timeframeParam === "all"
      ? timeframeParam
      : "all";

  const rawPage =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

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

      <section className="mb-6 flex flex-col gap-3">
        <EventSearchBar
          basePath="/"
          search={search}
          timeframe={timeframe}
        />
        <TimeframeTabs
          basePath="/"
          selected={timeframe}
          search={search}
        />
      </section>

      {/* Suspense dipakai di sini, bukan loading.tsx: loading.tsx di root
          juga membungkus /events/[id], dan boundary itu membuat response
          ter-stream dengan status 200 sebelum notFound() sempat berjalan. */}
      <Suspense fallback={<LoadingState message="Loading events..." />}>
        <PublishedEventList search={search} timeframe={timeframe} page={page} />
      </Suspense>
    </main>
  );
}

async function PublishedEventList({
  search,
  timeframe,
  page,
}: {
  search?: string;
  timeframe: EventTimeframe;
  page: number;
}) {
  let result;

  try {
    result = await listPublishedEvents({
      search,
      timeframe,
      page,
      pageSize: 9,
    });
  } catch (error) {
    console.error("Failed to load published events:", error);

    return (
      <ErrorState message="We could not load the events. Please try again later." />
    );
  }

  if (result.events.length === 0) {
    const isFiltered = Boolean(search || (timeframe && timeframe !== "all"));

    return (
      <EmptyState
        message={
          isFiltered
            ? "No published events match your filter. Try adjusting your search."
            : "No published events yet. Check back soon."
        }
      />
    );
  }

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {result.events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>

      <PaginationControls
        basePath="/"
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        search={search}
        timeframe={timeframe}
      />
    </div>
  );
}
