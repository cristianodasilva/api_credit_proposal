import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "@prisma/client";

/*
  Responsável por validar o JWT enviado no header.
  Casos tratados:
  - token inexistente;
  - token inválido;
  - token expirado.
*/
export async function authenticate(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	try {
		await request.jwtVerify();
	} catch (error) {
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === "FST_JWT_AUTHORIZATION_TOKEN_EXPIRED"
		) {
			return reply.status(401).send({ error: "Token expired" });
		}

		return reply.status(401).send({ error: "Unauthorized" });
	}
}

/*
  Restringe a rota aos perfis informados.
  Deve ser executado depois do authenticate.
*/
export function authorize(...roles: UserRole[]) {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		if (!roles.includes(request.user.role)) {
			return reply.status(403).send({ error: "Forbidden" });
		}
	};
}
