# Arquitetura

## Backend

- Fastify em `backend/src/server.js`, rotas em `backend/src/routes/index.js`.
- Módulos de análise em `backend/src/modules/analise/`.
- Apuração/corte em `backend/src/modules/apuracao/`.
- Cache Redis via `backend/src/lib/cache.js`.
- Banco Postgres via Kysely.
- Observabilidade: hook `onResponse` em `backend/src/app.js` registra rota, status, duração e bytes; `cache.obter` registra hit/miss/off e duração da função. Logs estruturados via pino.

## Frontend

- Vue 3 + Vite em `frontend/src`.
- Views por aba: Painel, Mapa, Análise.
- Componentes de análise em `frontend/src/components`.
- `CoberturaBlock.vue` exibe cobertura e limitações de forma reutilizável.

## Fluxo de análise

- Cada painel consome queries do TanStack Vue Query.
- Endpoints retornam `cobertura` e `limitacoes` padronizados.
- A consistência agrega votos por BU no Postgres antes de retornar os dados, evitando transferir todas as linhas de resultado ou montar uma lista de parâmetros por BU.
