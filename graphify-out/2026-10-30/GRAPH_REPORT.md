# Graph Report - doomsdayvote  (2026-10-30)

## Corpus Check
- 180 files · ~166,772 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1176 nodes · 2225 edges · 79 communities (60 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4e062d58`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- routes/index.js
- ler-arquivo.js
- scripts
- dependencies
- MapPanel.vue
- components.test.js
- SecaoView.vue
- persistir-bus.js
- PlotDia.vue
- Doomsday Vote
- Design System: Doomsday Vote
- BiometriaView.vue
- EncerramentoView.vue
- queries.js
- agregacoes.js
- MapTable.vue
- env.js
- Plano atual
- loadWorkerEnv
- importarArquivo
- lib.test.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- format.js
- ConsistenciaPanel.vue
- fixtures.js
- App.vue
- caminhoFixture
- PainelView.vue
- API de leitura
- validacoes.js
- formatarNumero
- BiometriaUfPanel.vue
- SectionsTable.vue
- geo-carregar.js
- status.js
- UfPanel.vue
- VotosPorEstadoPanel.vue
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- schema.test.js
- versoes-bu.js
- useSelecaoEleicao
- concentracao.js
- AnaliseView.vue
- status-secao.js
- criarCache
- benford.js
- BenfordPanel.vue
- prepararFeatures
- integration/comparacao-local.test.js
- app.js
- server.js
- partido-cor.test.js
- integration/corte.test.js
- lote.test.js
- RedisFalso
- integration/estatisticas.test.js
- versoes.test.js
- 0002_resultado_votavel_colunas.js
- criarDb
- integration/status-secao.test.js
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md
- Arquitetura
- Blueprint — regras de domínio

## God Nodes (most connected - your core abstractions)
1. `registrarRotas()` - 41 edges
2. `importarArquivo()` - 40 edges
3. `caminhoFixture()` - 30 edges
4. `criarDb()` - 29 edges
5. `formatarNumero()` - 27 edges
6. `aplicarFiltroCorte()` - 22 edges
7. `useFiltersStore` - 22 edges
8. `aplicarEscopo()` - 19 edges
9. `useSelecaoEleicao()` - 19 edges
10. `formatarPercentual()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `candidatos` --calls--> `candidatosNominais()`  [EXTRACTED]
  frontend/src/App.vue → frontend/src/lib/agregacoes.js
- `inteiro()` --calls--> `formatarNumero()`  [EXTRACTED]
  frontend/src/components/EstatisticaPanel.vue → frontend/src/lib/format.js
- `main()` --calls--> `buildApp()`  [EXTRACTED]
  backend/src/server.js → backend/src/app.js
- `criarDependencias()` --calls--> `criarDb()`  [EXTRACTED]
  backend/src/composition-root.js → backend/src/db/index.js

## Import Cycles
- None detected.

## Communities (79 total, 9 thin omitted)

### Community 0 - "routes/index.js"
Cohesion: 0.05
Nodes (69): AppError, CODIGOS, validar(), comparacaoLocal(), concentracao(), ausente(), consistenciaPorSecao(), REGRAS (+61 more)

### Community 1 - "ler-arquivo.js"
Cohesion: 0.08
Nodes (44): ALIASES, CAMPOS_2014_31, CAMPOS_2018_42, CAMPOS_45, CAMPOS_CANONICOS, LEIAUTES, tipoDoCampo(), detectarLeiaute() (+36 more)

### Community 2 - "scripts"
Cohesion: 0.05
Nodes (42): dependencies, fastify, ioredis, kysely, pg, pg-copy-streams, pino, zod (+34 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (38): chart.js, dependencies, chart.js, maplibre-gl, pinia, @tanstack/vue-query, vue, vue-chartjs (+30 more)

### Community 4 - "MapPanel.vue"
Cohesion: 0.09
Nodes (33): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+25 more)

### Community 5 - "components.test.js"
Cohesion: 0.08
Nodes (10): emit, municipioAtivo, props, UFS, candidatos, ControleFalso, eleicoes, filtros (+2 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.09
Nodes (23): motivoSecao(), statusSecao(), boletim, consulta, dados, emit, fechar(), habilitado (+15 more)

### Community 7 - "persistir-bus.js"
Cohesion: 0.17
Nodes (18): dataOrigem(), FUSO_ORIGEM_BWEB, instanteOrigemSql(), localOrigem(), categorizar(), normalizarTexto(), dataHora(), hashConteudoBu() (+10 more)

### Community 8 - "PlotDia.vue"
Cohesion: 0.12
Nodes (23): animar(), aoApontar(), aoIndice(), aoMover(), aoPressionar(), area, canvas, desenhar() (+15 more)

### Community 9 - "Doomsday Vote"
Cohesion: 0.08
Nodes (23): 10. Scripts úteis, 11. Estrutura do projeto, 12. Troubleshooting, 13. Testes, 14. Licença e observações, 1. Stack, 2. Pré-requisitos, 3. Clonar o projeto (+15 more)

### Community 10 - "Design System: Doomsday Vote"
Cohesion: 0.09
Nodes (22): Buttons, Cards / Containers, Chips, Colors, Components, Design System: Doomsday Vote, Do:, Do's and Don'ts (+14 more)

### Community 11 - "BiometriaView.vue"
Cohesion: 0.10
Nodes (15): api, ApiError, montarQuery(), obter(), analiseQuery, carregandoMunicipios, carregandoSecoes, municipios (+7 more)

### Community 12 - "EncerramentoView.vue"
Cohesion: 0.10
Nodes (14): carregandoMunicipios, carregandoSecoes, carregandoUrnas, linhas, municipios, municipioSelecionado, ordenacao, router (+6 more)

### Community 13 - "queries.js"
Cohesion: 0.17
Nodes (19): useAnalise(), useAnomalias(), useComparacaoLocal(), useConcentracao(), useConsistencia(), useEleicoes(), useEstatisticas(), useMapa() (+11 more)

### Community 14 - "agregacoes.js"
Cohesion: 0.12
Nodes (19): participacao, percentualDoCandidato, props, validos, votosDoCandidato, deltas, emit, escolher() (+11 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.12
Nodes (16): linhasTooltip(), aoClicarLinha(), emit, linhas, linhasBase, linhasPagina, nomeCandidato(), ordenacao (+8 more)

### Community 16 - "env.js"
Cohesion: 0.24
Nodes (9): apiSchema, booleanEnv, carregar(), loadMigrateEnv(), logLevel, migrateSchema, nodeEnv, workerSchema (+1 more)

### Community 17 - "Plano atual"
Cohesion: 0.40
Nodes (4): Alterações, Objetivo, Plano atual, Validação

### Community 18 - "loadWorkerEnv"
Cohesion: 0.18
Nodes (8): loadWorkerEnv(), db, env, main(), cores, db, env, ambienteValido

### Community 19 - "importarArquivo"
Cohesion: 0.32
Nodes (9): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), db (+1 more)

### Community 20 - "lib.test.js"
Cohesion: 0.24
Nodes (15): legenda, clarear(), COR_NEUTRA, corDaArea(), corDoLider(), corPartido(), corPercentual(), corTextoContraste() (+7 more)

### Community 21 - "MapaView.vue"
Cohesion: 0.12
Nodes (8): avisos, mapaQuery, mapaUfQuery, resumoQuery, router, secaoModalId, secoesQuery, { store }

### Community 22 - "Plano de evolução da auditoria de votos"
Cohesion: 0.13
Nodes (14): 1. Consistência aritmética por seção, 2. Comparação entre seções semelhantes, 3. Diferenças entre versões de BU, 4. Indicadores de concentração e margem, 5. Cobertura e limitações dos dados, 6. Revisão dos indicadores existentes, Critérios de conclusão, Dependências e decisões pendentes para a implementação (+6 more)

### Community 23 - "format.js"
Cohesion: 0.18
Nodes (14): recebimento(), comparacao, props, versoes, deInputSaoPaulo(), formatadorOffset, formatadorPartes, formatarCorte() (+6 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.17
Nodes (9): cobertura, emit, itens, props, resumo, rotuloRegra, router, store (+1 more)

### Community 25 - "fixtures.js"
Cohesion: 0.23
Nodes (9): carimbo(), carregarPasta(), gerarRelatorioLote(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync (+1 more)

### Community 26 - "App.vue"
Cohesion: 0.20
Nodes (8): candidatos, {
  eleicoesQuery,
  eleicoesDisponiveis,
  cargos,
  anos,
  turnos,
  filtros,
  aoCargo,
  aoAno,
  aoTurno,
  aoCandidato,
  aoCorte,
  aoUf,
  limparMunicipio,
  limpar,
}, resumoQuery, definirLocale(), i18n, SUPORTADOS, queryClient, router

### Community 27 - "caminhoFixture"
Cohesion: 0.24
Nodes (7): caminhoFixture(), app, db, importar(), db, importar(), importar()

### Community 28 - "PainelView.vue"
Cohesion: 0.15
Nodes (14): candidatos, votosUf, candidatosNominais(), candidatos, analiseQuery, avisos, candidatos, candidatoSelecionado (+6 more)

### Community 29 - "API de leitura"
Cohesion: 0.13
Nodes (14): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections`, GET /api/estatisticas (+6 more)

### Community 30 - "validacoes.js"
Cohesion: 0.18
Nodes (16): TIPOS, alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), criarValidador() (+8 more)

### Community 31 - "formatarNumero"
Cohesion: 0.09
Nodes (22): biometria, fatias, participacao, props, cobertura, emit, grupos, percentual() (+14 more)

### Community 32 - "BiometriaUfPanel.vue"
Cohesion: 0.17
Nodes (10): agregado, agrupar, agruparRegiao, base, emit, linhas, ordenacao, props (+2 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.18
Nodes (11): contexto, emit, irPara(), irParaUltima(), itens, pagina, props, statusDisponiveis (+3 more)

### Community 34 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 35 - "status.js"
Cohesion: 0.22
Nodes (8): lista, props, avisoInfo(), AVISOS, MOTIVOS, opcoesStatus(), STATUS_KEYS, STATUS_SECAO

### Community 36 - "UfPanel.vue"
Cohesion: 0.15
Nodes (12): indiceAreas, agrupar, grupos, linhas, ordenacao, partidoPorNumero, props, regiaoDe() (+4 more)

### Community 37 - "VotosPorEstadoPanel.vue"
Cohesion: 0.21
Nodes (9): delta(), deltaTotal(), listaCandidatos, ordenacao, props, totalCandidato(), totalPorCandidato(), ufs (+1 more)

### Community 38 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 39 - "AGENTS.md — SYSTEM DIRECTIVES"
Cohesion: 0.18
Nodes (10): 0. INITIALIZATION, 1. COMMUNICATION & OUTPUT FORMAT, 2. WORKFLOW & PROCESS CONTROL, 3. FILE MODIFICATION & SHELL RESTRICTIONS, 4. CODE STYLE & COMMENTING RULES, 5. SINGLE-SOURCE-OF-TRUTH DOCUMENTATION, 6. FRONTEND DEVELOPMENT, 7. DATABASE INTEGRITY & SAFETY (+2 more)

### Community 40 - "schema.test.js"
Cohesion: 0.29
Nodes (4): DIRETORIO_MIGRACOES, db, migrator, TABELAS

### Community 41 - "versoes-bu.js"
Cohesion: 0.36
Nodes (9): ausente(), CAMPOS, chaveVotavel(), compararVersoes(), diferencaNumerica(), extrairVotaveis(), iguais(), normalizar() (+1 more)

### Community 42 - "useSelecaoEleicao"
Cohesion: 0.29
Nodes (6): useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara()

### Community 43 - "concentracao.js"
Cohesion: 0.09
Nodes (34): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), criarGrupo(), media() (+26 more)

### Community 44 - "AnaliseView.vue"
Cohesion: 0.08
Nodes (21): emit, coberturaEfetiva, entradas, limitacoesEfetivas, props, grupos, props, blocos (+13 more)

### Community 45 - "status-secao.js"
Cohesion: 0.31
Nodes (6): classificarStatusSecao(), diaEmSaoPaulo(), horarios(), iso(), resultado(), STATUS_POR_TIPO_URNA

### Community 46 - "criarCache"
Cohesion: 0.25
Nodes (3): criarCache(), main(), params

### Community 47 - "benford.js"
Cohesion: 0.39
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 48 - "BenfordPanel.vue"
Cohesion: 0.12
Nodes (15): candidatos, mad(), props, ativo, candidatos, emit, formatarMad(), minimo (+7 more)

### Community 49 - "prepararFeatures"
Cohesion: 0.36
Nodes (9): codigoDaFeicao(), nomeDaFeicao(), normalizarUf(), prepararFeatures(), primeiroValor(), ufDaFeicao(), areaPorCodigo(), codigoMunicipioCurto() (+1 more)

### Community 50 - "integration/comparacao-local.test.js"
Cohesion: 0.50
Nodes (3): app, db, importar()

### Community 51 - "app.js"
Cohesion: 0.18
Nodes (10): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), app, db, importar(), app (+2 more)

### Community 52 - "server.js"
Cohesion: 0.26
Nodes (8): criarDependencias(), migracoesPendentes(), loadApiEnv(), criarLogger(), main(), db, diretorio, migrator

### Community 53 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 55 - "lote.test.js"
Cohesion: 0.33
Nodes (4): copiaAlterada(), db, fixture, juntar()

### Community 58 - "integration/estatisticas.test.js"
Cohesion: 0.50
Nodes (3): app, db, importar()

### Community 59 - "versoes.test.js"
Cohesion: 0.50
Nodes (3): app, db, importar()

### Community 61 - "criarDb"
Cohesion: 0.18
Nodes (8): criarDb(), contar(), limparBanco(), db, db, fixture, db, db

### Community 75 - "Arquitetura"
Cohesion: 0.40
Nodes (4): Arquitetura, Backend, Fluxo de análise, Frontend

### Community 77 - "Blueprint — regras de domínio"
Cohesion: 0.40
Nodes (4): Análise e cobertura, Blueprint — regras de domínio, Endpoints de análise, Limitações conhecidas

## Knowledge Gaps
- **445 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+440 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 592 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatarNumero()` connect `formatarNumero` to `BiometriaUfPanel.vue`, `SectionsTable.vue`, `MapPanel.vue`, `UfPanel.vue`, `VotosPorEstadoPanel.vue`, `SecaoView.vue`, `PlotDia.vue`, `BiometriaView.vue`, `AnaliseView.vue`, `EncerramentoView.vue`, `agregacoes.js`, `MapTable.vue`, `BenfordPanel.vue`, `lib.test.js`, `format.js`, `ConsistenciaPanel.vue`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `registrarRotas()` connect `routes/index.js` to `versoes-bu.js`, `versoes.test.js`, `status-secao.js`, `integration/comparacao-local.test.js`, `app.js`, `server.js`, `integration/estatisticas.test.js`, `caminhoFixture`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `versoes.test.js`, `criarCache`, `loadWorkerEnv`, `integration/comparacao-local.test.js`, `server.js`, `app.js`, `integration/corte.test.js`, `lote.test.js`, `partido-cor.test.js`, `fixtures.js`, `integration/estatisticas.test.js`, `caminhoFixture`, `importarArquivo`, `integration/status-secao.test.js`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `registrarRotas()` (e.g. with `main()` and `api.test.js`) actually correct?**
  _`registrarRotas()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _445 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routes/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05307017543859649 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08013640238704177 - nodes in this community are weakly interconnected._