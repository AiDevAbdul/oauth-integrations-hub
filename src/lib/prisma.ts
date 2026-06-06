import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function createPrismaClient() {
  const rawUrl = process.env.DATABASE_URL!;

  // Extract schema from URL params (pg driver ignores it, but PrismaPg needs it)
  const url = new URL(rawUrl);
  const schema = url.searchParams.get("schema") || "public";
  url.searchParams.delete("schema");

  const pool = new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  const adapter = new PrismaPg(pool, { schema });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
