# API de Propostas de Crédito

[![CI](https://github.com/cristianodasilva/api_credit_proposal/actions/workflows/ci.yml/badge.svg)](https://github.com/cristianodasilva/api_credit_proposal/actions/workflows/ci.yml)

API desenvolvida para gerenciamento de propostas de crédito, permitindo criação, consulta, atualização de status e cancelamento de propostas com controle de acesso por perfil de usuário.

## Tecnologias

- Node.js
- TypeScript
- Fastify
- Prisma ORM
- PostgreSQL
- JWT para autenticação
- Zod para validação de dados
- Jest + Supertest para testes automatizados
- Docker e GitHub Actions

## Como executar

### Pré-requisitos

- Node.js 24 (versão utilizada no desenvolvimento)
- Docker e Docker Compose
- PostgreSQL (caso não utilize Docker)

### Instalação

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

Antes de iniciar, edite o `.env` e troque o `JWT_SECRET` por uma chave própria. A API não inicia sem essa variável. Para gerar uma chave:

```bash
openssl rand -hex 32
```

A API será iniciada em:

```
http://localhost:3333
```

A documentação interativa (Swagger) fica disponível em:

```
http://localhost:3333/docs
```

Para testar as rotas protegidas, faça login em `POST /auth/login`, copie o token retornado e cole no botão **Authorize** (apenas o token, sem o prefixo `Bearer`).

### Executando com Docker

Também é possível subir a API inteira em containers. As migrations são aplicadas automaticamente na inicialização:

```bash
cp .env.example .env
docker compose --profile app up -d --build
npm install && npm run seed
```

### Scripts disponíveis

| Script                  | Descrição                                    |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Inicia a API em modo desenvolvimento (watch) |
| `npm run build`         | Compila o TypeScript para `dist/`            |
| `npm start`             | Executa a versão compilada                   |
| `npm run seed`          | Recria os usuários e propostas de exemplo    |
| `npm test`              | Executa os testes no banco de teste          |
| `npm run test:coverage` | Executa os testes com relatório de cobertura |
| `npm run typecheck`     | Verifica os tipos sem gerar arquivos         |
| `npm run format`        | Formata o código com Prettier                |

## Usuários para teste

Após executar o seed:

| Perfil   | Email                | Senha      |
| -------- | -------------------- | ---------- |
| CORBAN   | corban1@example.com  | Teste@2024 |
| CORBAN   | corban2@example.com  | Teste@2024 |
| OPERADOR | operador@example.com | Teste@2024 |

## Endpoints

### Autenticação

```
POST /auth/login
GET  /auth/me
```

### Propostas

```
POST   /propostas              (CORBAN)
GET    /propostas
GET    /propostas/:id
PATCH  /propostas/:id/status   (OPERADOR)
DELETE /propostas/:id
```

## Regras implementadas

### Perfis de acesso

**CORBAN** (correspondente bancário, quem cria as propostas)

- Pode criar propostas.
- Visualiza apenas propostas associadas ao próprio usuário.
- Recebe `403` ao tentar acessar proposta de outro CORBAN.
- Pode cancelar apenas as próprias propostas em status RASCUNHO.

**OPERADOR**

- Pode visualizar todas as propostas.
- Pode atualizar status das propostas.
- Pode cancelar propostas em RASCUNHO ou EM_ANALISE.

### Cálculo financeiro

A taxa de juros mensal é definida pelo valor solicitado e pela quantidade de parcelas (6, 12, 18, 24 ou 36). O valor da parcela é calculado pela fórmula Price e o total a pagar é a parcela multiplicada pelo número de parcelas.

| Parcelas | Até R$ 5.000 | R$ 5.000,01 a R$ 15.000 | Acima de R$ 15.000 |
| -------- | ------------ | ----------------------- | ------------------ |
| 6x       | 1.99%        | 1.49%                   | 1.09%              |
| 12x      | 2.49%        | 1.89%                   | 1.39%              |
| 18x      | 2.99%        | 2.29%                   | 1.79%              |
| 24x      | 3.49%        | 2.79%                   | 2.19%              |
| 36x      | 3.99%        | 3.29%                   | 2.79%              |

O valor solicitado deve estar entre R$ 500 e R$ 50.000.

## Fluxo de status

Transições permitidas:

```
RASCUNHO
 ├── EM_ANALISE
 └── CANCELADA

EM_ANALISE
 ├── APROVADA
 ├── REPROVADA (motivo obrigatório)
 └── CANCELADA
```

Estados finais:

```
APROVADA
REPROVADA
CANCELADA
```

Após atingir um estado final, a proposta não pode sofrer novas alterações.

## Listagem de propostas

A listagem possui:

- Paginação por página e limite (máximo de 100 por página).
- Filtro por status.
- Filtro por CPF do cliente (com ou sem pontuação).

Exemplo:

```
GET /propostas?page=1&limit=10&status=EM_ANALISE
```

## Respostas de erro

Todos os erros seguem o mesmo formato, com o status HTTP adequado:

| Status | Quando ocorre                                                 |
| ------ | ------------------------------------------------------------- |
| `400`  | Dados inválidos no body ou na query                           |
| `401`  | Token ausente, inválido ou expirado / credenciais inválidas   |
| `403`  | Perfil sem permissão ou proposta de outro CORBAN              |
| `404`  | Proposta não encontrada                                       |
| `409`  | Proposta alterada por outra requisição ao mesmo tempo         |
| `422`  | Regra de negócio violada (transição inválida, motivo ausente) |

```json
{
	"error": "Validation error",
	"issues": [{ "field": "customerCpf", "message": "Invalid CPF format" }]
}
```

## Testes automatizados

Foram implementados testes utilizando **Jest + Supertest**.

Os testes de integração rodam em um banco separado (`DATABASE_URL_TEST`), criado e populado automaticamente antes de cada execução. Assim, o banco de desenvolvimento nunca é alterado pelos testes.

```
tests/
├── support/                  # Banco de teste, app e helpers
├── auth.spec.ts
├── proposals.spec.ts
└── credit-calculator.spec.ts
```

### Testes unitários

`credit-calculator.spec.ts`

- Taxa de juros de cada faixa e limites entre faixas.
- Valor exato da parcela e do total pela fórmula Price.
- Arredondamento para duas casas decimais.

### Testes de integração

`auth.spec.ts`

- Login com credenciais válidas e inválidas.
- Erro de validação em payload mal formatado.
- Recuperação do usuário autenticado.
- Bloqueio sem token, com token inválido e com token expirado.

`proposals.spec.ts`

- Criação com cálculo automático e validação de payload.
- Bloqueio de criação pelo OPERADOR.
- Isolamento de dados entre CORBANs (`403`).
- Listagem com paginação e filtros.
- Fluxo completo de status e bloqueio de transições inválidas.
- Motivo obrigatório na reprovação.
- Regras de cancelamento por perfil e soft delete.

Para executar os testes:

```bash
npm test
```

A cada push e pull request, o GitHub Actions executa formatação, checagem de tipos, testes e build.

## Decisões técnicas

- Fastify foi utilizado pela boa performance e pela simplicidade na construção das rotas.
- Prisma foi escolhido para facilitar o acesso ao banco com tipagem forte e segurança nas consultas.
- PostgreSQL foi utilizado pelo suporte a relacionamentos, enums e consistência dos dados.
- Valores monetários são armazenados como `DECIMAL(12,2)`, evitando imprecisão de ponto flutuante no banco.
- Os erros de regra de negócio são classes com status HTTP próprio, convertidas em resposta por um error handler global. As rotas ficam livres de `try/catch`.
- As mudanças de status validam o status atual no próprio `UPDATE`. Se duas requisições alterarem a mesma proposta ao mesmo tempo, a segunda recebe `409` em vez de sobrescrever a primeira.
- O cancelamento das propostas foi implementado como soft delete, mantendo o histórico do registro através do status CANCELADA.
- A autenticação utiliza JWT com controle de acesso baseado no perfil do usuário.

## Melhorias futuras

Próximas evoluções planejadas:

- Histórico completo das alterações de status das propostas.
- Validação dos dígitos verificadores do CPF.
- Refresh token para sessões longas.
- Rate limiting nas rotas públicas.
- Logs de auditoria para operações críticas.
- Melhorias de observabilidade com métricas e rastreamento de erros.
