# Graph Report - doomsdayvote  (2026-10-30)

## Corpus Check
- 164 files · ~158,493 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1083 nodes · 2006 edges · 77 communities (59 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b6d1d936`
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
- lib.test.js
- MapTable.vue
- validacoes.js
- Plano — Performance de banco e cache Redis
- criarDb
- importarArquivo
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- formatarNumero
- ConsistenciaPanel.vue
- fixtures.js
- totais.test.js
- caminhoFixture
- PainelView.vue
- API de leitura
- App.vue
- StateBlock.vue
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
- format.js
- env.js
- status-secao.js
- criarCache
- benford.js
- EstatisticaPanel.vue
- OutliersPanel.vue
- PlacarRanking.vue
- app.js
- server.js
- partido-cor.test.js
- integration/corte.test.js
- lote.test.js
- RedisFalso
- regressao-apuracao.test.js
- formatarDataHora
- VersoesBuPanel.vue
- 0002_resultado_votavel_colunas.js
- estatisticas.test.js
- migracoes.test.js
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md

## God Nodes (most connected - your core abstractions)
1. `registrarRotas()` - 37 edges
2. `importarArquivo()` - 36 edges
3. `criarDb()` - 27 edges
4. `caminhoFixture()` - 26 edges
5. `useFiltersStore` - 20 edges
6. `useSelecaoEleicao()` - 19 edges
7. `aplicarFiltroCorte()` - 18 edges
8. `formatarNumero()` - 18 edges
9. `limparBanco()` - 16 edges
10. `aplicarEscopo()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `contarCorte()` --calls--> `aplicarFiltroCorte()`  [EXTRACTED]
  backend/tests/integration/corte.test.js → backend/src/modules/apuracao/corte.js
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `candidatos` --calls--> `candidatosNominais()`  [EXTRACTED]
  frontend/src/App.vue → frontend/src/lib/agregacoes.js
- `validos` --calls--> `votosValidos()`  [EXTRACTED]
  frontend/src/components/KpiCards.vue → frontend/src/lib/agregacoes.js
- `candidatos` --calls--> `candidatosNominais()`  [EXTRACTED]
  frontend/src/components/PlacarRanking.vue → frontend/src/lib/agregacoes.js

## Import Cycles
- None detected.

## Communities (77 total, 9 thin omitted)

### Community 0 - "routes/index.js"
Cohesion: 0.06
Nodes (63): AppError, CODIGOS, validar(), ausente(), consistenciaPorSecao(), REGRAS, validarConsistenciaBu(), base() (+55 more)

### Community 1 - "ler-arquivo.js"
Cohesion: 0.08
Nodes (45): ALIASES, CAMPOS_2014_31, CAMPOS_2018_42, CAMPOS_45, CAMPOS_CANONICOS, LEIAUTES, tipoDoCampo(), TIPOS (+37 more)

### Community 2 - "scripts"
Cohesion: 0.05
Nodes (42): dependencies, fastify, ioredis, kysely, pg, pg-copy-streams, pino, zod (+34 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (38): chart.js, dependencies, chart.js, maplibre-gl, pinia, @tanstack/vue-query, vue, vue-chartjs (+30 more)

### Community 4 - "MapPanel.vue"
Cohesion: 0.09
Nodes (36): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+28 more)

### Community 5 - "components.test.js"
Cohesion: 0.06
Nodes (15): ativo, candidatos, emit, minimo, props, emit, municipioAtivo, props (+7 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.09
Nodes (21): motivoSecao(), boletim, consulta, dados, emit, fechar(), habilitado, id (+13 more)

### Community 7 - "persistir-bus.js"
Cohesion: 0.17
Nodes (18): dataOrigem(), FUSO_ORIGEM_BWEB, instanteOrigemSql(), localOrigem(), categorizar(), normalizarTexto(), dataHora(), hashConteudoBu() (+10 more)

### Community 8 - "PlotDia.vue"
Cohesion: 0.12
Nodes (22): animar(), aoApontar(), aoIndice(), aoMover(), aoPressionar(), area, canvas, desenhar() (+14 more)

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
Cohesion: 0.18
Nodes (18): useAnalise(), useAnomalias(), useConsistencia(), useEleicoes(), useEstatisticas(), useMapa(), useResumo(), useSecao() (+10 more)

### Community 14 - "lib.test.js"
Cohesion: 0.22
Nodes (17): indiceAreas, nomeDaFeicao(), prepararFeatures(), areaPorCodigo(), candidatoDaArea(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto() (+9 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.13
Nodes (14): aoClicarLinha(), emit, linhas, linhasBase, linhasPagina, nomeCandidato(), ordenacao, pagina (+6 more)

### Community 16 - "validacoes.js"
Cohesion: 0.20
Nodes (15): alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), criarValidador(), encodingSuspeito() (+7 more)

### Community 17 - "Plano — Performance de banco e cache Redis"
Cohesion: 0.11
Nodes (17): Arquivos, Arquivos afetados, Critérios de aceite, Desenho, Diagnóstico atual, Estado, Fase 1 — Materialized views (maior ganho), Fase 2 — Cache de sub-consultas (+9 more)

### Community 18 - "criarDb"
Cohesion: 0.21
Nodes (10): criarDb(), loadWorkerEnv(), main(), db, env, main(), cores, db (+2 more)

### Community 19 - "importarArquivo"
Cohesion: 0.23
Nodes (12): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), app (+4 more)

### Community 20 - "colors.js"
Cohesion: 0.20
Nodes (15): legenda, clarear(), COR_NEUTRA, COR_SEM_DADOS, corDaArea(), corDoLider(), corPartido(), corPercentual() (+7 more)

### Community 21 - "MapaView.vue"
Cohesion: 0.12
Nodes (8): avisos, mapaQuery, mapaUfQuery, resumoQuery, router, secaoModalId, secoesQuery, { store }

### Community 22 - "Plano de evolução da auditoria de votos"
Cohesion: 0.13
Nodes (14): 1. Consistência aritmética por seção, 2. Comparação entre seções semelhantes, 3. Diferenças entre versões de BU, 4. Indicadores de concentração e margem, 5. Cobertura e limitações dos dados, 6. Revisão dos indicadores existentes, Critérios de conclusão, Dependências e decisões pendentes para a implementação (+6 more)

### Community 23 - "formatarNumero"
Cohesion: 0.15
Nodes (13): biometria, fatias, participacao, props, participacao, percentualDoCandidato, props, validos (+5 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.14
Nodes (11): cobertura, emit, itens, props, rotuloRegra, router, store, cargoPadrao() (+3 more)

### Community 25 - "fixtures.js"
Cohesion: 0.23
Nodes (9): carimbo(), carregarPasta(), gerarRelatorioLote(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync (+1 more)

### Community 26 - "totais.test.js"
Cohesion: 0.19
Nodes (7): contar(), limparBanco(), db, db, fixture, db, importar()

### Community 27 - "caminhoFixture"
Cohesion: 0.18
Nodes (9): caminhoFixture(), app, db, importar(), db, importar(), app, db (+1 more)

### Community 28 - "PainelView.vue"
Cohesion: 0.16
Nodes (13): votosUf, candidatosNominais(), candidatos, analiseQuery, avisos, candidatos, candidatoSelecionado, mapaUfQuery (+5 more)

### Community 29 - "API de leitura"
Cohesion: 0.15
Nodes (12): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/consistencia`, `GET /api/elections`, GET /api/estatisticas, `GET /api/map`, `GET /api/sections` (+4 more)

### Community 30 - "App.vue"
Cohesion: 0.21
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

### Community 31 - "StateBlock.vue"
Cohesion: 0.15
Nodes (5): emit, candidatos, props, grupos, props

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
Cohesion: 0.18
Nodes (10): lista, props, avisoInfo(), AVISOS, MOTIVOS, opcoesStatus(), STATUS_KEYS, STATUS_SECAO (+2 more)

### Community 36 - "UfPanel.vue"
Cohesion: 0.20
Nodes (9): agrupar, grupos, linhas, ordenacao, partidoPorNumero, props, regiaoDe(), REGIOES (+1 more)

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
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 41 - "versoes-bu.js"
Cohesion: 0.36
Nodes (9): ausente(), CAMPOS, chaveVotavel(), compararVersoes(), diferencaNumerica(), extrairVotaveis(), iguais(), normalizar() (+1 more)

### Community 42 - "useSelecaoEleicao"
Cohesion: 0.29
Nodes (6): useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara()

### Community 43 - "format.js"
Cohesion: 0.20
Nodes (9): deInputSaoPaulo(), formatadorData, formatadorDataHora, formatadorHora, formatadorNumero, formatadorOffset, formatadorPartes, formatarSha() (+1 more)

### Community 44 - "env.js"
Cohesion: 0.20
Nodes (8): apiSchema, booleanEnv, carregar(), logLevel, migrateSchema, nodeEnv, workerSchema, ambienteValido

### Community 45 - "status-secao.js"
Cohesion: 0.31
Nodes (6): classificarStatusSecao(), diaEmSaoPaulo(), horarios(), iso(), resultado(), STATUS_POR_TIPO_URNA

### Community 47 - "benford.js"
Cohesion: 0.39
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 48 - "EstatisticaPanel.vue"
Cohesion: 0.22
Nodes (5): blocos, escopo, estatisticasQuery, props, temDoisTurnos

### Community 49 - "OutliersPanel.vue"
Cohesion: 0.22
Nodes (5): emit, limiarIf, limiarLof, props, secoes

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.25
Nodes (8): candidatos, deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 51 - "app.js"
Cohesion: 0.43
Nodes (4): buildApp(), detalhesFastify(), detalhesZod(), isProduction()

### Community 52 - "server.js"
Cohesion: 0.46
Nodes (5): criarDependencias(), migracoesPendentes(), loadApiEnv(), criarLogger(), main()

### Community 53 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 54 - "integration/corte.test.js"
Cohesion: 0.29
Nodes (3): contarCorte(), db, importar()

### Community 55 - "lote.test.js"
Cohesion: 0.33
Nodes (4): copiaAlterada(), db, fixture, juntar()

### Community 58 - "formatarDataHora"
Cohesion: 0.60
Nodes (5): recebimento(), formatarCorte(), formatarData(), formatarDataHora(), recebimento()

### Community 59 - "VersoesBuPanel.vue"
Cohesion: 0.40
Nodes (3): comparacao, props, versoes

### Community 61 - "estatisticas.test.js"
Cohesion: 0.50
Nodes (3): app, db, importar()

### Community 62 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

## Knowledge Gaps
- **420 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+415 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 556 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatarNumero()` connect `formatarNumero` to `BiometriaUfPanel.vue`, `SectionsTable.vue`, `MapPanel.vue`, `components.test.js`, `UfPanel.vue`, `VotosPorEstadoPanel.vue`, `PlotDia.vue`, `SecaoView.vue`, `format.js`, `BiometriaView.vue`, `EncerramentoView.vue`, `lib.test.js`, `MapTable.vue`, `PlacarRanking.vue`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `registrarRotas()` connect `routes/index.js` to `versoes-bu.js`, `status-secao.js`, `importarArquivo`, `server.js`, `caminhoFixture`, `estatisticas.test.js`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `importarArquivo`, `server.js`, `partido-cor.test.js`, `integration/corte.test.js`, `lote.test.js`, `fixtures.js`, `totais.test.js`, `caminhoFixture`, `estatisticas.test.js`, `regressao-apuracao.test.js`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `registrarRotas()` (e.g. with `main()` and `api.test.js`) actually correct?**
  _`registrarRotas()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _420 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `routes/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06435498089920658 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0782608695652174 - nodes in this community are weakly interconnected._