import type { FastifyInstance } from "fastify";
import { authenticateUser, getAuthenticatedUser } from "./auth.service.js";
import { loginSchema } from "./auth.schema.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { errorResponse } from "../../shared/swagger.js";

export async function authRoutes(app: FastifyInstance) {
	// Login da aplicação. Retorna JWT válido por 8h.
	app.post(
		"/auth/login",
		{
			schema: {
				tags: ["Auth"],
				summary: "Login",
				body: {
					type: "object",
					required: ["email", "password"],
					properties: {
						email: { type: "string", format: "email" },
						password: { type: "string" },
					},
				},
				response: {
					200: {
						type: "object",
						properties: {
							token: { type: "string" },
						},
					},
					400: errorResponse("Validation error"),
					401: errorResponse("Invalid credentials"),
				},
			},
		},

		async (request, reply) => {
			const body = loginSchema.parse(request.body);

			const user = await authenticateUser(body.email, body.password);

			/*
			  A expiração de 8 horas é configurada no registro
			  do plugin @fastify/jwt.
			*/
			const token = await reply.jwtSign({
				sub: user.id,
				role: user.role,
			});

			return reply.send({ token });
		},
	);

	// Retorna dados do usuário autenticado.
	app.get(
		"/auth/me",
		{
			preHandler: [authenticate],
			schema: {
				tags: ["Auth"],
				summary: "Authenticated user",
				// Informa ao Swagger que a rota exige JWT.
				security: [{ bearerAuth: [] }],
				response: {
					200: {
						type: "object",
						properties: {
							id: { type: "string" },
							email: { type: "string" },
							name: { type: "string" },
							role: { type: "string" },
						},
					},
					401: errorResponse("Unauthorized"),
					404: errorResponse("User not found"),
				},
			},
		},

		async (request) => getAuthenticatedUser(request.user.sub),
	);
}
