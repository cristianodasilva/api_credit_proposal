import {
	Prisma,
	ProposalStatus,
	UserRole,
	type Proposal,
} from "@prisma/client";
import type {
	CreateProposalInput,
	UpdateProposalStatusInput,
	ListProposalsQuery,
} from "./proposals.schema.js";
import { calculateProposal } from "../../shared/utils/credit-calculator.js";
import { prisma } from "../../infra/database/prisma.js";
import {
	AppError,
	ForbiddenError,
	NotFoundError,
	UnprocessableError,
} from "../../shared/errors/app-error.js";

/*
  Mapa das transições de status permitidas.
  Estados finais não permitem alteração:
  - APROVADA
  - REPROVADA
  - CANCELADA
*/
const allowedTransitions: Record<ProposalStatus, ProposalStatus[]> = {
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

/*
  O Prisma devolve colunas Decimal como objetos, que viram string no JSON.
  Convertendo aqui, todas as rotas respondem os valores como número.
*/
function toProposalResponse(proposal: Proposal) {
	return {
		...proposal,
		customerIncome: proposal.customerIncome.toNumber(),
		requestedAmount: proposal.requestedAmount.toNumber(),
		interestRate: proposal.interestRate.toNumber(),
		installmentAmount: proposal.installmentAmount.toNumber(),
		totalAmount: proposal.totalAmount.toNumber(),
	};
}

async function findProposalOrFail(proposalId: string) {
	const proposal = await prisma.proposal.findUnique({
		where: {
			id: proposalId,
		},
	});

	if (!proposal) {
		throw new NotFoundError();
	}

	return proposal;
}

/*
  Aplica uma mudança de status validando a transição.
  O update filtra também pelo status atual: se outra requisição
  alterar a proposta entre a leitura e a escrita, nada é sobrescrito
  e o cliente recebe 409 Conflict.
*/
async function changeStatus(
	proposal: Proposal,
	newStatus: ProposalStatus,
	data: Prisma.ProposalUpdateInput = {},
) {
	if (!allowedTransitions[proposal.status].includes(newStatus)) {
		throw new UnprocessableError(
			`Invalid status transition: ${proposal.status} -> ${newStatus}`,
		);
	}

	try {
		const updated = await prisma.proposal.update({
			where: {
				id: proposal.id,
				status: proposal.status,
			},
			data: {
				...data,
				status: newStatus,
			},
		});

		return toProposalResponse(updated);
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		) {
			throw new AppError("Proposal was modified by another request", 409);
		}

		throw error;
	}
}

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
	const calculation = calculateProposal(
		data.requestedAmount,
		data.installments,
	);

	// Cria a proposta vinculada ao CORBAN autenticado.
	const proposal = await prisma.proposal.create({
		data: {
			customerName: data.customerName,
			customerCpf: data.customerCpf,
			customerIncome: data.customerIncome,
			requestedAmount: data.requestedAmount,
			installments: data.installments,
			interestRate: calculation.interestRate,
			installmentAmount: calculation.installmentAmount,
			totalAmount: calculation.totalAmount,
			// Toda proposta inicia como RASCUNHO.
			status: ProposalStatus.RASCUNHO,
			// Responsável pela criação.
			corbanId,
		},
	});

	return toProposalResponse(proposal);
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
	const { page, limit, status, cpf } = query;
	/*
	  Caso seja CORBAN, força o filtro pelo dono da proposta.
	  Caso seja OPERATOR, não adiciona restrição.
	*/
	const where: Prisma.ProposalWhereInput = {
		...(role === UserRole.CORBAN && {
			corbanId: userId,
		}),
		// Filtro opcional por status.
		...(status && {
			status,
		}),
		// Filtro opcional por CPF do cliente.
		...(cpf && {
			customerCpf: cpf,
		}),
	};
	// Calcula quantos registros devem ser ignorados.
	const skip = (page - 1) * limit;

	const [proposals, total] = await Promise.all([
		// Busca paginada.
		prisma.proposal.findMany({
			where,
			skip,
			take: limit,
			orderBy: {
				createdAt: "desc",
			},
		}),
		// Conta o total para facilitar o consumo.
		prisma.proposal.count({
			where,
		}),
	]);

	return {
		data: proposals.map(toProposalResponse),
		meta: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
	};
}

/*
  Busca uma proposta específica.
  - CORBAN:
  Só acessa propostas próprias. Se a proposta existir,
  mas pertencer a outro CORBAN, retorna 403 Forbidden.
  - OPERATOR:
  Pode consultar qualquer proposta.
*/
export async function getProposalById(
	proposalId: string,
	userId: string,
	role: UserRole,
) {
	const proposal = await findProposalOrFail(proposalId);

	if (role === UserRole.CORBAN && proposal.corbanId !== userId) {
		throw new ForbiddenError("Access denied");
	}

	return toProposalResponse(proposal);
}

// Atualiza o status de uma proposta.
export async function updateProposalStatus(
	proposalId: string,
	data: UpdateProposalStatusInput,
) {
	const isRejection = data.status === ProposalStatus.REPROVADA;

	// Quando uma proposta é REPROVADA, o motivo da reprovação é obrigatório.
	if (isRejection && !data.rejectionReason) {
		throw new UnprocessableError("Rejection reason is required");
	}

	const proposal = await findProposalOrFail(proposalId);

	// O motivo só é persistido em reprovações.
	return changeStatus(
		proposal,
		data.status,
		isRejection ? { rejectionReason: data.rejectionReason ?? null } : {},
	);
}

/*
  Cancela (soft delete) uma proposta.
  O registro permanece no banco, apenas muda seu status.
*/
export async function cancelProposal(
	proposalId: string,
	userId: string,
	role: UserRole,
) {
	const proposal = await findProposalOrFail(proposalId);

	if (role === UserRole.CORBAN) {
		// CORBAN só pode cancelar propostas próprias.
		if (proposal.corbanId !== userId) {
			throw new ForbiddenError();
		}
		// CORBAN só cancela propostas em RASCUNHO.
		if (proposal.status !== ProposalStatus.RASCUNHO) {
			throw new UnprocessableError("CORBAN can only cancel draft proposals");
		}
	}

	// Estados finais são bloqueados pelo mapa de transições.
	return changeStatus(proposal, ProposalStatus.CANCELADA);
}
