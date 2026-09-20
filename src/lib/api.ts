import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function errorResponse(message: string, status: number, field?: string) {
  return NextResponse.json({ error: { message, field } }, { status });
}

export function zodErrorResponse(error: ZodError) {
  const issue = error.issues[0];

  return errorResponse(issue.message, 400, issue.path[0]?.toString());
}
