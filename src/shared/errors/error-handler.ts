import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "./app-error.js";

/*
  Tratamento centralizado de erros.
  - ZodError: payload inválido -> 400 com os campos inválidos;
  - Validação do Fastify (JSON Schema) -> 400;
  - AppError: regra de negócio -> status definido no erro;
  - Qualquer outro erro -> 500 sem expor detalhes internos.
*/
export function errorHandler(
	error: FastifyError,
	request: FastifyRequest,
	reply: FastifyReply,
) {
	if (error instanceof ZodError) {
		return reply.status(400).send({
			error: "Validation error",
			issues: error.issues.map((issue) => ({
				field: issue.path.join("."),
				message: issue.message,
			})),
		});
	}

	if (error.validation) {
		return reply.status(400).send({
			error: "Validation error",
			message: error.message,
		});
	}

	if (error instanceof AppError) {
		return reply.status(error.statusCode).send({ error: error.message });
	}

	request.log.error(error);

	return reply.status(500).send({ error: "Internal server error" });
}
