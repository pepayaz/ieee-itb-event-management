import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Nilai dummy khusus test: suite tidak boleh bergantung pada isi .env mesin
    // yang menjalankannya, termasuk CI.
    env: {
      JWT_SECRET: "test-secret-value-that-is-long-enough-for-hs256",
      DATABASE_URL: "postgresql://postgres:dummy@localhost:5432/test?sslmode=disable",
    },
  },
  resolve: {
    // Vitest tidak membaca "paths" dari tsconfig, jadi alias ditulis ulang.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
