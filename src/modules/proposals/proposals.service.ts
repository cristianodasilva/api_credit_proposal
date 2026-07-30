import {
	ProposalStatus,
	UserRole,
} from "@prisma/client";

import type {
	CreateProposalInput,
	UpdateProposalStatusInput,
} from "./proposals.schema.js";

import { calculateProposal } from "../../shared/utils/credit-calculator.js";
import { prisma } from "../../infra/database/prisma.js";


// Service responsável pelas regras de negócio das propostas.
export async function createProposal(
	data: CreateProposalInput,
	corbanId: string,
) {
	/*
	  Calcula automaticamente:
	  - taxa de juros;
	  - valor da parcela;
	  - valor total.
	*/
	const calculation =
		calculateProposal(
			data.requestedAmount,
			data.installments,
		);


	// Cria a proposta vinculada ao CORBAN autenticado.
	const proposal =
		await prisma.proposal.create({
			data: {
				customerName:
					data.customerName,

				customerCpf:
					data.customerCpf,

				customerIncome:
					data.customerIncome,

				requestedAmount:
					data.requestedAmount,

				installments:
					data.installments,

				interestRate:
					calculation.interestRate,

				installmentAmount:
					calculation.installmentAmount,

				totalAmount:
					calculation.totalAmount,


				// Toda proposta inicia em RASCUNHO.
				status:
					ProposalStatus.RASCUNHO,


				// Dono da proposta.
				corbanId,
			},
		});

	return proposal;
}



/*
	Lista as propostas de acordo com a regra de negócio.

	- CORBAN:
	  Visualiza apenas propostas criadas por ele.

	- OPERATOR:
	  Possui acesso a todas as propostas.
*/
export async function listProposals(
	userId: string,
	role: UserRole,
) {

	const where =
		role === UserRole.CORBAN
			? {
				corbanId:
					userId,
			}
			: undefined;


	const proposals =
		await prisma.proposal.findMany({
			...(where && {
				where,
			}),

			orderBy: {
				createdAt:
					"desc",
			},
		});


	return proposals;
}



/*
	Busca uma proposta específica.

	- CORBAN:
	  Só acessa propostas próprias.

	- OPERATOR:
	  Pode consultar qualquer proposta.
*/
export async function getProposalById(
	proposalId: string,
	userId: string,
	role: UserRole,
) {

	const where =
		role === UserRole.CORBAN
			? {
				id: proposalId,
				corbanId: userId,
			}
			: {
				id: proposalId,
			};


	const proposal =
		await prisma.proposal.findFirst({
			where,
		});


	return proposal;
}



/*
	Atualiza o status de uma proposta.
*/
export async function updateProposalStatus(
	proposalId: string,
	data: UpdateProposalStatusInput,
) {

	/*
		Quando uma proposta é rejeitada,
		o motivo deve ser informado.
	*/
	if (
		data.status === ProposalStatus.REPROVADA &&
		!data.rejectionReason
	) {
		throw new Error(
			"Rejection reason is required",
		);
	}


	const proposal =
		await prisma.proposal.update({
			where: {
				id: proposalId,
			},

			data: {
	status:
		data.status,

	...(data.rejectionReason && {
		rejectionReason:
			data.rejectionReason,
	}),
},
		});


	return proposal;
}