import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

import { errorResponse } from "@/lib/api";
import {
  MAX_UPLOAD_FILE_SIZE,
  detectImageType,
  isRejectedByClaimedType,
} from "@/lib/uploads";

const INVALID_TYPE_MESSAGE =
  "Invalid file type. Only JPEG, PNG, and WebP images are allowed";

export async function POST(request: NextRequest) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid multipart form data", 400);
  }

  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return errorResponse("No image file provided", 400, "file");
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    return errorResponse("File size exceeds 2 MB limit", 400, "file");
  }

  if (isRejectedByClaimedType(file.type)) {
    return errorResponse(INVALID_TYPE_MESSAGE, 400, "file");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Ekstensi ditentukan dari magic bytes, bukan dari nama berkas atau header
  // Content-Type, karena keduanya dikendalikan pengirim.
  const detectedExtension = detectImageType(buffer);

  if (!detectedExtension) {
    return errorResponse(INVALID_TYPE_MESSAGE, 400, "file");
  }

  // Nama dari klien tidak pernah dipakai; nama acak menutup path traversal.
  const filename = `${crypto.randomUUID()}.${detectedExtension}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    console.error("POST /api/uploads failed:", error);

    return errorResponse("Something went wrong", 500);
  }
}
