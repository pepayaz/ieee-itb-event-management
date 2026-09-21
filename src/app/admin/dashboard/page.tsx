import Link from "next/link";
import type { EventStatus } from "@prisma/client";

import { DeleteEventButton } from "@/components/DeleteEventButton";
import {
  EventSearchBar,
  PaginationControls,
  StatusFilterTabs,
  TimeframeTabs,
} from "@/components/EventFilters";
import { LogoutButton } from "@/components/LogoutButton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { listAllEvents, type EventTimeframe } from "@/lib/events";
import { formatEventDate } from "@/lib/format";
import { EVENT_STATUSES } from "@/lib/validation";

// Sama seperti halaman publik: tanpa ini Next.js mem-prerender dashboard
// saat build, sehingga event yang baru dibuat tidak muncul.
export const dynamic = "force-dynamic";

type AdminDashboardProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardProps) {
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

  const statusParam =
    typeof params.status === "string" ? params.status : undefined;
  const status: EventStatus | undefined =
    statusParam &&
    statusParam !== "ALL" &&
    EVENT_STATUSES.includes(statusParam as EventStatus)
      ? (statusParam as EventStatus)
      : undefined;

  const rawPage =
    typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  let result;

  try {
    result = await listAllEvents({
      search,
      timeframe,
      status,
      page,
      pageSize: 15,
    });
  } catch (error) {
    console.error("Failed to load events for the dashboard:", error);

    return (
      <Shell>
        <ErrorState message="We could not load the events. Please try again later." />
      </Shell>
    );
  }

  const isFiltered = Boolean(
    search || (timeframe && timeframe !== "all") || (statusParam && statusParam !== "ALL"),
  );

  return (
    <Shell>
      <section className="mb-6 flex flex-col gap-3">
        <EventSearchBar
          basePath="/admin/dashboard"
          search={search}
          timeframe={timeframe}
          status={statusParam ?? "ALL"}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TimeframeTabs
            basePath="/admin/dashboard"
            selected={timeframe}
            search={search}
            status={statusParam ?? "ALL"}
          />
          <StatusFilterTabs
            basePath="/admin/dashboard"
            selected={statusParam ?? "ALL"}
            search={search}
            timeframe={timeframe}
          />
        </div>
      </section>

      {result.events.length === 0 ? (
        <EmptyState
          message={
            isFiltered
              ? "No events match your filter. Try adjusting your search or filters."
              : "No events yet. Create your first event to get started."
          }
        />
      ) : (
        <div>
          {/* Tabel tidak dapat dipersempit tanpa merusak keterbacaan, jadi pada
              layar sempit ia digeser mendatar, bukan dimampatkan. */}
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Location</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {event.title}
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {formatEventDate(event.date)}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{event.location}</td>
                    <td className="px-3 py-2 text-gray-700">{event.status}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="text-gray-700 underline hover:text-gray-900"
                        >
                          Edit
                        </Link>
                        <DeleteEventButton
                          eventId={event.id}
                          eventTitle={event.title}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            basePath="/admin/dashboard"
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
            search={search}
            timeframe={timeframe}
            status={statusParam ?? "ALL"}
          />
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Event dashboard</h1>
          <p className="text-sm text-gray-600">
            All events, including drafts, newest first.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            View public site
          </Link>
          <Link
            href="/admin/events/new"
            className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            New event
          </Link>
          <LogoutButton />
        </div>
      </header>
      {children}
    </main>
  );
}
