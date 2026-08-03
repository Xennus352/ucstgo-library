import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
  // Create the underlying pg connection pool with connection limits
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5, // Keep max low (e.g. 3 to 5) so multiple app instances don't exceed pool size 15
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;