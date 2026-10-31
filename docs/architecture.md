# Arquitetura

## Backend

- Fastify em `backend/src/server.js`. `backend/src/routes/index.js` só cria o cache e registra as rotas de cada domínio; os handlers validam a consulta, delegam a um módulo e montam a resposta:
  - `routes/comum.js`: schemas base, escopo, paginação, metadados/avisos de corte e `buscarEleicao`.
  - `routes/apuracao.js` (`/api/elections`, `/api/summary`, `/api/timeline`, `/api/map`), `routes/secoes.js` (`/api/sections` e `/:id`, `/:id/versions`), `routes/analise.js` (`/api/analysis`, `/api/anomalies`, `/api/estatisticas`, `/api/consistencia`, `/api/comparacao-local` e `/secoes`, `/api/concentracao`), `routes/biometria.js`, `routes/encerramento.js` e `routes/relatorio.js`.
  - As constantes `COLUNAS_*` (colunas ordenáveis) ficam junto da rota que as usa.
- Módulos de análise em `backend/src/modules/analise/`. Os helpers estatísticos compartilhados (`mediana`, `media`, `desvioPadrao`, `percentilRank`, `toNumberOrNull`) ficam em `estatistica-basica.js`. Consultas e agregações das rotas: `biometria.js` (biometria por município e seção), `encerramento.js` (urnas, municípios e seções, incluindo o partido vencedor), `relatorio.js` (agregados do relatório) e `outliers.js` (pontuação e vencedor por município de `/api/anomalies`).
- Apuração/corte em `backend/src/modules/apuracao/`, incluindo `secoes.js` (lista, detalhe e versões de seção, `statusSql`/`motivoSql`), `timeline.js` (linha do tempo) e, em `totais.js`, o delta do mapa entre cortes.
- Cache Redis via `backend/src/lib/cache.js`.
- Banco Postgres via Kysely. O pool da aplicação usa 20 conexões e `work_mem` de 64 MB por operação, configuráveis por `DB_POOL_MAX` e `DB_WORK_MEM_MB`; esses limites reduzem picos das consultas da aplicação, mas não limitam a memória total do servidor Postgres.
- O mapa usa `mv_totais_area` no corte final; ao exibir por UF, soma primeiro os totais pré-agregados de cada município por candidato antes de calcular líder e percentuais.
- A análise no corte final (estatísticas, concentração, comparação local e duplicação) consulta `mv_secao_candidato_final`, pré-agregada por seção e votável (todas as categorias), com local de votação, votos válidos (nominal + legenda), assinatura e contagem de votáveis por seção; cortes parciais leem as tabelas. A view é atualizada após a carga oficial junto às demais views materializadas.
- Metadados e avisos usam chaves de cache por eleição, cargo, escopo e corte, com validade de 24 horas e invalidação por versão após cargas.
- A listagem de seções aplica filtro de status e paginação no Postgres antes de transferir os resultados.
- O orçamento de 24 GB para o Postgres requer também um limite no serviço ou contêiner do banco; a configuração de pool da aplicação não estabelece esse teto global.
- No host verificado, `postgresql@16-main.service` estava sem `MemoryHigh`/`MemoryMax` e com cerca de 15,7 GiB em seu cgroup. `ops/systemd/postgresql@16-main.service.d/override.conf` define `MemoryHigh=22G` e `MemoryMax=24G`; instalar o drop-in e reiniciar o serviço exige uma ação administrativa no servidor.
- Os scripts da API e carga permitem heap Node de até 16 GiB por processo. Como os processos são iniciados manualmente e as análises carregam grandes conjuntos em memória, limites menores precisam ser definidos considerando o pico real de RSS para evitar OOM.
- Observabilidade: hook `onResponse` em `backend/src/app.js` registra rota, status, duração e bytes; `cache.obter` registra hit/miss/off e duração da função. Logs estruturados via pino.

## Frontend

- Vue 3 + Vite em `frontend/src`.
- Views por aba: Painel, Mapa, Estatística (`/analise`), Comparações (`/comparacoes`), Biometria, Encerramento e Relatório (`/relatorio`).
- Componentes de análise em `frontend/src/components`.
- A aba Comparações apresenta a comparação local entre seções semelhantes.
- A aba Relatório combina a consistência da rota `/api/consistencia`, as análises existentes sob demanda e referências temporais isoladas fornecidas por `/api/relatorio`.
- `CoberturaBlock.vue` exibe cobertura e limitações de forma reutilizável.
- `AnaliseCobertura.vue` apresenta a cobertura da análise agrupando dados ausentes, base considerada e registros abaixo do mínimo de Benford.
- `StateBlock.vue` apresenta estados compartilhados de carregamento, erro e vazio; os painéis reservam a área de conteúdo para manter o indicador associado ao painel.
- Vue I18n fornece catálogos equivalentes para `pt-BR`, `en-US` e `es-ES`; os formatadores de números e datas consultam o idioma ativo no momento da formatação.

## Fluxo de análise

- Cada painel consome queries do TanStack Vue Query.
- Endpoints retornam `cobertura` padronizada.
- A consistência agrega votos por BU no Postgres antes de retornar os dados, evitando transferir todas as linhas de resultado ou montar uma lista de parâmetros por BU.
- A cobertura conta cada BU avaliável uma vez; ausências ficam na cobertura. Comparações históricas agrupam por `election_id` e usam apenas o corte final.
- O endpoint de relatório agrega por eleição, cargo e escopo. A latência entre encerramento e recebimento exige precisão de data/hora; contagens de precisão menor são exibidas sem inventar horário.
- As consultas analíticas agrupam resultados por seção e candidato, mantendo os atributos geográficos como agregados; a base de seção-candidato é compartilhada entre análise e anomalias enquanto a mesma consulta está em andamento.
