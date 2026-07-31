import request from "supertest";
import type {
	FastifyInstance,
} from "fastify";

import {
	getTestApp,
} from "./setup.js";


describe("INTEGRAÇÃO - Auth", () => {
	let app: FastifyInstance;

	beforeAll(async () => {
		app =
			await getTestApp();
	});

	afterAll(async () => {
		await app.close();
	});

	// Valida login com usuário e senha corretos.
	it("deve retornar JWT com credenciais válidas", async () => {
		const response =
			await request(app.server)
				.post("/auth/login")
				.send({
					email: "corban1@neocredito.com.br",
					password: "Teste@2024",
				});

		expect(response.statusCode).toBe(200);

		expect(response.body.token).toBeDefined();
	});

	// Valida bloqueio de login com senha inválida.
	it("deve retornar 401 com credenciais inválidas", async () => {
		const response =
			await request(app.server)
				.post("/auth/login")
				.send({
					email: "corban1@neocredito.com.br",
					password: "senha-incorreta",
				});

		expect(response.statusCode).toBe(401);

		expect(response.body.error).toBe("Invalid credentials",);

	});


	// Valida retorno dos dados do usuário autenticado.
	it("deve retornar usuário autenticado pelo token", async () => {
		const login =
			await request(app.server)
				.post("/auth/login")
				.send({
					email: "corban1@neocredito.com.br",
					password: "Teste@2024",
				});

		const token =
			login.body.token;

		const response =
			await request(app.server)
				.get("/auth/me")
				.set(
					"Authorization",
					`Bearer ${token}`,
				);

		expect(response.statusCode).toBe(200);


		expect(response.body.email)
			.toBe("corban1@neocredito.com.br",);

		expect(response.body.role)
			.toBe("CORBAN",);
	});

	// Valida que uma rota protegida exige JWT.
	it("deve retornar 401 sem token", async () => {
		const response =
			await request(app.server).get("/auth/me");

		expect(response.statusCode).toBe(401);

	});

    // Valida que token expirado não permite acesso.
    it("deve retornar 401 com token expirado", async () => {
	const token =
		await app.jwt.sign(
			{
				sub:
					"usuario-teste",
				role:
					"CORBAN",
			},
			{
				expiresIn:
					"-1s",
			},
		);

	const response =
		await request(app.server)
			.get("/auth/me")
			.set(
				"Authorization",
				`Bearer ${token}`,
			);

	expect(response.statusCode).toBe(401);

	expect(response.body.error).toBe("Token expirado",);
    });
});