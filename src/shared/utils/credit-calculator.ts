// A API só aceita: 6, 12, 18, 24 ou 36 parcelas.
type InstallmentOption = 6 | 12 | 18 | 24 | 36;

/*
  Retorna a taxa de juros mensal com base na tabela fornecida

	Tabela:
	Até R$ 5.000		R$ 5.001 até R$ 15.000		Acima de R$ 15.000
	6x  -> 1.99%        6x  -> 1.49%			    6x  -> 1.09%
	12x -> 2.49%		12x -> 1.89%				12x -> 1.39%
	18x -> 2.99%		18x -> 2.29%				18x -> 1.79%
	24x -> 3.49%		24x -> 2.79%				24x -> 2.19%
	36x -> 3.99%		36x -> 3.29%				36x -> 2.79%	
*/
export function getInterestRate(
	requestedAmount: number,
	installments: InstallmentOption,
): number {
	// Faixa 1 até R$ 5.000	
	if (requestedAmount <= 5000) {
		const rates: Record<InstallmentOption, number> = {
			6: 1.99,
			12: 2.49,
			18: 2.99,
			24: 3.49,
			36: 3.99,
		};

		return rates[installments];
	}

	// Faixa 2 de R$ 5.001 até R$ 15.000
	if (requestedAmount <= 15000) {
		const rates: Record<InstallmentOption, number> = {
			6: 1.49,
			12: 1.89,
			18: 2.29,
			24: 2.79,
			36: 3.29,
		};

		return rates[installments];
	}

	// Faixa 3 acima de R$ 15.000
	const rates: Record<InstallmentOption, number> = {
		6: 1.09,
		12: 1.39,
		18: 1.79,
		24: 2.19,
		36: 2.79,
	};

	return rates[installments];
}

/*
	Calcula os valores financeiros de uma proposta 
	utilizando a fórmula fornecida no desafio.

	Fórmula:
	valorParcela = valorSolicitado * (taxa * (1 + taxa)^n) / ((1 + taxa)^n - 1)

	totalAPagar = valorParcela * numeroParcelas
*/
export function calculateCreditValues(
	amount: number,
	interestRate: number,
	installments: InstallmentOption,
) {
	/*
		A fórmula utiliza a taxa em formato decimal.
		Exemplo: 2.49% -> 0.0249
	*/
	const monthlyRate =
		interestRate / 100;

	/*
		Cálculo da parcela utilizando a fórmula Price 
		simplificada solicitada no desafio.
	*/
	const installmentAmount =
		amount *
		(
			(monthlyRate *
				Math.pow(
					1 + monthlyRate,
					installments,
				)) /
			(
				Math.pow(
					1 + monthlyRate,
					installments,
				) - 1
			)
		);

	// Valor total pago ao final do contrato.	
	const totalAmount =
		installmentAmount *
		installments;

	return {
		// Arredonda para 2 casas decimais para persistir valores monetários.		
		installmentAmount: Number(
			installmentAmount.toFixed(2),
		),

		totalAmount: Number(
			totalAmount.toFixed(2),
		),
	};
}


/*
	Função principal utilizada pelo módulo de propostas.
	Ela recebe apenas:
	- valor solicitado
	- quantidade de parcelas
	E retorna tudo que a proposta precisa salvar no banco.
*/
export function calculateProposal(
	requestedAmount: number,
	installments: InstallmentOption,
) {
	const interestRate =
		getInterestRate(
			requestedAmount,
			installments,
		);

	const {
		installmentAmount,
		totalAmount,
	} = calculateCreditValues(
		requestedAmount,
		interestRate,
		installments,
	);

	return {
		interestRate,
		installmentAmount,
		totalAmount,
	};
}