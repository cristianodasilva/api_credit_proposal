import { createApp } from "../src/app.js";

export async function getTestApp() {
	const app =
		await createApp();

	await app.ready();

	return app;
}