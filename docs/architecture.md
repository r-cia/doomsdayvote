# Arquitetura

## Backend

- Fastify em `backend/src/server.js`, rotas em `backend/src/routes/index.js`.
- Módulos de análise em `backend/src/modules/analise/`.
- Apuração/corte em `backend/src/modules/apuracao/`.
- Cache Redis via `backend/src/lib/cache.js`.
- Banco Postgres via Kysely. O pool da aplicação usa 20 conexões e `work_mem` de 64 MB por operação, configuráveis por `DB_POOL_MAX` e `DB_WORK_MEM_MB`; esses limites reduzem picos das consultas da aplicação, mas não limitam a memória total do servidor Postgres.
- O mapa usa `mv_totais_area` no corte final; ao exibir por UF, soma primeiro os totais pré-agregados de cada município por candidato antes de calcular líder e percentuais.
- A análise no corte final consulta `mv_secao_candidato_final`, pré-agregada por seção e candidato. A view é atualizada após a carga oficial junto às demais views materializadas.
- Metadados e avisos usam chaves de cache por eleição, cargo, escopo e corte, com validade de 24 horas e invalidação por versão após cargas.
- A listagem de seções aplica filtro de status e paginação no Postgres antes de transferir os resultados.
- O orçamento de 24 GB para o Postgres requer também um limite no serviço ou contêiner do banco; a configuração de pool da aplicação não estabelece esse teto global.
- Observabilidade: hook `onResponse` em `backend/src/app.js` registra rota, status, duração e bytes; `cache.obter` registra hit/miss/off e duração da função. Logs estruturados via pino.

## Frontend

- Vue 3 + Vite em `frontend/src`.
- Views por aba: Painel, Mapa, Análise.
- Componentes de análise em `frontend/src/components`.
- `CoberturaBlock.vue` exibe cobertura e limitações de forma reutilizável.
- `AnaliseCobertura.vue` apresenta a cobertura da análise agrupando dados ausentes, base considerada e registros abaixo do mínimo de Benford.
- `StateBlock.vue` apresenta estados compartilhados de carregamento, erro e vazio; os painéis reservam a área de conteúdo para manter o indicador associado ao painel.
- Vue I18n fornece catálogos equivalentes para `pt-BR`, `en-US` e `es-ES`; os formatadores de números e datas consultam o idioma ativo no momento da formatação.

## Fluxo de análise

- Cada painel consome queries do TanStack Vue Query.
- Endpoints retornam `cobertura` e `limitacoes` padronizados.
- A consistência agrega votos por BU no Postgres antes de retornar os dados, evitando transferir todas as linhas de resultado ou montar uma lista de parâmetros por BU.
- As consultas analíticas agrupam resultados por seção e candidato, mantendo os atributos geográficos como agregados; a base de seção-candidato é compartilhada entre análise e anomalias enquanto a mesma consulta está em andamento.
