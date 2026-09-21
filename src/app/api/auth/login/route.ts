import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, zodErrorResponse } from "@/lib/api";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  getClientIp,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

// Hash bcrypt dengan salt rounds 10 untuk menjaga waktu komputasi tetap sama
// ketika username tidak ditemukan di database (mencegah timing attack).
const DUMMY_PASSWORD_HASH =
  "$2b$10$ap5jKxz9lk5/BKuVYkodOOVnjjbPMTu7hSFXnHeV3w22MvbxzlnsK";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const { username, password } = parsed.data;
  const clientIp = getClientIp(request.headers);
  const rateLimitKey = `${clientIp}:${username.toLowerCase()}`;

  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    const response = errorResponse(
      "Too many login attempts. Please try again later.",
      429,
    );
    if (rateLimit.retryAfterSeconds) {
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    }
    return response;
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { username } });

    // Komputasi bcrypt selalu dijalankan baik saat admin ditemukan maupun tidak,
    // agar durasi respons tidak membocorkan keberadaan username.
    const hashToVerify = admin ? admin.passwordHash : DUMMY_PASSWORD_HASH;
    const isValidPassword = await verifyPassword(password, hashToVerify);

    if (!admin || !isValidPassword) {
      recordFailedAttempt(rateLimitKey);
      return errorResponse("Invalid username or password", 401);
    }

    resetRateLimit(rateLimitKey);

    const token = await signToken({ sub: admin.id, username: admin.username });
    const response = NextResponse.json({ username: admin.username });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);

    return errorResponse("Something went wrong", 500);
  }
}
