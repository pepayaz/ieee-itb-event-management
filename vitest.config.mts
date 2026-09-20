import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    // Vitest tidak membaca "paths" dari tsconfig, jadi alias ditulis ulang.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
