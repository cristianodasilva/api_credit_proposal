import "dotenv/config";

/*
  Os testes rodam em um banco separado do desenvolvimento.
  Isso evita apagar ou sujar os dados usados no dia a dia.
*/
export function loadTestEnv() {
	const testDatabaseUrl = process.env.DATABASE_URL_TEST;

	if (!testDatabaseUrl) {
		throw new Error(
			"DATABASE_URL_TEST is required to run the tests. See .env.example",
		);
	}

	process.env.DATABASE_URL = testDatabaseUrl;
	process.env.JWT_SECRET ??= "test-secret";
}

loadTestEnv();
