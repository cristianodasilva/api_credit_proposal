import type { FastifyInstance } from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

/*
	Configuração da documentação OpenAPI.
	O Swagger não cria rotas da API.
	Ele apenas documenta as rotas que registrarmos posteriormente.
*/
export async function registerSwagger(
	app: FastifyInstance,
) {
	await app.register(swagger, {
		openapi: {
			info: {
				title: "Neo Crédito API",
				description:
					"API para gerenciamento de propostas de crédito",
				version: "1.0.0",
			},

			// Configuração da autenticação JWT.
			components: {
				securitySchemes: {
					bearerAuth: {
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
					},
				},
			},
		},
	});

	//Documentação disponível em: http://localhost:3333/docs	
	await app.register(swaggerUi, {
		routePrefix: "/docs",
	});
}