import {
	ProposalStatus,
	UserRole,
} from "@prisma/client";
import type {
	CreateProposalInput,
	UpdateProposalStatusInput,
	ListProposalsQuery,
} from "./proposals.schema.js";
import {
	calculateProposal,
} from "../../shared/utils/credit-calculator.js";
import {
	prisma,
} from "../../infra/database/prisma.js";

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
				// Toda proposta inicia como RASCUNHO.
				status:
					ProposalStatus.RASCUNHO,
				// Responsável pela criação.
				corbanId,
			},
		});

	return proposal;
}

/*
  Lista as propostas de acordo com permissões e filtros enviados.
	Regras:
	- CORBAN:
	  Visualiza apenas suas propostas.
	- OPERATOR:
	  Visualiza todas as propostas.
	Filtros disponíveis:
	- status;
	- CPF do cliente.
*/
export async function listProposals(
	userId: string,
	role: UserRole,
	query: ListProposalsQuery,
) {
	const {page, limit, status, cpf,} = query;
	/*
      Caso seja CORBAN, força o filtro pelo dono da proposta.
	  Caso seja OPERATOR, não adiciona restrição.
	*/
	const where = {
		...(role === UserRole.CORBAN && {
			corbanId:
				userId,
		}),
		// Filtro opcional por status.		
		...(status && {
			status,
		}),
		// Filtro opcional por CPF do cliente.		
		...(cpf && {
			customerCpf:
				cpf,
		}),
	};
	// Calcula quantos registros devem ser ignorados.
	const skip =
		(page - 1) * limit;

	const [
		proposals,
		total,
	] =
		await Promise.all([
			// Busca paginada.			
			prisma.proposal.findMany({
				where,
				skip,
				take:
					limit,
				orderBy: {
					createdAt:
						"desc",
				},
			}),
			// Conta o total para facilitar o consumo.			
			prisma.proposal.count({
				where,
			}),
		]);

	return {
		data:
			proposals,
		meta: {
			page,
			limit,
			total,
			totalPages:
				Math.ceil(
					total / limit,
				),
		},
	};
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
	if (
		role === UserRole.OPERATOR
	) {
		const proposal =
			await prisma.proposal.findUnique({
				where: {
					id: proposalId,
				},
			});
		return {
			proposal,
			forbidden: false,
		};
	}
	/*
	  CORBAN busca a proposta pelo ID
	  sem filtrar inicialmente pelo dono.
      Isso é necessário para descobrir
	  se ela existe mas pertence a outro CORBAN.
	*/
	const proposal =
		await prisma.proposal.findUnique({
			where: {
				id: proposalId,
			},
		});
	// Caso não exista nenhuma proposta com esse ID.	
	if (!proposal) {
		return {
			proposal: null,
			forbidden: false,
		};
	}
	/*
	  Caso a proposta exista, mas pertença a outro CORBAN.
	  Conforme requisito: deve retornar 403 Forbidden.
	*/
	if (
		proposal.corbanId !== userId
	) {
		return {
			proposal: null,
			forbidden: true,
		};
	}

	// Proposta pertence ao CORBAN autenticado.	
	return {
		proposal,
		forbidden: false,
	};
}

// Atualiza o status de uma proposta.
export async function updateProposalStatus(
	proposalId: string,
	data: UpdateProposalStatusInput,
) {
	// Busca a proposta atual para validar regras de transição.
	const proposal =
		await prisma.proposal.findUnique({
			where: {
				id: proposalId,
			},
		});

	if (!proposal) {
		throw new Error("Proposal not found",);
	}
	/*
	  Quando uma proposta é REPROVADA,
	  o motivo da reprovação é obrigatório.
	*/
	if (
		data.status ===
			ProposalStatus.REPROVADA &&
		!data.rejectionReason
	) {
		throw new Error("Rejection reason is required",);
	}

	const currentStatus =
		proposal.status;
	/*
	  Mapa das transições permitidas pelo desafio.
	  Estados finais que não permitem alteração.
	  - APROVADA
	  - REPROVADA
	  - CANCELADA
	*/
	const allowedTransitions:
		Record<
			ProposalStatus,
			ProposalStatus[]
		> = {
		[ProposalStatus.RASCUNHO]: [
			ProposalStatus.EM_ANALISE,
			ProposalStatus.CANCELADA,
		],
		[ProposalStatus.EM_ANALISE]: [
			ProposalStatus.APROVADA,
			ProposalStatus.REPROVADA,
			ProposalStatus.CANCELADA,
		],
		[ProposalStatus.APROVADA]: [],
		[ProposalStatus.REPROVADA]: [],
		[ProposalStatus.CANCELADA]: [],
	};

	const isAllowed =
		allowedTransitions[
			currentStatus
		].includes(
			data.status,
		);

	if (!isAllowed) {
		throw new Error(`Invalid status transition: ${currentStatus} -> ${data.status}`,
		);
	}

	return prisma.proposal.update({
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
}

// Cancela (soft delete) uma proposta.
export async function cancelProposal(
	proposalId: string,
	userId: string,
	role: UserRole,
) {
	const proposal =
		await prisma.proposal.findUnique({
			where: {
				id: proposalId,
			},
		});

	if (!proposal) {
		throw new Error("Proposal not found",);
	}

	// CORBAN só pode cancelar propostas próprias.
	if (
		role === UserRole.CORBAN &&
		proposal.corbanId !== userId
	) {
		throw new Error("Forbidden",);
	}
	// CORBAN só cancela propostas em RASCUNHO.	
	if (
		role === UserRole.CORBAN &&
		proposal.status !==
			ProposalStatus.RASCUNHO
	) {
		throw new Error("CORBAN can only cancel draft proposals",);
	}
	// Nenhuma proposta já finalizada pode ser cancelada novamente.	
	if (
		proposal.status ===
			ProposalStatus.APROVADA ||
		proposal.status ===
			ProposalStatus.REPROVADA ||
		proposal.status ===
			ProposalStatus.CANCELADA
	) {
		throw new Error("Proposal cannot be cancelled",);
	}
	// Soft delete: O registro permanece no banco, apenas muda seu status.	
	return prisma.proposal.update({
		where: {
			id: proposalId,
		},
		data: {
			status:
				ProposalStatus.CANCELADA,
		},
	});
}