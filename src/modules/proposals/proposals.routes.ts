import type {
	FastifyInstance,
} from "fastify";
import {
	createProposalSchema,
 listProposalsQuerySchema,
 updateProposalStatusSchema,
} from "./proposals.schema.js";
import {
	cancelProposal,
	createProposal,
	getProposalById,
	listProposals,
	updateProposalStatus,
	
} from "./proposals.service.js";
import {
	authenticate,
} from "../../shared/middleware/authenticate.js";
import { UserRole } from "@prisma/client";

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

	// Lista propostas conforme permissão, paginação e filtros informados.	
	app.get("/propostas", {
			preHandler:
				authenticate,
			schema: {
				tags: [
					"Proposals",
				],
				summary: "List credit proposals",
				// Informa ao Swagger que a rota exige JWT.
				security: [
					{
						bearerAuth: [],
					},
				],
				querystring: {
					type:
						"object",
					properties: {
						page: {
							type:
								"number",
						},
						limit: {
							type:
								"number",
						},
						status: {
							type:
								"string",
						},
						cpf: {
							type:
								"string",
						},
					},
				},

				response: {
					200: {description: "List of proposals",},
					401: {description: "Unauthorized",},
				},
			},
		},

		async (request, reply,) => {
		/*
		  CORBAN:será utilizado para restringir a busca.
    	  OPERATOR:	terá acesso geral.
		*/
		const userId =	request.user.sub;

        const role = request.user.role as UserRole;

		// Valida e transforma os filtros enviados na query.
		const query =
		    	listProposalsQuerySchema.parse(
					request.query,
				);

		const proposals =
				await listProposals(
					userId,
					role,
					query,
				);

			return reply.status(200).send(proposals);},
	);

	// Retorna uma proposta específica pelo ID.
    app.get("/propostas/:id", {
		preHandler:
			authenticate,
		schema: {
			tags: [
				"Proposals",
			],
			summary: "Get proposal by id",
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
				401: {description: "Unauthorized",},
				403: {description: "Forbidden",},
				404: {description: "Proposal not found",},
			},
		},
	},

	async (request,reply,) => {
		// ID recebido pela URL.
		const {
			id,
		} =
			request.params as {
				id:
					string;
			};
		// Usuário autenticado pelo JWT.
		const userId =
			request.user.sub;
		// Perfil do usuário autenticado.
		const role =
			request.user.role as UserRole;

		const result =
			await getProposalById(
				id,
				userId,
				role,
			);
		/*
		  Caso a proposta exista,
		  mas pertença a outro CORBAN: 
		  403 Forbidden
		*/
		if (
			result.forbidden
		) {
			return reply
				.status(403)
				.send({
					error:
						"Access denied",
				});
		}
		// Caso não exista nenhuma proposta com o ID informado.		
		if (
			!result.proposal
		) {
			return reply
				.status(404)
				.send({
					error:
						"Proposal not found",
				});
		}
		// Proposta encontrada e usuário possui permissão de acesso.		
		return reply.status(200).send(result.proposal,);
	},);

	// Atualiza o status de uma proposta.
	app.patch("/propostas/:id/status", {
			preHandler:
				authenticate,
			schema: {
				tags: [
					"Proposals",
				],
				summary: "Update proposal status",
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
								"EM_ANALISE",
								"APROVADA",
								"REPROVADA",
								"CANCELADA",
							],
						},
						rejectionReason: {
							type:
								"string",
						},
					},
				},

				response: {
					200: {description: "Proposal updated",},
					401: {description: "Unauthorized",},
					403: {description: "Forbidden",},
					404: {description: "Proposal not found",},
					422: {description: "Invalid status transition",},
				},
			},
		},

		async (request, reply,) => {
			// ID da proposta recebido pela URL.
			const { id, } =
				request.params as {
					id: string;
				};
			// Valida o body.
			const data =
				updateProposalStatusSchema.parse(
					request.body,
				);
			// Perfil do usuário autenticado.
			const role =
				request.user.role as UserRole;

			// Apenas OPERADOR pode alterar status de propostas.
			if (
				role !== UserRole.OPERATOR
			) {
				return reply.status(403).send({
					error: "Only operators can update proposal status",
				});
			}

			try {
				const proposal =
					await updateProposalStatus(
						id,
						data,
					);

				return reply
					.status(200)
					.send(proposal);
			} catch (error) {
				/*
			      Erros de regra de negócio:
				  - transição inválida
				  - proposta inexistente
				*/
				if (
					error instanceof Error
				) {
					if (
						error.message ===
						"Proposal not found"
					) {
						return reply.status(404).send({
							error:
								error.message,
						});
					}

					return reply.status(422).send({
						error:
							error.message,
					});
				}

				throw error;
			}
		},
	);

	// Cancelam (soft delete) uma proposta.
	app.delete("/propostas/:id", {
			preHandler:
				authenticate,
			schema: {
				tags: [
					"Proposals",
				],
				summary:
					"Cancel proposal",
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
					200: {description: "Proposal cancelled",},
					401: {description: "Unauthorized",},
					403: {description: "Forbidden",},
					404: {description: "Proposal not found",},
					422: {description: "Invalid cancellation",},
				},
			},
		},

		async (request, reply,) => {
			// ID da proposta recebido pela URL.
			const {
				id,
			} =
				request.params as {
					id:
						string;
				};
			// Dados do usuário autenticado.
			const userId =
				request.user.sub;

			const role =
				request.user.role as UserRole;

			try {
				const proposal =
					await cancelProposal(
						id,
						userId,
						role,
					);

				return reply.status(200).send(proposal);

			} catch (error) {

				/*
				  Tratamento dos erros:
				  - proposta inexistente;
				  - usuário sem permissão;
				  - tentativa de cancelar proposta em estado inválido.
				*/
				if (
					error instanceof Error
				) {
					if (
						error.message === "Proposal not found"
					) {
						return reply.status(404).send({error: error.message,});
					}
					if (
						error.message === "Forbidden"
					) {
						return reply.status(403).send({error: error.message,});
					}
					return reply.status(422).send({error: error.message,});
				}

				throw error;
			}
		},
	);
}