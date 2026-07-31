import bcrypt from "bcrypt";

import { prisma } from "../../infra/database/prisma.js";

/*
  Responsável pela regra de autenticação.
  Recebe email e senha, busca o usuário e valida o hash da senha.
*/
export async function authenticateUser(
	email: string,
	password: string,
) {
	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		throw new Error("Invalid credentials");
	}

	const passwordMatches =
		await bcrypt.compare(
			password,
			user.passwordHash,
		);

	if (!passwordMatches) {
		throw new Error("Invalid credentials");
	}

	return user;
}