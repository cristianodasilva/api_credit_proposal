module.exports = {
	// Executa os testes em ambiente Node.js.
	testEnvironment: "node",
	// Permite executar arquivos TypeScript.
	transform: {
		"^.+\\.tsx?$": [
			"@swc/jest",
		],
	},
	// Resolve imports usando extensão .js do TypeScript.
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	// Arquivos aceitos pelo Jest.
	moduleFileExtensions: [
		"ts",
		"js",
	],
	// Arquivos considerados testes.
	testMatch: [
		"**/*.spec.ts",
	],
	collectCoverage: false,
};