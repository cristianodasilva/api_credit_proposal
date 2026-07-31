import type {
	FastifyInstance,
} from "fastify";
import { authenticateUser } from "./auth.service.js";
import { loginSchema } from "./auth.schema.js";
import { authenticate } from "../../shared/middleware/authenticate.js";
import { prisma } from "../../infra/database/prisma.js";
import { UserRole } from "@prisma/client";

export async function authRoutes(
	app: FastifyInstance,
) {
	// Login da aplicação. Retorna JWT válido por 8h.
	app.post("/auth/login", {
			schema: {
				tags: [
					"Auth",
				],
				summary:
					"Login",
				body: {
					type:
						"object",
					required: [
						"email",
						"password",
					],
					properties: {
						email: {
							type:
								"string",
						},
						password: {
							type:
								"string",
						},
					},
				},
			},
		},

		async (request, reply,) => {
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
				
				const payload = {
					sub:
						user.id,
					role:
						user.role,
					perfil:
						user.role,
				};

				/*
				  O corbanId só deve existir
				  quando o usuário autenticado
				  for um CORBAN.
				  OPERADOR não possui vínculo
				  com um CORBAN específico.
				*/
				if (
					user.role === UserRole.CORBAN
				) {
					Object.assign(
						payload,
						{
							corbanId:
								user.id,
						},
					);
				}
				/*
				  A expiração de 8 horas é configurada no registro
				  do plugin @fastify/jwt.
				*/
				const token =
					await app.jwt.sign(
						payload,
					);

				return reply.send({token,});

			} catch {

				/*
				  Credenciais inválidas:
				  - usuário inexistente;
				  - senha incorreta.
				  Retorna 401 
				*/
				return reply.status(401).send({error:"Invalid credentials",});
			}
		},
	);

	// Retorna dados do usuário autenticado.
	app.get("/auth/me", {
			preHandler: [
				authenticate,
			],
			schema: {
				tags: [
					"Auth",
				],
				summary:
					"Authenticated user",
				// Informa ao Swagger que a rota exige JWT.
				security: [
					{
						bearerAuth: [],
					},
				],
				response: {
					200: {
						type:
							"object",
						properties: {
							id: {
								type:
									"string",
							},
							email: {
								type:
									"string",
							},
							name: {
								type:
									"string",
							},
							role: {
								type:
									"string",
							},
						},
					},
					401: {description:"Unauthorized",},
				},
			},
		},

		async (request,) => {
			// O usuário autenticado é recuperado 			
			const userId =
				request.user.sub;
			const user =
				await prisma.user.findUnique({
					where: {
						id:
							userId,
					},
					select: {
						id:
							true,
						name:
							true,
						email:
							true,
						role:
							true,
					},
				});

			return user;
		},
	);
}