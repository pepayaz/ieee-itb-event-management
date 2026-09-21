import Link from "next/link";
import type { EventStatus } from "@prisma/client";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { DeleteEventButton } from "@/components/DeleteEventButton";
import {
  EventSearchBar,
  PaginationControls,
  StatusFilterTabs,
  TimeframeTabs,
} from "@/components/EventFilters";
import { LogoutButton } from "@/components/LogoutButton";
import { EmptyState, ErrorState } from "@/components/StateViews";
import { Badge, Card, PageHeader, buttonStyles } from "@/components/ui";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";
import { listAllEvents, type EventTimeframe } from "@/lib/events";
import { formatEventDate } from "@/lib/format";
import { EVENT_STATUSES } from "@/lib/validation";

// Sama seperti halaman publik: tanpa ini Next.js mem-prerender dashboard
// saat build, sehingga event yang baru dibuat tidak muncul.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Event dashboard",
  description: "Manage IEEE ITB Student Branch events.",
};

type AdminDashboardProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardProps) {
  const params = await searchParams;
  const sessionToken = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = sessionToken ? await verifyToken(sessionToken) : null;
  const username = session?.username ?? "Administrator";
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
      <Shell username={username}>
        <ErrorState message="We could not load the events. Please try again later." />
      </Shell>
    );
  }

  const isFiltered = Boolean(
    search || (timeframe && timeframe !== "all") || (statusParam && statusParam !== "ALL"),
  );

  return (
    <Shell username={username}>
      <section aria-label="Event filters" className="mb-8 flex flex-col gap-4 rounded-card border border-gray-200 bg-white p-4 shadow-card sm:p-5">
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
          <div className="grid gap-4 md:hidden">
            {result.events.map((event) => (
              <Card key={event.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold leading-snug text-gray-950">{event.title}</h2>
                  <Badge status={event.status} />
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="font-semibold text-gray-500">Date</dt>
                    <dd className="mt-0.5 text-gray-800">{formatEventDate(event.date)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-500">Location</dt>
                    <dd className="mt-0.5 text-gray-800">{event.location}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className={buttonStyles({ variant: "secondary", size: "sm" })}
                  >
                    Edit
                  </Link>
                  <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                </div>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-card border border-gray-200 bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-gray-100 transition-colors last:border-0 hover:bg-sky-50/60"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-950">
                      {event.title}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatEventDate(event.date)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{event.location}</td>
                    <td className="px-4 py-3"><Badge status={event.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className={buttonStyles({ variant: "ghost", size: "sm" })}
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

function Shell({ children, username }: { children: React.ReactNode; username: string }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <PageHeader
          eyebrow={`Signed in as ${username}`}
          title="Event dashboard"
          description="Create, publish, and maintain IEEE ITB Student Branch events."
          actions={
            <>
          <Link
            href="/"
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            View public site
          </Link>
          <Link
            href="/admin/events/new"
            className={buttonStyles({ size: "sm" })}
          >
            New event
          </Link>
          <LogoutButton />
            </>
          }
        />
      </div>
      {children}
    </main>
  );
}
