import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return errorResponse("Authentication required", 401);
  }

  const session = await verifyToken(token);

  if (!session) {
    return errorResponse("Authentication required", 401);
  }

  return NextResponse.json({ username: session.username });
}
