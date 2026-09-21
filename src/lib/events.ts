import type { Event, EventStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { EventInput, EventUpdateInput } from "@/lib/validation";

export type EventTimeframe = "upcoming" | "past" | "all";

export interface EventQueryOptions {
  search?: string;
  timeframe?: EventTimeframe;
  status?: EventStatus;
  page?: number;
  pageSize?: number;
}

export interface PaginatedEventsResult {
  events: Event[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function buildEventWhereClause(
  options: EventQueryOptions & { forcedStatus?: EventStatus },
  now: Date = new Date(),
): Prisma.EventWhereInput {
  const conditions: Prisma.EventWhereInput[] = [];

  if (options.forcedStatus) {
    conditions.push({ status: options.forcedStatus });
  } else if (options.status) {
    conditions.push({ status: options.status });
  }

  const trimmedSearch = options.search?.trim();
  if (trimmedSearch) {
    conditions.push({
      OR: [
        { title: { contains: trimmedSearch, mode: "insensitive" } },
        { description: { contains: trimmedSearch, mode: "insensitive" } },
      ],
    });
  }

  if (options.timeframe === "upcoming") {
    conditions.push({ date: { gte: now } });
  } else if (options.timeframe === "past") {
    conditions.push({ date: { lt: now } });
  }

  if (conditions.length === 0) {
    return {};
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { AND: conditions };
}

export function calculatePagination(
  total: number,
  requestedPage: number = 1,
  pageSize: number = 10,
) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));

  // Halaman di luar jangkauan diperlakukan sebagai halaman terakhir yang valid
  // agar pengguna tidak dihadapkan pada tampilan kosong tanpa konteks data.
  let page = Math.max(1, requestedPage);
  if (total > 0 && page > totalPages) {
    page = totalPages;
  }

  const skip = (page - 1) * safePageSize;
  const take = safePageSize;

  return { page, pageSize: safePageSize, totalPages, skip, take };
}

export async function listPublishedEvents(
  options: EventQueryOptions = {},
  now: Date = new Date(),
): Promise<PaginatedEventsResult> {
  const pageSize = options.pageSize ?? 9;
  const where = buildEventWhereClause(
    { ...options, forcedStatus: "PUBLISHED" },
    now,
  );

  const total = await prisma.event.count({ where });
  const pagination = calculatePagination(total, options.page, pageSize);

  const events = await prisma.event.findMany({
    where,
    orderBy: { date: "asc" },
    skip: pagination.skip,
    take: pagination.take,
  });

  return {
    events,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
}

export async function listAllEvents(
  options: EventQueryOptions = {},
  now: Date = new Date(),
): Promise<PaginatedEventsResult> {
  const pageSize = options.pageSize ?? 15;
  const where = buildEventWhereClause(options, now);

  const total = await prisma.event.count({ where });
  const pagination = calculatePagination(total, options.page, pageSize);

  const events = await prisma.event.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.take,
  });

  return {
    events,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
}

export async function getEventById(id: string): Promise<Event | null> {
  return prisma.event.findUnique({ where: { id } });
}

export async function createEvent(data: EventInput): Promise<Event> {
  return prisma.event.create({ data });
}

export async function updateEvent(
  id: string,
  data: EventUpdateInput,
): Promise<Event> {
  return prisma.event.update({ where: { id }, data });
}

export async function deleteEvent(id: string): Promise<Event> {
  return prisma.event.delete({ where: { id } });
}
