import { describe, expect, it } from "vitest";

import { detectImageType, isRejectedByClaimedType } from "@/lib/uploads";
import { eventSchema } from "@/lib/validation";

describe("detectImageType (magic bytes validation)", () => {
  it("detects valid JPEG files", () => {
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);

    expect(detectImageType(jpegHeader)).toBe("jpg");
  });

  it("detects valid PNG files", () => {
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);

    expect(detectImageType(pngHeader)).toBe("png");
  });

  it("detects valid WebP files", () => {
    // RIFF .... WEBP
    const webpHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]);

    expect(detectImageType(webpHeader)).toBe("webp");
  });

  it("rejects plain text disguised as image", () => {
    const textFile = Buffer.from("Hello world, this is a plain text file pretending to be jpg");

    expect(detectImageType(textFile)).toBeNull();
  });

  it("rejects SVG files that could contain malicious scripts", () => {
    const svgFile = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");

    expect(detectImageType(svgFile)).toBeNull();
  });

  it("rejects truncated buffers smaller than 12 bytes", () => {
    const tinyBuffer = Buffer.from([0xff, 0xd8, 0xff]);

    expect(detectImageType(tinyBuffer)).toBeNull();
  });
});

describe("claimed content type gate", () => {
  it("rejects a type the client claims is not an image", () => {
    expect(isRejectedByClaimedType("application/pdf")).toBe(true);
    expect(isRejectedByClaimedType("image/svg+xml")).toBe(true);
  });

  it("accepts the allowed image types", () => {
    expect(isRejectedByClaimedType("image/png")).toBe(false);
    expect(isRejectedByClaimedType("image/webp")).toBe(false);
  });

  it("defers to the magic bytes when no usable type is claimed", () => {
    expect(isRejectedByClaimedType("")).toBe(false);
    expect(isRejectedByClaimedType("application/octet-stream")).toBe(false);
  });
});

describe("eventSchema with imageUrl", () => {
  const baseEvent = {
    title: "IEEE Annual Gathering",
    description: "Annual meeting and technical networking event.",
    date: "2026-10-15T10:00:00.000Z",
    location: "Aula Barat ITB",
    status: "PUBLISHED",
  };

  it("accepts event without imageUrl", () => {
    const result = eventSchema.safeParse(baseEvent);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.imageUrl).toBeNull();
  });

  it("accepts event with valid imageUrl", () => {
    const result = eventSchema.safeParse({
      ...baseEvent,
      imageUrl: "/uploads/sample-image-cuid-123.jpg",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.imageUrl).toBe("/uploads/sample-image-cuid-123.jpg");
  });

  it("transforms empty string imageUrl to null", () => {
    const result = eventSchema.safeParse({
      ...baseEvent,
      imageUrl: "   ",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.imageUrl).toBeNull();
  });
});
