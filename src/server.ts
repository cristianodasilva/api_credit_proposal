import "dotenv/config";
import { createApp } from "./app.js";


// Criamos nossa aplicação.
const app = createApp();

/*
	Inicia o servidor HTTP. Porta vem do .env.
	Caso não exista, usa 3333 como padrão.
*/
app.listen({
	port: Number(process.env.PORT) || 3333,
	// 0.0.0.0 permite acesso externo.
	host: "0.0.0.0",

})
.then(() => {

	console.log(
		"HTTP server running",
	);

})
.catch((error) => {
	app.log.error(error);
	process.exit(1);

});