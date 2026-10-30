import {
	calculateCreditValues,
	calculateProposal,
	getInterestRate,
} from "../src/shared/utils/credit-calculator.js";

describe("UNITÁRIO - Calculadora de Crédito", () => {
	describe("getInterestRate", () => {
		// Valida uma combinação de cada faixa da tabela.
		it.each([
			[5000, 12, 2.49],
			[10000, 18, 2.29],
			[20000, 36, 2.79],
		] as const)(
			"deve retornar a taxa da tabela para R$ %d em %dx",
			(amount, installments, expected) => {
				expect(getInterestRate(amount, installments)).toBe(expected);
			},
		);

		// Valida os limites entre as faixas.
		it.each([
			[5000, 1.99],
			[5000.01, 1.49],
			[15000, 1.49],
			[15000.01, 1.09],
		] as const)("deve aplicar a faixa correta para R$ %d", (amount, rate) => {
			expect(getInterestRate(amount, 6)).toBe(rate);
		});
	});

	describe("calculateCreditValues", () => {
		// Valores conferidos com a fórmula Price.
		it("deve calcular valor exato da parcela e do total", () => {
			const result = calculateCreditValues(10000, 1.89, 12);

			expect(result.installmentAmount).toBe(939.22);
			expect(result.totalAmount).toBe(11270.63);
		});

		it("deve arredondar os valores para 2 casas decimais", () => {
			const result = calculateCreditValues(5000, 2.49, 12);

			expect(result.installmentAmount).toBe(
				Number(result.installmentAmount.toFixed(2)),
			);
			expect(result.totalAmount).toBe(Number(result.totalAmount.toFixed(2)));
		});
	});

	describe("calculateProposal", () => {
		// Valida a função principal utilizada pelo módulo de propostas.
		it("deve retornar taxa, parcela e total da proposta", () => {
			const proposal = calculateProposal(10000, 12);

			expect(proposal).toEqual({
				interestRate: 1.89,
				installmentAmount: 939.22,
				totalAmount: 11270.63,
			});
		});
	});
});
