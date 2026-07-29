import Fastify from "fastify";


export function createApp() {
	const app = Fastify({
		logger: true,
	});


	/*
		Rota inicial apenas para validar
		que o servidor está respondendo.

		Depois ela pode ser removida ou substituída
		pela documentação Swagger.
	*/
	app.get("/", async () => {
		return {
			message: "API Credit Proposal running",
		};
	});


	return app;
}