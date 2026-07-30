import "dotenv/config";
import { createApp } from "./app.js";

// Função responsável por subir	o servidor HTTP.
async function bootstrap() {
	const app = await createApp();

	try {
		await app.listen({
			port:
				Number(process.env.PORT) ||
				3333,
			// Permite acesso externo. Importante para Docker.			
			host: "0.0.0.0",
		});

		console.log(
			"HTTP server running",
		);
	} catch (error) {
		app.log.error(error);

		process.exit(1);
	}
}

bootstrap();