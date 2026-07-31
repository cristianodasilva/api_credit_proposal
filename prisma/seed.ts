import {
	PrismaClient,
	ProposalStatus,
	UserRole,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import "dotenv/config";
import { calculateCreditValues } from "../src/shared/utils/credit-calculator.js";

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
	adapter,
});

async function main() {
	/*
	 Limpa os dados existentes antes de executar o seed.
	 A ordem importa: primeiro remove as propostas porque 
     elas dependem dos usuários através do relacionamento corbanId.
	*/
	await prisma.proposal.deleteMany();
	await prisma.user.deleteMany();

	/*
	 Cria o hash da senha
	 Nunca salvamos senha em texto puro.
	*/
	const passwordHash = await bcrypt.hash(
		"Teste@2024",
		10,
	);


	// Criação dos usuários CORBAN.	
	const corban1 = await prisma.user.create({
		data: {
			name: "Corban 1",
			email: "corban1@neocredito.com.br",
			passwordHash,
			role: UserRole.CORBAN,
		},
	});

	const corban2 = await prisma.user.create({
		data: {
			name: "Corban 2",
			email: "corban2@neocredito.com.br",
			passwordHash,
			role: UserRole.CORBAN,
		},
	});

	/*
	 Usuário OPERADOR Possui acesso completo:
	 - visualizar todas propostas;
	 - alterar status;
	 - cancelar propostas.
	*/
	const operator = await prisma.user.create({
		data: {
			name: "Operador",
			email: "operador@neocredito.com.br",
			passwordHash,
			role: UserRole.OPERATOR,
		},
	});

	console.log("Users created:");
	console.log({
		corban1: corban1.email,
		corban2: corban2.email,
		operator: operator.email,
	});

	/*
	 Calcula os valores financeiros das propostas.
	 A taxa é informada conforme a tabela do desafio.
	 O valor da parcela e total são calculados pela
	 mesma regra que será usada futuramente na API.
	*/
	const proposal1Values = calculateCreditValues(
		5000,
		2.49,
		12,
	);

	const proposal2Values = calculateCreditValues(
		10000,
		2.29,
		18,
	);

	const proposal3Values = calculateCreditValues(
		15000,
		2.79,
		24,
	);

	const proposal4Values = calculateCreditValues(
		8000,
		1.89,
		12,
	);

	const proposal5Values = calculateCreditValues(
		3000,
		1.99,
		6,
	);


	/*
	 Criação das propostas iniciais.
	 Distribuídas entre CORBANs para validar:
	 - isolamento de dados;
	 - permissões;
	 - filtros;
	 - consultas.
	*/
	await prisma.proposal.createMany({
		data: [
			{
				customerName: "Gabriela Salomao",
				customerCpf: "11111111111",
				customerIncome: 5000,

				requestedAmount: 5000,
				installments: 12,

				interestRate: 2.49,
				...proposal1Values,

				status: ProposalStatus.RASCUNHO,

				corbanId: corban1.id,
			},

			{
				customerName: "Cristiano Silva",
				customerCpf: "22222222222",
				customerIncome: 7000,

				requestedAmount: 10000,
				installments: 18,

				interestRate: 2.29,
				...proposal2Values,

				status: ProposalStatus.EM_ANALISE,

				corbanId: corban1.id,
			},

			{
				customerName: "Rafaella Santos",
				customerCpf: "33333333333",
				customerIncome: 9000,

				requestedAmount: 15000,
				installments: 24,

				interestRate: 2.79,
				...proposal3Values,

				status: ProposalStatus.APROVADA,

				corbanId: corban2.id,
			},

			{
				customerName: "Ana Lima",
				customerCpf: "44444444444",
				customerIncome: 6000,

				requestedAmount: 8000,
				installments: 12,

				interestRate: 1.89,
				...proposal4Values,

				status: ProposalStatus.REPROVADA,

				rejectionReason: "Renda insuficiente",

				corbanId: corban2.id,
			},

			{
				customerName: "Carlos Oliveira",
				customerCpf: "55555555555",
				customerIncome: 4000,

				requestedAmount: 3000,
				installments: 6,

				interestRate: 1.99,
				...proposal5Values,

				status: ProposalStatus.CANCELADA,

				corbanId: corban1.id,
			},
		],
	});


	console.log("Proposals created successfully");
}

main()
	.then(() => {
		console.log("Seed completed successfully");
	})
	.catch((error) => {
		console.error("Seed failed:");
		console.error(error);

		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});