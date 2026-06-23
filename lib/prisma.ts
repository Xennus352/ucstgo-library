import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = () => {
  // Initialize the driver adapter inside the singleton so it doesn't recreate pools on hot reload
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

// Use the existing global instance or create a new one
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// Cache the instance in development mode
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
