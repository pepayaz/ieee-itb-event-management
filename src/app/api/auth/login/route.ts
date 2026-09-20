import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, zodErrorResponse } from "@/lib/api";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";

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

  try {
    const admin = await prisma.admin.findUnique({ where: { username } });

    // Pesan sengaja sama untuk username tidak terdaftar maupun password
    // salah: membedakannya memberi tahu penyerang username mana yang ada.
    if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
      return errorResponse("Invalid username or password", 401);
    }

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
