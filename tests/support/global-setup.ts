import { execSync } from "node:child_process";
// O globalSetup não passa pelo moduleNameMapper, por isso o import sem extensão.
import { loadTestEnv } from "./env";

/*
  Executado uma única vez antes de todos os testes:
  aplica as migrations e popula o banco de teste com o seed.
*/
export default function globalSetup() {
	loadTestEnv();

	execSync("npx prisma migrate deploy", { stdio: "pipe" });
	execSync("npx tsx prisma/seed.ts", { stdio: "pipe" });
}
