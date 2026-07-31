import { 
    calculateCreditValues, 
    calculateProposal, 
    getInterestRate } from "../src/shared/utils/credit-calculator.js";

describe("UNITÁRIO - Calculadora de Crédito", () => {
	// Valida se a taxa de juros da tabela está correta para: Até R$ 5.000 em 12 parcelas.	
	it("deve retornar taxa de 2.49% para R$ 5.000 em 12 parcelas",() => {
			const rate =
				getInterestRate(
					5000,
					12,
				);

			expect(rate).toBe(2.49);
		},
	);
	// Valida a segunda faixa da tabela: R$ 5.001 até R$ 15.000.	
	it("deve retornar taxa de 2.29% para R$ 10.000 em 18 parcelas",() => {
			const rate =
				getInterestRate(
					10000,
					18,
				);

			expect(rate).toBe(2.29);
		},
	);
    // Valida a terceira faixa: acima de R$ 15.000.	
	it("deve retornar taxa de 2.79% para R$ 20.000 em 36 parcelas",() => {
			const rate =
				getInterestRate(
					20000,
					36,
				);

			expect(rate).toBe(2.79);
		},
	);
	/*  
	  Valida se o cálculo financeiro retorna valores 
      positivos para parcela e total.
	*/
	it("deve calcular valor da parcela e total a pagar",() => {
			const result =
				calculateCreditValues(
					5000,
					2.49,
					12,
				);

			expect(
				result.installmentAmount,
			).toBeGreaterThan(0);

			expect(
				result.totalAmount,
			).toBeGreaterThan(
				result.installmentAmount,
			);
		},
	);

	// Valida a função principal utilizada pelo módulo de propostas.
	
	it("deve retornar taxa, parcela e total da proposta",() => {
			const proposal = 
            calculateProposal(
                	5000,
					12,
				);

			expect(proposal.interestRate,).toBe(2.49);

			expect(proposal.installmentAmount,).toBeGreaterThan(0);

			expect(proposal.totalAmount,).toBeGreaterThan(proposal.installmentAmount,
			);
		},
	);
});