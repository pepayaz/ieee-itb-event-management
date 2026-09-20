import "dotenv/config";

import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

const SALT_ROUNDS = 10;

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD must be set. Copy .env.example to .env and fill them in.",
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Upsert, bukan create, supaya seed aman dijalankan berulang kali dan
  // sekaligus berfungsi untuk mengganti password admin.
  const admin = await prisma.admin.upsert({
    where: { username },
    update: { passwordHash },
    create: { username, passwordHash },
  });

  console.log(`Seeded admin account "${admin.username}"`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
