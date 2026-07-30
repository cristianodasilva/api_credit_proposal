import {
	ProposalStatus,
} from "@prisma/client";
import { z } from "zod";


// Aceita: 12345678900 ou 123.456.789-00
const cpfRegex =
	/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;


/*
	Schema responsável por validar a criação
	de uma nova proposta.
*/
export const createProposalSchema =
	z.object({
		customerName:
			z.string()
				.min(3),

		customerCpf:
			z.string()
				.regex(
					cpfRegex,
					"Invalid CPF format",
				),

		customerIncome:
			z.number()
				.positive(),

		requestedAmount:
			z.number()
				.min(500)
				.max(50000),

		// Parcelamentos permitidos pelo desafio.
		installments:
	z.coerce.number()
		.refine(
			(value) =>
				[
					6,
					12,
					18,
					24,
					36,
				].includes(value),
			{
				message:
					"Invalid installments",
			},
		)
		.transform(
			(value) =>
				value as 6 | 12 | 18 | 24 | 36,
		),
	});


/*
	Tipo reutilizado pelo service
	para criação da proposta.
*/
export type CreateProposalInput =
	z.infer<
		typeof createProposalSchema
	>;



/*
	Schema responsável pela alteração
	do status da proposta.

	O enum vem diretamente do Prisma
	para manter o contrato sincronizado
	com o banco.
*/
export const updateProposalStatusSchema =
	z.object({
		status:
			z.enum([
				ProposalStatus.EM_ANALISE,
				ProposalStatus.APROVADA,
				ProposalStatus.REPROVADA,
				ProposalStatus.CANCELADA,
			]),

		/*
			Motivo utilizado quando a proposta
			for rejeitada.
		*/
		rejectionReason:
			z.string()
				.min(3)
				.optional(),
	});


/*
	Tipo reutilizado pelo service
	na atualização do status.
*/
export type UpdateProposalStatusInput =
	z.infer<
		typeof updateProposalStatusSchema
	>;