import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function databaseUrl() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to connect Prisma.");
  }

  const url = new URL(connectionString);
  if (url.searchParams.get("sslmode") === "require" && !url.searchParams.has("uselibpqcompat")) {
    url.searchParams.set("uselibpqcompat", "true");
  }

  return url.toString();
}

const adapter = new PrismaPg({
  connectionString: databaseUrl(),
  max: 1,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000
});

function createPrismaClient() {
  return new PrismaClient({ adapter });
}

function isStalePrismaClient(client: PrismaClient | undefined) {
  if (!client) return false;
  return typeof (client as PrismaClient & { chatMessage?: unknown }).chatMessage === "undefined";
}

if (isStalePrismaClient(globalForPrisma.prisma)) {
  void globalForPrisma.prisma?.$disconnect().catch(() => undefined);
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
