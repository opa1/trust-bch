import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pgPool: Pool;
};

// Use pg Pool (standard Node.js driver)
const pool =
  globalForPrisma.pgPool ||
  new Pool({
    connectionString,
    max: 5, // Keep low for serverless/dev
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });

// Handle pool errors gracefully
pool.on("error", (err: any) => {
  console.warn("[Prisma Pool] Idle client error:", err.message);
});

const adapter = new PrismaPg(pool);

// Also create a fresh PrismaClient to avoid using the old one with Neon adapter
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
