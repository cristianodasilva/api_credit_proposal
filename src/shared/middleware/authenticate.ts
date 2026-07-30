import type {
	FastifyReply,
	FastifyRequest,
} from "fastify";

/*
  Responsável por validar o token JWT enviado no header.

  Se o token for inválido ou inexistente, o Fastify retorna 401 automaticamente.
*/
export async function authenticate(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	await request.jwtVerify();
}