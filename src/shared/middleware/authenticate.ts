import type {
	FastifyReply,
	FastifyRequest,
} from "fastify";


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
			error.code ===
				"FST_JWT_AUTHORIZATION_TOKEN_EXPIRED"
		) {
			return reply.status(401).send({error:"Token expirado",});
		}

		return reply.status(401).send({error: "Unauthorized",});
	}
}