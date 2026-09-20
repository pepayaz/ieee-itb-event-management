import { describe, expect, it } from "vitest";

import { signToken, verifyToken } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

const PLAIN_PASSWORD = "correct-horse-battery-staple";

describe("password hashing", () => {
  it("does not store the plain password", async () => {
    const hash = await hashPassword(PLAIN_PASSWORD);

    expect(hash).not.toBe(PLAIN_PASSWORD);
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("accepts a matching password", async () => {
    const hash = await hashPassword(PLAIN_PASSWORD);

    expect(await verifyPassword(PLAIN_PASSWORD, hash)).toBe(true);
  });

  it("rejects a password that does not match", async () => {
    const hash = await hashPassword(PLAIN_PASSWORD);

    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces a different hash for the same password", async () => {
    const [first, second] = await Promise.all([
      hashPassword(PLAIN_PASSWORD),
      hashPassword(PLAIN_PASSWORD),
    ]);

    expect(first).not.toBe(second);
  });
});

describe("session tokens", () => {
  const payload = { sub: "admin-id", username: "admin" };

  it("verifies a token it signed and keeps the payload", async () => {
    const token = await signToken(payload);
    const session = await verifyToken(token);

    expect(session).toEqual(payload);
  });

  it("returns null for a tampered token", async () => {
    const token = await signToken(payload);
    const [header, body, signature] = token.split(".");
    const tampered = `${header}.${body}x.${signature}`;

    expect(await verifyToken(tampered)).toBeNull();
  });

  it("returns null for a token signed with another secret", async () => {
    const { SignJWT } = await import("jose");
    const foreign = await new SignJWT({ username: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin-id")
      .setExpirationTime("24h")
      .sign(new TextEncoder().encode("a-completely-different-secret-value"));

    expect(await verifyToken(foreign)).toBeNull();
  });

  it("returns null for a malformed token", async () => {
    expect(await verifyToken("not-a-jwt")).toBeNull();
  });
});
