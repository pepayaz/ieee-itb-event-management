import { describe, expect, it } from "vitest";

import { eventSchema, eventUpdateSchema, loginSchema } from "@/lib/validation";

const validEvent = {
  title: "IEEE Tech Talk",
  description: "An introductory session about embedded systems.",
  date: "2026-10-05T09:00:00.000Z",
  location: "Labtek V",
  status: "PUBLISHED",
};

function firstMessage(input: unknown): string {
  const result = eventSchema.safeParse(input);
  if (result.success) {
    throw new Error("Expected parsing to fail, but it succeeded");
  }
  return result.error.issues[0].message;
}

describe("eventSchema", () => {
  it("accepts a valid event", () => {
    const result = eventSchema.safeParse(validEvent);

    expect(result.success).toBe(true);
  });

  it("rejects a title shorter than 3 characters", () => {
    expect(firstMessage({ ...validEvent, title: "ab" })).toBe(
      "Title must be at least 3 characters",
    );
  });

  it("rejects a description shorter than 10 characters", () => {
    expect(firstMessage({ ...validEvent, description: "too short" })).toBe(
      "Description must be at least 10 characters",
    );
  });

  it("rejects a date that cannot be parsed", () => {
    expect(firstMessage({ ...validEvent, date: "not-a-date" })).toBe(
      "Date must be a valid date",
    );
  });

  it("rejects a status outside the enum", () => {
    expect(firstMessage({ ...validEvent, status: "ARCHIVED" })).toBe(
      "Status must be one of DRAFT, PUBLISHED, CANCELLED, or COMPLETED",
    );
  });

  it("transforms a valid date into a Date instance", () => {
    const result = eventSchema.safeParse(validEvent);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.date).toBeInstanceOf(Date);
    expect(result.data.date.toISOString()).toBe("2026-10-05T09:00:00.000Z");
  });

  it("trims surrounding whitespace before checking length", () => {
    const result = eventSchema.safeParse({ ...validEvent, title: "  IEEE  " });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.title).toBe("IEEE");

    expect(firstMessage({ ...validEvent, title: "   a   " })).toBe(
      "Title must be at least 3 characters",
    );
  });

  it("rejects a missing field with a readable message", () => {
    expect(firstMessage({ ...validEvent, title: undefined })).toBe(
      "Title is required",
    );
  });
});

describe("eventUpdateSchema", () => {
  it("accepts a single field", () => {
    const result = eventUpdateSchema.safeParse({ status: "DRAFT" });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({ status: "DRAFT" });
  });

  it("still validates the fields that are present", () => {
    const result = eventUpdateSchema.safeParse({ date: "not-a-date" });

    expect(result.success).toBe(false);
  });

  it("still transforms a valid date", () => {
    const result = eventUpdateSchema.safeParse({ date: "2026-10-05T09:00:00.000Z" });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.date).toBeInstanceOf(Date);
  });
});

describe("loginSchema", () => {
  it("accepts a filled username and password", () => {
    expect(loginSchema.safeParse({ username: "admin", password: "secret" }).success).toBe(true);
  });

  it("rejects an empty username", () => {
    expect(loginSchema.safeParse({ username: "", password: "secret" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ username: "admin", password: "" }).success).toBe(false);
  });

  it("rejects a username that is only whitespace", () => {
    expect(loginSchema.safeParse({ username: "   ", password: "secret" }).success).toBe(false);
  });

  it("keeps password whitespace untouched", () => {
    const result = loginSchema.safeParse({ username: " admin ", password: " secret " });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.username).toBe("admin");
    expect(result.data.password).toBe(" secret ");
  });
});
