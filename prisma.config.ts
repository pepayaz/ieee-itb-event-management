import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Pakai DIRECT_URL (bukan pooled): migration mengubah struktur tabel,
    // jadi butuh koneksi langsung yang stabil, bukan lewat pooler.
    url: env("DIRECT_URL"),
  },
});