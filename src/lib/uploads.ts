export const MAX_UPLOAD_FILE_SIZE = 2 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export type DetectedImageType = "jpg" | "png" | "webp";

export function detectImageType(buffer: Buffer): DetectedImageType | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }

  return null;
}

/**
 * Tipe yang diklaim klien hanya dipakai untuk menolak lebih awal, tidak untuk
 * menerima: ia dikendalikan pengirim dan dapat dipalsukan. Klaim yang kosong
 * atau generik dibiarkan lolos ke pemeriksaan magic bytes, yang menjadi
 * penentu sebenarnya.
 */
export function isRejectedByClaimedType(claimedType: string): boolean {
  if (!claimedType || claimedType === "application/octet-stream") {
    return false;
  }

  return !ALLOWED_IMAGE_MIME_TYPES.includes(
    claimedType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
  );
}
