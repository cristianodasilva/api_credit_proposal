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
		customerName:z.string().min(3),
		customerCpf:z.string().regex(cpfRegex,"Invalid CPF format",),
		customerIncome:z.number().positive(),
		requestedAmount:z.number().min(500).max(50000),
		// Parcelamentos permitidos pelo 
		installments:z.coerce.number().refine(
			(value) =>
				[
					6,
					12,
					18,
					24,
					36,
				].includes(value),
				{
					message: "Invalid installments",
				},
				)
				.transform(
					(value) =>
						value as
						| 6
						| 12
						| 18
						| 24
						| 36,
				),
	});

// Tipo reutilizado pelo service para criação da proposta.
export type CreateProposalInput =z.infer<typeof createProposalSchema>;

export const updateProposalStatusSchema =
	z.object({
		status:
			z.enum([
				ProposalStatus.EM_ANALISE,
				ProposalStatus.APROVADA,
				ProposalStatus.REPROVADA,
				ProposalStatus.CANCELADA,
			]),
		// Motivo utilizado quando a proposta for reprovada.		
		rejectionReason:z.string().min(3).optional(),
	});


// Tipo reutilizado pelo service na atualização do status.
export type UpdateProposalStatusInput =
	z.infer<typeof updateProposalStatusSchema>;

// Schema responsável pelos filtros e paginação da listagem.
export const listProposalsQuerySchema =
	z.object({
		// Caso não seja enviada, inicia na primeira página.		
		page:z.coerce.number().min(1).default(1),
		/*
		  Quantidade de registros retornados por página.
		  Limite máximo evita consultas	muito grandes.
		*/
		limit:z.coerce.number().min(1).max(100).default(10),
		// Filtro opcional por status.		
		status:z.nativeEnum(ProposalStatus,).optional(),
		// Filtro opcional pelo CPF do cliente.		
		cpf:z.string().regex(cpfRegex,"Invalid CPF format",).optional(),
	});
// Tipo utilizado pelo service	na consulta paginada.
export type ListProposalsQuery =
	z.infer<typeof listProposalsQuerySchema>;