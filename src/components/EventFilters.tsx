import Link from "next/link";

import { Button, Input, buttonStyles } from "@/components/ui";
import type { EventTimeframe } from "@/lib/events";
import { EVENT_STATUSES } from "@/lib/validation";

interface QueryState {
  search?: string;
  timeframe?: EventTimeframe;
  status?: string;
  page?: number;
}

export function buildFilterUrl(
  basePath: string,
  state: QueryState,
  updates: Partial<QueryState> = {},
): string {
  const merged = { ...state, ...updates };
  const params = new URLSearchParams();

  if (merged.search && merged.search.trim()) {
    params.set("search", merged.search.trim());
  }

  if (merged.timeframe && merged.timeframe !== "all") {
    params.set("timeframe", merged.timeframe);
  }

  if (merged.status && merged.status !== "ALL") {
    params.set("status", merged.status);
  }

  if (merged.page && merged.page > 1) {
    params.set("page", String(merged.page));
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function EventSearchBar({
  basePath,
  search,
  timeframe,
  status,
}: {
  basePath: string;
  search?: string;
  timeframe?: EventTimeframe;
  status?: string;
}) {
  const clearUrl = buildFilterUrl(
    basePath,
    { timeframe, status },
    { search: "", page: 1 },
  );

  return (
    <form method="GET" action={basePath} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {timeframe && timeframe !== "all" ? (
        <input type="hidden" name="timeframe" value={timeframe} />
      ) : null}
      {status && status !== "ALL" ? (
        <input type="hidden" name="status" value={status} />
      ) : null}

      <div className="relative flex min-w-0 flex-1">
        <Input
          aria-label="Search events"
          name="search"
          type="text"
          defaultValue={search ?? ""}
          placeholder="Search by title or description..."
          maxLength={100}
          className="pr-10"
        />
      </div>

      <Button type="submit">
        Search
      </Button>

      {search ? (
        <Link
          href={clearUrl}
          className={buttonStyles({ variant: "secondary" })}
        >
          Clear
        </Link>
      ) : null}
    </form>
  );
}

export function TimeframeTabs({
  basePath,
  selected = "all",
  search,
  status,
}: {
  basePath: string;
  selected?: EventTimeframe;
  search?: string;
  status?: string;
}) {
  const options: { label: string; value: EventTimeframe }[] = [
    { label: "All events", value: "all" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Past", value: "past" },
  ];

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filter events by date">
      {options.map((opt) => {
        const isActive = (selected ?? "all") === opt.value;
        const href = buildFilterUrl(
          basePath,
          { search, status },
          { timeframe: opt.value, page: 1 },
        );

        return (
          <Link
            key={opt.value}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors duration-150 ${
              isActive
                ? "bg-ieee text-white"
                : "bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-ieee-light hover:text-ieee-dark"
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function StatusFilterTabs({
  basePath,
  selected = "ALL",
  search,
  timeframe,
}: {
  basePath: string;
  selected?: string;
  search?: string;
  timeframe?: EventTimeframe;
}) {
  const options = ["ALL", ...EVENT_STATUSES];

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Filter events by status">
      {options.map((opt) => {
        const isActive = (selected ?? "ALL") === opt;
        const href = buildFilterUrl(
          basePath,
          { search, timeframe },
          { status: opt, page: 1 },
        );

        return (
          <Link
            key={opt}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-3 py-2 text-xs font-bold transition-colors duration-150 ${
              isActive
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-100"
            }`}
          >
            {opt === "ALL" ? "All statuses" : opt}
          </Link>
        );
      })}
    </nav>
  );
}

export function PaginationControls({
  basePath,
  page,
  totalPages,
  total,
  pageSize,
  search,
  timeframe,
  status,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  search?: string;
  timeframe?: EventTimeframe;
  status?: string;
}) {
  if (total === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const prevUrl = buildFilterUrl(
    basePath,
    { search, timeframe, status },
    { page: Math.max(1, page - 1) },
  );

  const nextUrl = buildFilterUrl(
    basePath,
    { search, timeframe, status },
    { page: Math.min(totalPages, page + 1) },
  );

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-gray-200 pt-5 text-sm sm:flex-row sm:items-center"
    >
      <div className="text-gray-600">
        Showing <span className="font-medium text-gray-900">{start}</span>–
        <span className="font-medium text-gray-900">{end}</span> of{" "}
        <span className="font-medium text-gray-900">{total}</span> events &bull; Page{" "}
        <span className="font-medium text-gray-900">{page}</span> of{" "}
        <span className="font-medium text-gray-900">{totalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link
            href={prevUrl}
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            &larr; Previous
          </Link>
        ) : (
          <span aria-disabled="true" className="inline-flex min-h-9 cursor-not-allowed items-center rounded-control border border-gray-200 px-3 py-1.5 font-semibold text-gray-400">
            &larr; Previous
          </span>
        )}

        {hasNext ? (
          <Link
            href={nextUrl}
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            Next &rarr;
          </Link>
        ) : (
          <span aria-disabled="true" className="inline-flex min-h-9 cursor-not-allowed items-center rounded-control border border-gray-200 px-3 py-1.5 font-semibold text-gray-400">
            Next &rarr;
          </span>
        )}
      </div>
    </nav>
  );
}
