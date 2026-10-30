import type { FastifyInstance } from "fastify";
import { UserRole } from "@prisma/client";
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
	cancelProposalDocs,
	createProposalDocs,
	getProposalDocs,
	listProposalsDocs,
	updateProposalStatusDocs,
} from "./proposals.docs.js";
import {
	authenticate,
	authorize,
} from "../../shared/middleware/authenticate.js";

/*
  Erros de validação e de regra de negócio são lançados
  pelo Zod e pelo service, e convertidos em resposta HTTP
  pelo error handler global.
*/
export async function proposalsRoutes(app: FastifyInstance) {
	// Apenas CORBAN pode criar propostas.
	app.post(
		"/propostas",
		{
			preHandler: [authenticate, authorize(UserRole.CORBAN)],
			schema: createProposalDocs,
		},
		async (request, reply) => {
			const data = createProposalSchema.parse(request.body);

			// O ID do CORBAN vem do JWT.
			const proposal = await createProposal(data, request.user.sub);

			return reply.status(201).send(proposal);
		},
	);

	// Lista propostas conforme permissão, paginação e filtros informados.
	app.get(
		"/propostas",
		{
			preHandler: [authenticate],
			schema: listProposalsDocs,
		},
		async (request) => {
			const query = listProposalsQuerySchema.parse(request.query);

			return listProposals(request.user.sub, request.user.role, query);
		},
	);

	// Retorna uma proposta específica pelo ID.
	app.get<{ Params: { id: string } }>(
		"/propostas/:id",
		{
			preHandler: [authenticate],
			schema: getProposalDocs,
		},
		async (request) =>
			getProposalById(request.params.id, request.user.sub, request.user.role),
	);

	// Atualiza o status de uma proposta. Apenas OPERADOR.
	app.patch<{ Params: { id: string } }>(
		"/propostas/:id/status",
		{
			preHandler: [authenticate, authorize(UserRole.OPERATOR)],
			schema: updateProposalStatusDocs,
		},
		async (request) => {
			const data = updateProposalStatusSchema.parse(request.body);

			return updateProposalStatus(request.params.id, data);
		},
	);

	// Cancela (soft delete) uma proposta.
	app.delete<{ Params: { id: string } }>(
		"/propostas/:id",
		{
			preHandler: [authenticate],
			schema: cancelProposalDocs,
		},
		async (request) =>
			cancelProposal(request.params.id, request.user.sub, request.user.role),
	);
}
