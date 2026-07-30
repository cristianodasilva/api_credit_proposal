import type { FastifyInstance } from "fastify";
import { authenticateUser } from "./auth.service.js";
import { loginSchema } from "./auth.schema.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { prisma } from "../../infra/database/prisma.js";

export async function authRoutes(
	app: FastifyInstance,
) {
	// Login da aplicação. Retorna JWT válido por 8h.	
	app.post(
		"/auth/login",
		{
			schema: {
				tags: ["Auth"],
				summary: "Login",
				body: {
					type: "object",
					required: [
						"email",
						"password",
					],
					properties: {
						email: {
							type: "string",
						},
						password: {
							type: "string",
						},
					},
				},
			},
		},
		async (request, reply) => {
			try {
				const body =
					loginSchema.parse(
						request.body,
					);

				const user =
					await authenticateUser(
						body.email,
						body.password,
					);

				/*
					Todo usuário possui:
					- sub (id do usuário)
					- role (perfil de acesso)

					O corbanId só deve existir quando o usuário for CORBAN.
					Isso evita problemas com exactOptionalPropertyTypes.
				*/
				const payload = {
					sub: user.id,
					role: user.role,
				};

				// Adiciona corbanId apenas para usuários CORBAN.				
				if (user.role === "CORBAN") {
					Object.assign(payload, {
						corbanId: user.id,
					});
				}

				const token =
					await app.jwt.sign(payload);

				return reply.send({
					token,
				});
			} catch {
				return reply
					.status(401)
					.send({
						error:
							"Invalid credentials",
					});
			}
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

			security: [
				{
					bearerAuth: [],
	        	},
	        ],

				response: {
					200: {
						type: "object",
						properties: {
							id: {
								type: "string",
							},
							email: {
								type: "string",
							},
							name: {
								type: "string",
							},
							role: {
								type: "string",
							},
						},
					},
				},
			},
		},
		async (request) => {
			// O usuário autenticado é recuperado através do payload do JWT.	
			const userId = request.user.sub;

			const user =
				await prisma.user.findUnique({
					where: {
						id: userId,
					},
					select: {
						id: true,
						name: true,
						email: true,
						role: true,
					},
				});

			return user;
		},
	);
}