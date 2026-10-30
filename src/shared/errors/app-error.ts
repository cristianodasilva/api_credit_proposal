/*
  Erro de regra de negócio.
  Carrega o status HTTP que deve ser devolvido ao cliente,
  evitando que as rotas precisem comparar mensagens de erro.
*/
export class AppError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
	) {
		super(message);
		this.name = "AppError";
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Proposal not found") {
		super(message, 404);
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(message, 403);
	}
}

export class UnprocessableError extends AppError {
	constructor(message: string) {
		super(message, 422);
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, 401);
	}
}
