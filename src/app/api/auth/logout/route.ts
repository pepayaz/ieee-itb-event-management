import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  // maxAge 0 memerintahkan browser membuang cookie sekarang juga.
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
