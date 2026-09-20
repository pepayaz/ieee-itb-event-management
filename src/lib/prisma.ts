import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in.",
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Hot reload memuat ulang modul tanpa me-restart proses Node. Tanpa cache di
// globalThis, tiap penyimpanan file melahirkan connection pool baru sampai
// kuota koneksi Neon habis.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
