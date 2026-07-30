import { z } from "zod";

// Aceitar = 12345678900 ou 123.456.789-00
const cpfRegex =
	/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/;

// Schema utilizado para criar	uma nova proposta.
export const createProposalSchema =
	z.object({
		customerName: z
			.string()
			.min(3),

		customerCpf: z
			.string()
			.regex(
				cpfRegex,
				"Invalid CPF format",
			),

		customerIncome: z
			.number()
			.positive(),

		requestedAmount: z
			.number()
			.min(500)
			.max(50000),

        // Utiliza enum para bloquear valor inválido.
		installments: z.enum([
			"6",
			"12",
			"18",
			"24",
			"36",
		]),
	});