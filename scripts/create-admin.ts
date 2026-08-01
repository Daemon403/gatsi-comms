import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";

const connectionString =
  process.env.ADMIN_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const password = process.env.ADMIN_PASSWORD || "GatsiAdmin2026";
  const email = process.env.ADMIN_EMAIL || "admin@gatsicomms.com";

  const admin = await prisma.employee.upsert({
    where: { id: "emp-admin" },
    update: {
      role: "Admin",
      email,
      isActive: true,
      passwordHash: hashPassword(password),
    },
    create: {
      id: "emp-admin",
      firstName: "System",
      lastName: "Administrator",
      email,
      phone: "(555) 000-0001",
      role: "Admin",
      passwordHash: hashPassword(password),
    },
  });

  console.log("Admin account ready:");
  console.log(`  email:    ${admin.email}`);
  console.log(`  password: ${password}`);
  console.log("Change this password after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
