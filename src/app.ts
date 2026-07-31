import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import { registerSwagger } from "./shared/swagger.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { proposalsRoutes } from "./modules/proposals/proposals.routes.js";


export async function createApp() {
	// Instância principal do Fastify.
	const app = Fastify({
		logger: {
			level: 'error',
		}
	});

	/*
	  Registro do JWT.
	  O plugin adiciona recursos para:
	  - gerar token
	  - validar token
	*/
	await app.register(fastifyJwt, {
		secret:
			process.env.JWT_SECRET ??
			"development-secret",
		// Todo token emitido pela API terá validade de 8 horas
		sign: {
			expiresIn: "8h",
		},
	});

	// Swagger
	await registerSwagger(app);

	// Autenticação
	await app.register(authRoutes);

	// Propostas
	await app.register(proposalsRoutes);

	return app;
}