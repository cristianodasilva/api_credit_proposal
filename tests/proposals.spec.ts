import request from "supertest";
import { prisma } from "../src/infra/database/prisma.js";
import { getTestApp, login, type TestApp } from "./support/app.js";

const validProposal = {
	customerName: "Cliente Teste",
	customerCpf: "12345678900",
	customerIncome: 5000.5,
	requestedAmount: 10000,
	installments: 12,
};

describe("INTEGRAÇÃO - Propostas", () => {
	let app: TestApp;
	let corbanToken: string;
	let otherCorbanToken: string;
	let operatorToken: string;

	// Cria uma proposta em RASCUNHO para o CORBAN informado.
	async function createDraft(token = corbanToken, overrides = {}) {
		const response = await request(app.server)
			.post("/propostas")
			.set("Authorization", `Bearer ${token}`)
			.send({ ...validProposal, ...overrides });

		return response.body.id as string;
	}

	async function updateStatus(
		id: string,
		body: Record<string, unknown>,
		token = operatorToken,
	) {
		return request(app.server)
			.patch(`/propostas/${id}/status`)
			.set("Authorization", `Bearer ${token}`)
			.send(body);
	}

	beforeAll(async () => {
		app = await getTestApp();

		corbanToken = await login(app, "corban1@example.com");
		otherCorbanToken = await login(app, "corban2@example.com");
		operatorToken = await login(app, "operador@example.com");
	});

	afterAll(async () => {
		await app.close();
		await prisma.$disconnect();
	});

	describe("POST /propostas", () => {
		it("deve criar proposta com valores calculados", async () => {
			const response = await request(app.server)
				.post("/propostas")
				.set("Authorization", `Bearer ${corbanToken}`)
				.send(validProposal);

			expect(response.statusCode).toBe(201);
			expect(response.body).toMatchObject({
				customerName: "Cliente Teste",
				status: "RASCUNHO",
				customerIncome: 5000.5,
				requestedAmount: 10000,
				interestRate: 1.89,
				installmentAmount: 939.22,
				totalAmount: 11270.63,
			});
		});

		it("deve salvar o CPF apenas com dígitos", async () => {
			const response = await request(app.server)
				.post("/propostas")
				.set("Authorization", `Bearer ${corbanToken}`)
				.send({ ...validProposal, customerCpf: "123.456.789-00" });

			expect(response.statusCode).toBe(201);
			expect(response.body.customerCpf).toBe("12345678900");
		});

		it("deve retornar 403 quando OPERADOR tenta criar proposta", async () => {
			const response = await request(app.server)
				.post("/propostas")
				.set("Authorization", `Bearer ${operatorToken}`)
				.send(validProposal);

			expect(response.statusCode).toBe(403);
		});

		it("deve retornar 400 com CPF inválido", async () => {
			const response = await request(app.server)
				.post("/propostas")
				.set("Authorization", `Bearer ${corbanToken}`)
				.send({ ...validProposal, customerCpf: "abc" });

			expect(response.statusCode).toBe(400);
			expect(response.body.issues).toEqual([
				{ field: "customerCpf", message: "Invalid CPF format" },
			]);
		});

		it.each([
			["valor abaixo do mínimo", { requestedAmount: 100 }],
			["valor acima do máximo", { requestedAmount: 999999 }],
			["parcelas fora da tabela", { installments: 7 }],
			["renda negativa", { customerIncome: -1 }],
		])("deve retornar 400 com %s", async (_, overrides) => {
			const response = await request(app.server)
				.post("/propostas")
				.set("Authorization", `Bearer ${corbanToken}`)
				.send({ ...validProposal, ...overrides });

			expect(response.statusCode).toBe(400);
		});
	});

	describe("GET /propostas", () => {
		it("deve listar apenas propostas do CORBAN autenticado", async () => {
			const response = await request(app.server)
				.get("/propostas?limit=100")
				.set("Authorization", `Bearer ${corbanToken}`);

			const corbanIds = new Set(
				response.body.data.map((p: { corbanId: string }) => p.corbanId),
			);

			expect(response.statusCode).toBe(200);
			expect(corbanIds.size).toBe(1);
		});

		it("deve retornar valores monetários como número", async () => {
			const response = await request(app.server)
				.get("/propostas?limit=1")
				.set("Authorization", `Bearer ${operatorToken}`);

			expect(typeof response.body.data[0].totalAmount).toBe("number");
			expect(typeof response.body.data[0].interestRate).toBe("number");
		});

		it("deve paginar e filtrar por status", async () => {
			const response = await request(app.server)
				.get("/propostas?page=1&limit=1&status=APROVADA")
				.set("Authorization", `Bearer ${operatorToken}`);

			expect(response.statusCode).toBe(200);
			expect(response.body.data).toHaveLength(1);
			expect(response.body.data[0].status).toBe("APROVADA");
			expect(response.body.meta).toMatchObject({ page: 1, limit: 1 });
		});

		it("deve filtrar por CPF formatado", async () => {
			const response = await request(app.server)
				.get("/propostas?cpf=333.333.333-33")
				.set("Authorization", `Bearer ${operatorToken}`);

			expect(response.statusCode).toBe(200);
			expect(response.body.data.length).toBeGreaterThan(0);
			expect(response.body.data[0].customerCpf).toBe("33333333333");
		});

		it("deve retornar 400 com filtro de status inválido", async () => {
			const response = await request(app.server)
				.get("/propostas?status=XYZ")
				.set("Authorization", `Bearer ${operatorToken}`);

			expect(response.statusCode).toBe(400);
		});
	});

	describe("GET /propostas/:id", () => {
		it("deve buscar uma proposta própria por ID", async () => {
			const id = await createDraft();

			const response = await request(app.server)
				.get(`/propostas/${id}`)
				.set("Authorization", `Bearer ${corbanToken}`);

			expect(response.statusCode).toBe(200);
			expect(response.body.id).toBe(id);
		});

		it("deve retornar 403 para proposta de outro CORBAN", async () => {
			const id = await createDraft(otherCorbanToken);

			const response = await request(app.server)
				.get(`/propostas/${id}`)
				.set("Authorization", `Bearer ${corbanToken}`);

			expect(response.statusCode).toBe(403);
		});

		it("deve permitir que o OPERADOR consulte qualquer proposta", async () => {
			const id = await createDraft(otherCorbanToken);

			const response = await request(app.server)
				.get(`/propostas/${id}`)
				.set("Authorization", `Bearer ${operatorToken}`);

			expect(response.statusCode).toBe(200);
		});

		it("deve retornar 404 para proposta inexistente", async () => {
			const response = await request(app.server)
				.get("/propostas/nao-existe")
				.set("Authorization", `Bearer ${operatorToken}`);

			expect(response.statusCode).toBe(404);
		});
	});

	describe("PATCH /propostas/:id/status", () => {
		it("deve seguir o fluxo RASCUNHO -> EM_ANALISE -> APROVADA", async () => {
			const id = await createDraft();

			const analysis = await updateStatus(id, { status: "EM_ANALISE" });
			const approval = await updateStatus(id, { status: "APROVADA" });

			expect(analysis.statusCode).toBe(200);
			expect(approval.statusCode).toBe(200);
			expect(approval.body.status).toBe("APROVADA");
		});

		it("deve retornar 403 quando CORBAN tenta alterar status", async () => {
			const id = await createDraft();

			const response = await updateStatus(
				id,
				{ status: "EM_ANALISE" },
				corbanToken,
			);

			expect(response.statusCode).toBe(403);
		});

		it("deve retornar 422 em transição inválida", async () => {
			const id = await createDraft();

			const response = await updateStatus(id, { status: "APROVADA" });

			expect(response.statusCode).toBe(422);
			expect(response.body.error).toBe(
				"Invalid status transition: RASCUNHO -> APROVADA",
			);
		});

		it("deve retornar 422 ao alterar proposta em estado final", async () => {
			const id = await createDraft();
			await updateStatus(id, { status: "CANCELADA" });

			const response = await updateStatus(id, { status: "EM_ANALISE" });

			expect(response.statusCode).toBe(422);
		});

		it("deve exigir motivo ao reprovar", async () => {
			const id = await createDraft();
			await updateStatus(id, { status: "EM_ANALISE" });

			const response = await updateStatus(id, { status: "REPROVADA" });

			expect(response.statusCode).toBe(422);
			expect(response.body.error).toBe("Rejection reason is required");
		});

		it("deve salvar o motivo ao reprovar", async () => {
			const id = await createDraft();
			await updateStatus(id, { status: "EM_ANALISE" });

			const response = await updateStatus(id, {
				status: "REPROVADA",
				rejectionReason: "Renda insuficiente",
			});

			expect(response.statusCode).toBe(200);
			expect(response.body.rejectionReason).toBe("Renda insuficiente");
		});

		it("deve retornar 404 para proposta inexistente", async () => {
			const response = await updateStatus("nao-existe", {
				status: "EM_ANALISE",
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe("DELETE /propostas/:id", () => {
		async function cancel(id: string, token = corbanToken) {
			return request(app.server)
				.delete(`/propostas/${id}`)
				.set("Authorization", `Bearer ${token}`);
		}

		it("deve cancelar proposta alterando status para CANCELADA", async () => {
			const id = await createDraft();

			const response = await cancel(id);

			expect(response.statusCode).toBe(200);
			expect(response.body.status).toBe("CANCELADA");

			// Soft delete: o registro continua existindo.
			const stored = await prisma.proposal.findUnique({ where: { id } });
			expect(stored?.status).toBe("CANCELADA");
		});

		it("deve retornar 403 quando CORBAN cancela proposta de outro", async () => {
			const id = await createDraft(otherCorbanToken);

			const response = await cancel(id);

			expect(response.statusCode).toBe(403);
		});

		it("deve impedir CORBAN de cancelar proposta EM_ANALISE", async () => {
			const id = await createDraft();
			await updateStatus(id, { status: "EM_ANALISE" });

			const response = await cancel(id);

			expect(response.statusCode).toBe(422);
		});

		it("deve permitir OPERADOR cancelar proposta EM_ANALISE", async () => {
			const id = await createDraft();
			await updateStatus(id, { status: "EM_ANALISE" });

			const response = await cancel(id, operatorToken);

			expect(response.statusCode).toBe(200);
			expect(response.body.status).toBe("CANCELADA");
		});

		it("deve retornar 422 ao cancelar proposta já finalizada", async () => {
			const id = await createDraft();
			await cancel(id);

			const response = await cancel(id, operatorToken);

			expect(response.statusCode).toBe(422);
		});
	});
});
