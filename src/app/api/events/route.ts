import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { EVENT_STATUSES, eventSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const requestedStatus = request.nextUrl.searchParams.get("status");
  const status = EVENT_STATUSES.find((value) => value === requestedStatus);

  try {
    const events = await prisma.event.findMany({
      where: status ? { status } : undefined,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("GET /api/events failed:", error);

    return errorResponse("Something went wrong", 500);
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = eventSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  try {
    const event = await prisma.event.create({ data: parsed.data });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    // Detail error database tidak dikirim ke klien: isinya bisa membocorkan
    // struktur tabel dan connection string.
    console.error("POST /api/events failed:", error);

    return errorResponse("Something went wrong", 500);
  }
}
