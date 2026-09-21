import Link from "next/link";

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
    <form method="GET" action={basePath} className="flex flex-wrap items-center gap-2">
      {timeframe && timeframe !== "all" ? (
        <input type="hidden" name="timeframe" value={timeframe} />
      ) : null}
      {status && status !== "ALL" ? (
        <input type="hidden" name="status" value={status} />
      ) : null}

      <div className="relative flex flex-1 min-w-[14rem]">
        <input
          name="search"
          type="text"
          defaultValue={search ?? ""}
          placeholder="Search by title or description..."
          maxLength={100}
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-gray-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
      >
        Search
      </button>

      {search ? (
        <Link
          href={clearUrl}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter events by date">
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
            role="tab"
            aria-selected={isActive}
            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
              isActive
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
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
    <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter events by status">
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
            role="tab"
            aria-selected={isActive}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              isActive
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {opt === "ALL" ? "All statuses" : opt}
          </Link>
        );
      })}
    </div>
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
      className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 text-sm"
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
            className="rounded border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            &larr; Previous
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded border border-gray-200 px-3 py-1.5 font-medium text-gray-400">
            &larr; Previous
          </span>
        )}

        {hasNext ? (
          <Link
            href={nextUrl}
            className="rounded border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            Next &rarr;
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded border border-gray-200 px-3 py-1.5 font-medium text-gray-400">
            Next &rarr;
          </span>
        )}
      </div>
    </nav>
  );
}
