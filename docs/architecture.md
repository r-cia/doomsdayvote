# Arquitetura

## Backend

- Fastify em `backend/src/server.js`, rotas em `backend/src/routes/index.js`.
- Módulos de análise em `backend/src/modules/analise/`.
- Apuração/corte em `backend/src/modules/apuracao/`.
- Cache Redis via `backend/src/lib/cache.js`.
- Banco Postgres via Kysely.

## Frontend

- Vue 3 + Vite em `frontend/src`.
- Views por aba: Painel, Mapa, Análise.
- Componentes de análise em `frontend/src/components`.
- `CoberturaBlock.vue` exibe cobertura e limitações de forma reutilizável.

## Fluxo de análise

- Cada painel consome queries do TanStack Vue Query.
- Endpoints retornam `cobertura` e `limitacoes` padronizados.