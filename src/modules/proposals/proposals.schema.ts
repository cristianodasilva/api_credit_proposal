import { ProposalStatus } from "@prisma/client";
import { z } from "zod";
import { INSTALLMENT_OPTIONS } from "../../shared/utils/credit-calculator.js";

// Aceita: 12345678900 ou 123.456.789-00
const cpfRegex = /^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;

/*
  O CPF é sempre salvo apenas com dígitos.
  Assim o filtro encontra a proposta independente
  do formato enviado na criação ou na busca.
*/
const cpfSchema = z
	.string()
	.regex(cpfRegex, "Invalid CPF format")
	.transform((value) => value.replace(/\D/g, ""));

/*
  Schema responsável por validar a criação
  de uma nova proposta.
*/
export const createProposalSchema = z.object({
	customerName: z.string().trim().min(3),
	customerCpf: cpfSchema,
	customerIncome: z.number().positive(),
	requestedAmount: z.number().min(500).max(50000),
	// Parcelamentos permitidos pela tabela de taxas.
	installments: z.literal(INSTALLMENT_OPTIONS, {
		error: "Invalid installments",
	}),
});

// Tipo reutilizado pelo service para criação da proposta.
export type CreateProposalInput = z.infer<typeof createProposalSchema>;

export const updateProposalStatusSchema = z.object({
	status: z.enum([
		ProposalStatus.EM_ANALISE,
		ProposalStatus.APROVADA,
		ProposalStatus.REPROVADA,
		ProposalStatus.CANCELADA,
	]),
	// Motivo utilizado quando a proposta for reprovada.
	rejectionReason: z.string().trim().min(3).optional(),
});

// Tipo reutilizado pelo service na atualização do status.
export type UpdateProposalStatusInput = z.infer<
	typeof updateProposalStatusSchema
>;

// Schema responsável pelos filtros e paginação da listagem.
export const listProposalsQuerySchema = z.object({
	// Caso não seja enviada, inicia na primeira página.
	page: z.coerce.number().int().min(1).default(1),
	/*
	  Quantidade de registros retornados por página.
	  Limite máximo evita consultas muito grandes.
	*/
	limit: z.coerce.number().int().min(1).max(100).default(10),
	// Filtro opcional por status.
	status: z.enum(ProposalStatus).optional(),
	// Filtro opcional pelo CPF do cliente.
	cpf: cpfSchema.optional(),
});

// Tipo utilizado pelo service na consulta paginada.
export type ListProposalsQuery = z.infer<typeof listProposalsQuerySchema>;
