import request from "supertest";
import {
	beforeAll,
	afterAll,
	describe,
	it,
	expect,
} from "@jest/globals";
import {
	createApp,
} from "../src/app.js";
import {
	prisma,
} from "../src/infra/database/prisma.js";

describe("INTEGRAÇÃO - Propostas", () => {
	let app:
		Awaited<ReturnType<typeof createApp>>;

	let token: string;

	let proposalId: string;

	beforeAll(async () => {
		app =
			await createApp();

		await app.ready();

		// Login do CORBAN para utilizar nos testes.
		const login =
			await request(app.server)
				.post("/auth/login")
				.send({
					email:
						"corban1@neocredito.com.br",
					password:
						"Teste@2024",
				});

		token = login.body.token;
	});

	afterAll(async () => {
		await app.close();

		await prisma.$disconnect();

	});

	// Testa criação de proposta autenticada.
	it("deve criar uma nova proposta", async () => {
		const response =
			await request(app.server)
				.post("/propostas")
				.set(
					"Authorization",
					`Bearer ${token}`,
				)
				.send({
					customerName:
						"Cliente Teste",
					customerCpf:
						"12345678900",
					customerIncome:
						5000,
					requestedAmount:
						10000,
					installments:
						12,
				});

		expect(response.statusCode).toBe(201);

		expect(response.body.customerName)
			.toBe("Cliente Teste");

		expect(response.body.status)
			.toBe("RASCUNHO");

		proposalId = response.body.id;
	});

	// Testa listagem de propostas autenticada.
	it("deve listar propostas do CORBAN autenticado", async () => {
		const response =
			await request(app.server)
				.get("/propostas")
				.set(
					"Authorization",
					`Bearer ${token}`,
				);

		expect(response.statusCode).toBe(200);

		expect(response.body.data,).toBeInstanceOf(Array);
	});

	// Testa busca de proposta pelo ID.
	it("deve buscar uma proposta por ID", async () => {
		const response =
			await request(app.server)
				.get(
					`/propostas/${proposalId}`,
				)
				.set(
					"Authorization",
					`Bearer ${token}`,
				);

		expect(response.statusCode).toBe(200);

		expect(response.body.id).toBe(proposalId);
	});

	// Testa alteração de status realizada pelo OPERADOR.
	it("deve atualizar status de proposta como operador", async () => {
		const operatorLogin =
			await request(app.server)
				.post("/auth/login")
				.send({
					email:
						"operador@neocredito.com.br",
					password:
						"Teste@2024",
				});

		const operatorToken = operatorLogin.body.token;

		const response =
			await request(app.server)
				.patch(
					`/propostas/${proposalId}/status`,
				)
				.set(
					"Authorization",
					`Bearer ${operatorToken}`,
				)
				.send({
					status:
						"EM_ANALISE",
				});

		expect(response.statusCode).toBe(200);

		expect(response.body.status).toBe("EM_ANALISE");
	});

	// Testa cancelamento com soft delete.
	it("deve cancelar proposta alterando status para CANCELADA", async () => {
	const createResponse =
		await request(app.server)
			.post("/propostas")
			.set(
				"Authorization",
				`Bearer ${token}`,
			)
			.send({
				customerName:
					"Cliente Cancelamento",
				customerCpf:
					"98765432100",
				customerIncome:
					4000,
				requestedAmount:
					5000,
				installments:
					6,
			});

	const cancelProposalId = createResponse.body.id;

	const response =
		await request(app.server)
			.delete(
				`/propostas/${cancelProposalId}`,
			)
			.set(
				"Authorization",
				`Bearer ${token}`,
			);

	expect(response.statusCode).toBe(200);

	expect(response.body.status).toBe("CANCELADA");
    });
});