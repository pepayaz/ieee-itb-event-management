import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24;

export type SessionPayload = {
  sub: string;
  username: string;
};

const secret = process.env.JWT_SECRET;

// Dilempar saat modul dimuat, bukan saat token pertama dibuat: konfigurasi
// yang salah harus ketahuan segera, bukan diam-diam menghasilkan token yang
// ditandatangani dengan secret kosong.
if (!secret) {
  throw new Error(
    "JWT_SECRET is not set. Copy .env.example to .env and fill it in.",
  );
}

const encodedSecret = new TextEncoder().encode(secret);

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(encodedSecret);
}

export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || typeof payload.username !== "string") {
      return null;
    }

    return { sub: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}
