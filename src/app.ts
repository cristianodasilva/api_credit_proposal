import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import { registerSwagger } from "./shared/swagger.js";
import { errorHandler } from "./shared/errors/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { proposalsRoutes } from "./modules/proposals/proposals.routes.js";

export async function createApp() {
	/*
	  Sem uma chave definida, qualquer pessoa poderia gerar tokens válidos.
	  Por isso a aplicação não sobe sem o JWT_SECRET.
	*/
	const jwtSecret = process.env.JWT_SECRET;

	if (!jwtSecret) {
		throw new Error("JWT_SECRET environment variable is required");
	}

	// Instância principal do Fastify.
	const app = Fastify({
		logger: {
			level: process.env.LOG_LEVEL ?? "error",
		},
	});

	/*
	  Registro do JWT.
	  O plugin adiciona recursos para:
	  - gerar token
	  - validar token
	*/
	await app.register(fastifyJwt, {
		secret: jwtSecret,
		// Todo token emitido pela API terá validade de 8 horas
		sign: {
			expiresIn: "8h",
		},
	});

	// Tratamento centralizado de erros.
	app.setErrorHandler(errorHandler);

	// Swagger
	await registerSwagger(app);

	// Autenticação
	await app.register(authRoutes);

	// Propostas
	await app.register(proposalsRoutes);

	return app;
}
