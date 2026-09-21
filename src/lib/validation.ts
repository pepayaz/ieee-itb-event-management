import type { EventStatus } from "@prisma/client";
import { z } from "zod";

export const EVENT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "CANCELLED",
  "COMPLETED",
] as const;

// Guard dua arah: baris pertama gagal bila ada nilai di sini yang tidak
// dikenal Prisma, baris kedua gagal bila ada nilai enum Prisma yang belum
// terdaftar di sini. Tipe saja, tidak ada Prisma yang ikut ke bundle browser.
const _statusesMatchPrisma: EventStatus = "" as (typeof EVENT_STATUSES)[number];
const _prismaStatusesMatch: (typeof EVENT_STATUSES)[number] = "" as EventStatus;
void _statusesMatchPrisma;
void _prismaStatusesMatch;

// Date.parse menerima string longgar seperti '42' (dibaca tahun 2042).
// Pemeriksaan pola ISO memastikan format string sesuai sebelum diperiksa kalendernya.
const ISO_8601_DATETIME_PATTERN =
  /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?$/;

export const eventSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be at most 150 characters"),
  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  date: z
    .string({ error: "Date is required" })
    .trim()
    .refine(
      (value) =>
        ISO_8601_DATETIME_PATTERN.test(value) &&
        !Number.isNaN(Date.parse(value)),
      "Date must be a valid date",
    )
    .transform((value) => new Date(value)),
  location: z
    .string({ error: "Location is required" })
    .trim()
    .min(3, "Location must be at least 3 characters")
    .max(200, "Location must be at most 200 characters"),
  status: z.enum(EVENT_STATUSES, {
    error: "Status must be one of DRAFT, PUBLISHED, CANCELLED, or COMPLETED",
  }),
});

export const eventUpdateSchema = eventSchema.partial();

export const loginSchema = z.object({
  username: z
    .string({ error: "Username is required" })
    .trim()
    .min(1, "Username is required"),
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});

export const eventFilterSchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search query must be at most 100 characters")
    .optional(),
  timeframe: z.enum(["upcoming", "past", "all"]).optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type EventInput = z.infer<typeof eventSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EventFilterInput = z.infer<typeof eventFilterSchema>;
