import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import "dotenv/config";


// Adapter necessário no Prisma 7.
const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({
	adapter,
});