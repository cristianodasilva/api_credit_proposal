module.exports = {
	// Executa os testes em ambiente Node.js.
	testEnvironment: "node",
	// Permite executar arquivos TypeScript.
	transform: {
		"^.+\\.tsx?$": ["@swc/jest"],
	},
	// Resolve imports usando extensão .js do TypeScript.
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	// Arquivos aceitos pelo Jest.
	moduleFileExtensions: ["ts", "js"],
	// Arquivos considerados testes.
	testMatch: ["**/*.spec.ts"],
	// Aponta para o banco de teste antes de carregar a aplicação.
	setupFiles: ["<rootDir>/tests/support/env.ts"],
	// Aplica migrations e seed no banco de teste.
	globalSetup: "<rootDir>/tests/support/global-setup.ts",
	// Os arquivos de teste compartilham o mesmo banco.
	maxWorkers: 1,
	collectCoverageFrom: ["src/**/*.ts", "!src/server.ts", "!src/@types/**"],
};
