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
* Visualiza apenas suas próprias propostas.
* Pode cancelar apenas propostas em RASCUNHO.

**OPERADOR**

* Pode visualizar todas as propostas.
* Pode alterar o status das propostas.
* Pode cancelar propostas permitidas pela regra de negócio.

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
Após atingir esses estados, a proposta não pode sofrer novas alterações.

## Listagem de propostas

A listagem possui:
* Paginação por página e limite.
* Filtro por status.
* Filtro por CPF do cliente.

Exemplo:
```
GET /propostas?page=1&limit=10&status=EM_ANALISE

```
## Decisões técnicas

* Fastify foi utilizado pela boa performance e pela simplicidade na construção das rotas.
* Prisma foi escolhido para facilitar o acesso ao banco com tipagem forte e segurança nas consultas.
* PostgreSQL foi utilizado pelo suporte a relacionamentos, enums e consistência dos dados.
* O cancelamento das propostas foi implementado como soft delete, mantendo o histórico do registro através do status CANCELADA.

## Melhorias futuras

Com mais tempo, algumas evoluções poderiam ser adicionadas:

* Testes unitários para regras específicas de cálculo financeiro.
* Histórico de alterações de status das propostas.
* Refresh token para sessões longas.
* Rate limiting nas rotas públicas.
* Logs de auditoria para operações críticas.
