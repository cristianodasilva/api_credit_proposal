import { z } from "zod";

// Validação do payload recebido no endpoint de login.
export const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export type LoginSchema = z.infer<
	typeof loginSchema
>;