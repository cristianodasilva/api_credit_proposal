import { ProposalStatus } from "@prisma/client";
import { errorResponse } from "../../shared/swagger.js";
import { INSTALLMENT_OPTIONS } from "../../shared/utils/credit-calculator.js";

/*
  JSON Schemas usados pelo Fastify para documentar (Swagger)
  e serializar as rotas de propostas.
  As regras de negócio dos payloads são validadas pelo Zod.
*/

const proposal = {
	type: "object",
	properties: {
		id: { type: "string" },
		customerName: { type: "string" },
		customerCpf: { type: "string" },
		customerIncome: { type: "number" },
		requestedAmount: { type: "number" },
		installments: { type: "integer" },
		interestRate: { type: "number" },
		installmentAmount: { type: "number" },
		totalAmount: { type: "number" },
		status: { type: "string", enum: Object.values(ProposalStatus) },
		rejectionReason: { type: ["string", "null"] },
		corbanId: { type: "string" },
		createdAt: { type: "string", format: "date-time" },
		updatedAt: { type: "string", format: "date-time" },
	},
};

const idParams = {
	type: "object",
	required: ["id"],
	properties: {
		id: { type: "string" },
	},
};

const common = {
	tags: ["Proposals"],
	// Informa ao Swagger que as rotas exigem JWT.
	security: [{ bearerAuth: [] }],
};

export const createProposalDocs = {
	...common,
	summary: "Create credit proposal (CORBAN)",
	body: {
		type: "object",
		required: [
			"customerName",
			"customerCpf",
			"customerIncome",
			"requestedAmount",
			"installments",
		],
		properties: {
			customerName: { type: "string", minLength: 3 },
			customerCpf: { type: "string", examples: ["12345678900"] },
			customerIncome: { type: "number" },
			requestedAmount: { type: "number", minimum: 500, maximum: 50000 },
			installments: { type: "integer", enum: [...INSTALLMENT_OPTIONS] },
		},
	},
	response: {
		201: { description: "Proposal created", ...proposal },
		400: errorResponse("Validation error"),
		401: errorResponse("Unauthorized"),
		403: errorResponse("Only CORBAN users can create proposals"),
	},
};

export const listProposalsDocs = {
	...common,
	summary: "List credit proposals",
	querystring: {
		type: "object",
		properties: {
			page: { type: "integer", minimum: 1, default: 1 },
			limit: { type: "integer", minimum: 1, maximum: 100, default: 10 },
			status: { type: "string", enum: Object.values(ProposalStatus) },
			cpf: { type: "string" },
		},
	},
	response: {
		200: {
			description: "List of proposals",
			type: "object",
			properties: {
				data: { type: "array", items: proposal },
				meta: {
					type: "object",
					properties: {
						page: { type: "integer" },
						limit: { type: "integer" },
						total: { type: "integer" },
						totalPages: { type: "integer" },
					},
				},
			},
		},
		400: errorResponse("Validation error"),
		401: errorResponse("Unauthorized"),
	},
};

export const getProposalDocs = {
	...common,
	summary: "Get proposal by id",
	params: idParams,
	response: {
		200: { description: "Proposal found", ...proposal },
		401: errorResponse("Unauthorized"),
		403: errorResponse("Forbidden"),
		404: errorResponse("Proposal not found"),
	},
};

export const updateProposalStatusDocs = {
	...common,
	summary: "Update proposal status (OPERATOR)",
	params: idParams,
	body: {
		type: "object",
		required: ["status"],
		properties: {
			status: {
				type: "string",
				enum: ["EM_ANALISE", "APROVADA", "REPROVADA", "CANCELADA"],
			},
			rejectionReason: {
				type: "string",
				description: "Required when status is REPROVADA",
			},
		},
	},
	response: {
		200: { description: "Proposal updated", ...proposal },
		400: errorResponse("Validation error"),
		401: errorResponse("Unauthorized"),
		403: errorResponse("Only operators can update proposal status"),
		404: errorResponse("Proposal not found"),
		409: errorResponse("Proposal was modified by another request"),
		422: errorResponse("Invalid status transition"),
	},
};

export const cancelProposalDocs = {
	...common,
	summary: "Cancel proposal (soft delete)",
	params: idParams,
	response: {
		200: { description: "Proposal cancelled", ...proposal },
		401: errorResponse("Unauthorized"),
		403: errorResponse("Forbidden"),
		404: errorResponse("Proposal not found"),
		409: errorResponse("Proposal was modified by another request"),
		422: errorResponse("Invalid cancellation"),
	},
};
