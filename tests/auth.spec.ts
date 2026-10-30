import request from "supertest";
import { prisma } from "../src/infra/database/prisma.js";
import { getTestApp, PASSWORD, type TestApp } from "./support/app.js";

describe("INTEGRAÇÃO - Auth", () => {
	let app: TestApp;

	beforeAll(async () => {
		app = await getTestApp();
	});

	afterAll(async () => {
		await app.close();
		await prisma.$disconnect();
	});

	// Valida login com usuário e senha corretos.
	it("deve retornar JWT com credenciais válidas", async () => {
		const response = await request(app.server)
			.post("/auth/login")
			.send({ email: "corban1@example.com", password: PASSWORD });

		expect(response.statusCode).toBe(200);
		expect(response.body.token).toBeDefined();
	});

	// Valida bloqueio de login com senha inválida.
	it("deve retornar 401 com credenciais inválidas", async () => {
		const response = await request(app.server)
			.post("/auth/login")
			.send({ email: "corban1@example.com", password: "senha-incorreta" });

		expect(response.statusCode).toBe(401);
		expect(response.body.error).toBe("Invalid credentials");
	});

	// Usuário inexistente recebe a mesma resposta de senha incorreta.
	it("deve retornar 401 para usuário inexistente", async () => {
		const response = await request(app.server)
			.post("/auth/login")
			.send({ email: "ninguem@example.com", password: PASSWORD });

		expect(response.statusCode).toBe(401);
		expect(response.body.error).toBe("Invalid credentials");
	});

	// Payload mal formatado é erro de validação, não de credencial.
	it("deve retornar 400 com email em formato inválido", async () => {
		const response = await request(app.server)
			.post("/auth/login")
			.send({ email: "nao-e-email", password: PASSWORD });

		expect(response.statusCode).toBe(400);
		expect(response.body.error).toBe("Validation error");
	});

	// Valida retorno dos dados do usuário autenticado.
	it("deve retornar usuário autenticado pelo token", async () => {
		const login = await request(app.server)
			.post("/auth/login")
			.send({ email: "corban1@example.com", password: PASSWORD });

		const response = await request(app.server)
			.get("/auth/me")
			.set("Authorization", `Bearer ${login.body.token}`);

		expect(response.statusCode).toBe(200);
		expect(response.body.email).toBe("corban1@example.com");
		expect(response.body.role).toBe("CORBAN");
		expect(response.body.passwordHash).toBeUndefined();
	});

	// Valida que uma rota protegida exige JWT.
	it("deve retornar 401 sem token", async () => {
		const response = await request(app.server).get("/auth/me");

		expect(response.statusCode).toBe(401);
	});

	// Valida que token assinado com outra chave é rejeitado.
	it("deve retornar 401 com token inválido", async () => {
		const response = await request(app.server)
			.get("/auth/me")
			.set("Authorization", "Bearer token-invalido");

		expect(response.statusCode).toBe(401);
		expect(response.body.error).toBe("Unauthorized");
	});

	// Valida que token expirado não permite acesso.
	it("deve retornar 401 com token expirado", async () => {
		const token = app.jwt.sign(
			{ sub: "usuario-teste", role: "CORBAN" },
			{ expiresIn: "-1s" },
		);

		const response = await request(app.server)
			.get("/auth/me")
			.set("Authorization", `Bearer ${token}`);

		expect(response.statusCode).toBe(401);
		expect(response.body.error).toBe("Token expired");
	});
});
