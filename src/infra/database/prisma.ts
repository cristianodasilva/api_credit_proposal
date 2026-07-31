import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import "dotenv/config";

// Prisma 7 exige adapter para conexão	com PostgreSQL.
const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});

// Instância única do Prisma. Evita criar múltiplas conexões com o banco.
export const prisma = new PrismaClient({
	adapter,
});