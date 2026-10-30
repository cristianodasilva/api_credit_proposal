import request from "supertest";
import { createApp } from "../../src/app.js";

export async function getTestApp() {
	const app = await createApp();

	await app.ready();

	return app;
}

export type TestApp = Awaited<ReturnType<typeof getTestApp>>;

export const PASSWORD = "Teste@2024";

// Faz login e retorna o JWT do usuário informado.
export async function login(app: TestApp, email: string) {
	const response = await request(app.server)
		.post("/auth/login")
		.send({ email, password: PASSWORD });

	return response.body.token as string;
}
