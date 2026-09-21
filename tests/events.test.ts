import { describe, expect, it } from "vitest";

import { buildFilterUrl } from "@/components/EventFilters";
import {
  buildEventWhereClause,
  calculatePagination,
} from "@/lib/events";
import { eventFilterSchema } from "@/lib/validation";

describe("buildEventWhereClause", () => {
  const referenceTime = new Date("2026-09-21T10:00:00.000Z");

  it("returns empty where clause when no filters are provided", () => {
    const where = buildEventWhereClause({}, referenceTime);

    expect(where).toEqual({});
  });

  it("enforces forcedStatus constraint", () => {
    const where = buildEventWhereClause(
      { forcedStatus: "PUBLISHED" },
      referenceTime,
    );

    expect(where).toEqual({ status: "PUBLISHED" });
  });

  it("builds case-insensitive search on title and description", () => {
    const where = buildEventWhereClause(
      { search: "embedded systems" },
      referenceTime,
    );

    expect(where).toEqual({
      OR: [
        { title: { contains: "embedded systems", mode: "insensitive" } },
        { description: { contains: "embedded systems", mode: "insensitive" } },
      ],
    });
  });

  it("ignores search query consisting only of whitespace", () => {
    const where = buildEventWhereClause({ search: "   " }, referenceTime);

    expect(where).toEqual({});
  });

  it("builds upcoming timeframe query comparing against reference time", () => {
    const where = buildEventWhereClause(
      { timeframe: "upcoming" },
      referenceTime,
    );

    expect(where).toEqual({ date: { gte: referenceTime } });
  });

  it("builds past timeframe query comparing against reference time", () => {
    const where = buildEventWhereClause({ timeframe: "past" }, referenceTime);

    expect(where).toEqual({ date: { lt: referenceTime } });
  });

  it("combines search, timeframe, and status into AND clause", () => {
    const where = buildEventWhereClause(
      {
        search: "robotics",
        timeframe: "upcoming",
        status: "PUBLISHED",
      },
      referenceTime,
    );

    expect(where).toEqual({
      AND: [
        { status: "PUBLISHED" },
        {
          OR: [
            { title: { contains: "robotics", mode: "insensitive" } },
            { description: { contains: "robotics", mode: "insensitive" } },
          ],
        },
        { date: { gte: referenceTime } },
      ],
    });
  });
});

describe("calculatePagination", () => {
  it("calculates pagination for the first page", () => {
    const pag = calculatePagination(25, 1, 10);

    expect(pag).toEqual({
      page: 1,
      pageSize: 10,
      totalPages: 3,
      skip: 0,
      take: 10,
    });
  });

  it("calculates pagination for subsequent pages", () => {
    const pag = calculatePagination(25, 2, 10);

    expect(pag).toEqual({
      page: 2,
      pageSize: 10,
      totalPages: 3,
      skip: 10,
      take: 10,
    });
  });

  it("clamps out-of-bounds page numbers to the last valid page", () => {
    const pag = calculatePagination(25, 99, 10);

    expect(pag.page).toBe(3);
    expect(pag.totalPages).toBe(3);
    expect(pag.skip).toBe(20);
  });

  it("handles zero total records gracefully", () => {
    const pag = calculatePagination(0, 1, 10);

    expect(pag.page).toBe(1);
    expect(pag.totalPages).toBe(1);
    expect(pag.skip).toBe(0);
  });

  it("clamps non-positive requested page to 1", () => {
    const pag = calculatePagination(25, 0, 10);

    expect(pag.page).toBe(1);
    expect(pag.skip).toBe(0);
  });
});

describe("buildFilterUrl", () => {
  it("preserves existing search and filter state when navigating pages", () => {
    const url = buildFilterUrl(
      "/",
      { search: "workshop", timeframe: "upcoming" },
      { page: 2 },
    );

    expect(url).toBe("/?search=workshop&timeframe=upcoming&page=2");
  });

  it("omits page 1 and 'all' filters to keep clean URLs", () => {
    const url = buildFilterUrl(
      "/admin/dashboard",
      { search: "workshop", timeframe: "upcoming", status: "PUBLISHED" },
      { timeframe: "all", page: 1 },
    );

    expect(url).toBe("/admin/dashboard?search=workshop&status=PUBLISHED");
  });
});

describe("eventFilterSchema", () => {
  it("accepts valid search queries up to 100 characters", () => {
    expect(
      eventFilterSchema.safeParse({ search: "IEEE Workshop 2026" }).success,
    ).toBe(true);
  });

  it("rejects search queries longer than 100 characters", () => {
    const longQuery = "a".repeat(101);
    const result = eventFilterSchema.safeParse({ search: longQuery });

    expect(result.success).toBe(false);
  });
});
