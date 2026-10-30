import bcrypt from "bcrypt";

import { prisma } from "../../infra/database/prisma.js";
import {
	NotFoundError,
	UnauthorizedError,
} from "../../shared/errors/app-error.js";

/*
  Responsável pela regra de autenticação.
  Recebe email e senha, busca o usuário e valida o hash da senha.
  Usuário inexistente e senha incorreta retornam o mesmo erro
  para não revelar quais emails estão cadastrados.
*/
export async function authenticateUser(email: string, password: string) {
	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		throw new UnauthorizedError("Invalid credentials");
	}

	const passwordMatches = await bcrypt.compare(password, user.passwordHash);

	if (!passwordMatches) {
		throw new UnauthorizedError("Invalid credentials");
	}

	return user;
}

// Retorna os dados públicos do usuário autenticado.
export async function getAuthenticatedUser(userId: string) {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
		},
	});

	// O token pode ser válido mesmo após o usuário ser removido.
	if (!user) {
		throw new NotFoundError("User not found");
	}

	return user;
}
