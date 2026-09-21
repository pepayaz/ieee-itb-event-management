import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, zodErrorResponse } from "@/lib/api";
import {
  createEvent,
  listAllEvents,
  type EventQueryOptions,
  type EventTimeframe,
} from "@/lib/events";
import { EVENT_STATUSES, eventSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestedStatus = searchParams.get("status");
  const status = EVENT_STATUSES.find((value) => value === requestedStatus);

  if (requestedStatus !== null && requestedStatus !== "" && !status) {
    return errorResponse(
      "Status must be one of DRAFT, PUBLISHED, CANCELLED, or COMPLETED",
      400,
      "status",
    );
  }

  const search = searchParams.get("search") ?? undefined;
  const timeframeParam = searchParams.get("timeframe");
  const timeframe: EventTimeframe | undefined =
    timeframeParam === "upcoming" || timeframeParam === "past" || timeframeParam === "all"
      ? timeframeParam
      : undefined;

  const hasPagination = searchParams.has("page") || searchParams.has("pageSize");
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined;
  const pageSize = searchParams.get("pageSize")
    ? parseInt(searchParams.get("pageSize")!, 10)
    : hasPagination
      ? 15
      : 1000;

  const options: EventQueryOptions = {
    status,
    search,
    timeframe,
    page: Number.isNaN(page) ? undefined : page,
    pageSize: Number.isNaN(pageSize) ? undefined : pageSize,
  };

  try {
    const result = await listAllEvents(options);

    // Bila klien meminta pagination secara eksplisit, kembalikan objek metadata paginasi;
    // bila tidak, kembalikan array event untuk menjaga kompatibilitas kontrak API.
    if (hasPagination) {
      return NextResponse.json(result);
    }

    return NextResponse.json(result.events);
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
    const event = await createEvent(parsed.data);

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("POST /api/events failed:", error);

    return errorResponse("Something went wrong", 500);
  }
}
