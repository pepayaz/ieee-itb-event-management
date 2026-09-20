import { describe, expect, it } from "vitest";

import {
  formatEventDate,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/lib/format";

describe("event date formatting", () => {
  it("renders the date in Jakarta time regardless of the host time zone", () => {
    expect(formatEventDate(new Date("2026-10-05T09:00:00.000Z"))).toBe(
      "Monday, 5 October 2026 at 16:00",
    );
  });
});

describe("datetime-local conversion", () => {
  it("shows stored UTC as Jakarta wall clock time", () => {
    expect(toDateTimeLocalValue(new Date("2026-10-05T09:00:00.000Z"))).toBe(
      "2026-10-05T16:00",
    );
  });

  it("reads a form value as Jakarta time, not as UTC", () => {
    expect(fromDateTimeLocalValue("2026-10-05T16:00")).toBe(
      "2026-10-05T09:00:00.000Z",
    );
  });

  it("round trips without shifting the clock", () => {
    const stored = new Date("2026-12-31T17:30:00.000Z");
    const formValue = toDateTimeLocalValue(stored);

    expect(new Date(fromDateTimeLocalValue(formValue)).toISOString()).toBe(
      stored.toISOString(),
    );
  });

  it("handles a time that falls on the previous day in UTC", () => {
    // 07:00 WIB tanggal 1 Januari adalah 00:00 UTC di tanggal yang sama,
    // sementara 06:00 WIB masih tanggal 31 Desember menurut UTC.
    const stored = new Date("2026-12-31T23:00:00.000Z");

    expect(toDateTimeLocalValue(stored)).toBe("2027-01-01T06:00");
    expect(fromDateTimeLocalValue("2027-01-01T06:00")).toBe(
      stored.toISOString(),
    );
  });
});
