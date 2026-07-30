import type {
	FastifyInstance,
} from "fastify";
import {
	createProposalSchema,
 updateProposalStatusSchema,
} from "./proposals.schema.js";
import {
	createProposal,
	getProposalById,
	listProposals,
	updateProposalStatus,
	
} from "./proposals.service.js";
import {
	authenticate,
} from "../../shared/middleware/authenticate.js";
import type { UserRole } from "@prisma/client";

export async function proposalsRoutes(app: FastifyInstance,) {
	// Apenas usuários autenticados podem criar propostas.
	app.post("/propostas",{
			preHandler:
				authenticate,
			schema: {
				tags: [
					"Proposals",
				],
				summary:
					"Create credit proposal",
				// Informa ao Swagger que essa rota exige JWT.
				security: [
					{
						bearerAuth: [],
					},
				],
				body: {
					type:
						"object",

					required: [
						"customerName",
						"customerCpf",
						"customerIncome",
						"requestedAmount",
						"installments",
					],
					properties: {
						customerName: {
							type:
								"string",
						},
						customerCpf: {
							type:
								"string",
						},
						customerIncome: {
							type:
								"number",
						},
						requestedAmount: {
							type:
								"number",
						},
						installments: {
							type:
								"number",
							enum: [
								6,
								12,
								18,
								24,
								36,
							],
						},
					},
				},

				response: {
					201: {description: "Proposal created",
						content: {"application/json": {
								schema: {
									type: "object",
									properties: {
										id: { 
											type:
											"string",
										},
										customerName: {
											type:
												"string",
										},
										customerCpf: {
											type:
												"string",
										},
										customerIncome: {
											type:
												"number",
										},
										requestedAmount: {
											type:
												"number",
										},
										installments: {
											type:
												"number",
										},
										interestRate: {
											type:
												"number",
										},
										installmentAmount: {
											type:
												"number",
										},
										totalAmount: {
											type:
												"number",
										},
										status: {
											type:
												"string",
										},
										corbanId: {
											type:
												"string",
										},
									},
								},
							},
						},
					},
					401: { description:	"Unauthorized",	},
				},
			},
		},

		async (request,	reply,) => {
			// Valida os dados recebidos pelo cliente.
			const data =
				createProposalSchema.parse(
					request.body,
				);

			// O ID do CORBAN vem do JWT.			
			const corbanId =
				request.user.sub;

			const proposal =
				await createProposal(
					data,
					corbanId,
				);

			return reply
				.status(201)
				.send(proposal);
		},
	);

	// Lista propostas conforme a permissão do usuário autenticado.
	app.get("/propostas",{
			preHandler:
				authenticate,
			schema: {
				tags: [
					"Proposals",
				],
				summary:
					"List credit proposals",
				// Informa ao Swagger que essa rota exige JWT.
				security: [
					{
						bearerAuth: [],
					},
				],
				response: {
					200: {
						description:
							"List of proposals",
					},
					401: {
						description:
							"Unauthorized",
					},
				},
			},
		},

		async (request,	reply,) => {	
			const userId =
				request.user.sub;
			const role =
				request.user.role as UserRole;
			const proposals =
			    await listProposals(
					userId,
					role,
			   	);

			return reply.status(200).send(proposals);
		},
	);

	// Retorna uma proposta específica pelo ID.
	app.get("/propostas/:id", {
			preHandler:
				authenticate,
			schema: {
				tags: [
					"Proposals",
				],
				summary:
					"Get proposal by id",
				// Informa ao Swagger que a rota exige JWT.
				security: [
					{
						bearerAuth: [],
					},
				],
				params: {
					type:
						"object",
					required: [
						"id",
					],
					properties: {
						id: {
							type:
								"string",
						},
					},
				},

				response: {
					200: {description: "Proposal found",},
					404: {description: "Proposal not found",},
					401: {description:	"Unauthorized",},
				},
			},
		},

		async (request,	reply,) => {
			// ID recebido pela URL.
			const {id,} = request.params as {id: string;};		
			const userId =
				request.user.sub;
			const role =
				request.user.role as UserRole;
			const proposal =
				await getProposalById(
					id,
					userId,
					role,
				);
			/*
			  Caso o CORBAN tente acessar uma proposta de outro usuário,
		      o service retorna null.

			  Retornamos 404 para não revelar a existência do registro.
			*/
			if (!proposal) {
				return reply.status(404).send({error:"Proposal not found",});
			}

			return reply.status(200).send(proposal);
		},
	);

	// Atualiza o status de uma proposta.
	app.patch("/propostas/:id/status", {
			preHandler:
				authenticate,
			schema: {
				tags: [
					"Proposals",
				],
				summary:
					"Update proposal status",
				security: [
					{
						bearerAuth: [],
					},
				],
				params: {
					type:
						"object",
					required: [
						"id",
					],
					properties: {
						id: {
							type:
								"string",
						},
					},
				},
				body: {
					type:
						"object",
					required: [
						"status",
					],
					properties: {
						status: {
							type:
								"string",
							enum: [
								"RASCUNHO",
								"EM_ANALISE",
								"APROVADA",
								"REJEITADA",
								"CANCELADA",
							],
						},
						rejectionReason: {
							type:
								"string",
						},
					},
				},
			},
		},

		async (request,	reply,) => {
			const {id,} =
				request.params as {
					id: string;
				};

			const data =
				updateProposalStatusSchema.parse(
					request.body,
				);

			const proposal =
				await updateProposalStatus(
					id,
					data,
				);

			return reply.status(200).send(proposal);
		},
	);
}

