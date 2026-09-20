import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { errorResponse, zodErrorResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { eventUpdateSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

function isRecordNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return errorResponse("Event not found", 404);
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error(`GET /api/events/${id} failed:`, error);

    return errorResponse("Something went wrong", 500);
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = eventUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  try {
    const event = await prisma.event.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(event);
  } catch (error) {
    if (isRecordNotFound(error)) {
      return errorResponse("Event not found", 404);
    }

    console.error(`PUT /api/events/${id} failed:`, error);

    return errorResponse("Something went wrong", 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  try {
    await prisma.event.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (isRecordNotFound(error)) {
      return errorResponse("Event not found", 404);
    }

    console.error(`DELETE /api/events/${id} failed:`, error);

    return errorResponse("Something went wrong", 500);
  }
}
