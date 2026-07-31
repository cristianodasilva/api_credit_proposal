# API Neo Crédito

API desenvolvida para gerenciamento de propostas de crédito, permitindo criação, consulta, atualização de status e cancelamento de propostas com controle de acesso por perfil de usuário.

## Tecnologias

* Node.js
* TypeScript
* Fastify
* Prisma ORM
* PostgreSQL
* JWT para autenticação
* Zod para validação de dados
* Jest + Supertest para testes automatizados

## Como executar

### Pré-requisitos

* Node.js
* Docker e Docker Compose
* PostgreSQL (caso não utilize Docker)

### Instalação

```bash
docker compose up -d
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

A API será iniciada em:

```
http://localhost:3333
```

## Usuários para teste

Após executar o seed:

| Perfil   | Email                                                           | Senha      |
| -------- | --------------------------------------------------------------- | ---------- |
| CORBAN   | [corban1@neocredito.com.br](mailto:corban1@neocredito.com.br)   | Teste@2024 |
| CORBAN   | [corban2@neocredito.com.br](mailto:corban2@neocredito.com.br)   | Teste@2024 |
| OPERADOR | [operador@neocredito.com.br](mailto:operador@neocredito.com.br) | Teste@2024 |

## Endpoints

### Autenticação

```
POST /auth/login
GET /auth/me
```

### Propostas

```
POST   /propostas
GET    /propostas
GET    /propostas/:id
PATCH  /propostas/:id/status
DELETE /propostas/:id
```

## Regras implementadas

### Perfis de acesso

**CORBAN**

* Pode criar propostas.
* Visualiza apenas propostas associadas ao próprio usuário.
* Pode cancelar apenas propostas em status RASCUNHO.

**OPERADOR**

* Pode visualizar todas as propostas.
* Pode atualizar status das propostas.
* Pode cancelar propostas conforme as regras de negócio.

## Fluxo de status

Transições permitidas:

```
RASCUNHO
 ├── EM_ANALISE
 └── CANCELADA

EM_ANALISE
 ├── APROVADA
 ├── REPROVADA
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

* Paginação por página e limite.
* Filtro por status.
* Filtro por CPF do cliente.

Exemplo:

```
GET /propostas?page=1&limit=10&status=EM_ANALISE
```

## Testes automatizados

Foram implementados testes utilizando **Jest + Supertest**.

A estrutura dos testes está organizada da seguinte forma:

```
tests/
├── auth.spec.ts
├── proposals.spec.ts
└── credit-calculator.spec.ts
```

### Testes unitários

`credit-calculator.spec.ts`

Validam as regras isoladas de cálculo financeiro:

* Cálculo da taxa de juros conforme faixa de valor e quantidade de parcelas.
* Cálculo do valor da parcela.
* Cálculo do valor total da proposta.

### Testes de integração

`auth.spec.ts`

Validam o fluxo completo de autenticação:

* Login com credenciais válidas.
* Login com credenciais inválidas.
* Recuperação do usuário autenticado.
* Bloqueio sem token.
* Bloqueio com token expirado.

`proposals.spec.ts`

Validam os principais fluxos da API:

* Criação de proposta.
* Listagem de propostas.
* Busca por ID.
* Atualização de status.
* Bloqueio de transições inválidas.
* Cancelamento através de soft delete.

Para executar os testes:

```bash
npm test
```

## Decisões técnicas

* Fastify foi utilizado pela boa performance e pela simplicidade na construção das rotas.
* Prisma foi escolhido para facilitar o acesso ao banco com tipagem forte e segurança nas consultas.
* PostgreSQL foi utilizado pelo suporte a relacionamentos, enums e consistência dos dados.
* O cancelamento das propostas foi implementado como soft delete, mantendo o histórico do registro através do status CANCELADA.
* A autenticação utiliza JWT com controle de acesso baseado no perfil do usuário.

## Melhorias futuras

Com mais tempo, algumas evoluções poderiam ser adicionadas:

* Aumentar a cobertura de testes para cenários adicionais de regras de negócio.
* Centralizar o gerenciamento do ciclo de vida dos testes, utilizando um setup compartilhado para recursos como conexão com banco de dados.
* Histórico completo das alterações de status das propostas.
* Refresh token para sessões longas.
* Rate limiting nas rotas públicas.
* Logs de auditoria para operações críticas.
* Melhorias de observabilidade com métricas e rastreamento de erros.
