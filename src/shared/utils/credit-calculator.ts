// Calcula valores financeiros de uma proposta de crédito.
export function calculateCreditValues(
	amount: number, // Valor solicitado pelo cliente
	interestRate: number, // Taxa mensal em percentual (ex: 2.49 = 2,49%)
	installments: number, // Quantidade de parcelas
) {
    /*
	 A fórmula usa a taxa em formato decimal.
	 Exemplo: 2.49% -> 0.0249
    */
	const monthlyRate = interestRate / 100;

	const installmentAmount =
		amount *
		((monthlyRate * Math.pow(1 + monthlyRate, installments)) /
			(Math.pow(1 + monthlyRate, installments) - 1));

	const totalAmount = installmentAmount * installments;

	return {
		installmentAmount: Number(installmentAmount.toFixed(2)),
		totalAmount: Number(totalAmount.toFixed(2)),
	};
}