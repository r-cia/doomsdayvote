# Graph Report - doomsdayvote  (2026-10-30)

## Corpus Check
- 187 files · ~176,188 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1255 nodes · 2369 edges · 89 communities (69 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2ef4b1a4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- formatarNumero
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
- AppError
- MapTable.vue
- formatarPercentual
- Plano — Correções de UX + Code review completo
- env.js
- aplicarFiltroCorte
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- format.js
- ConsistenciaPanel.vue
- app.js
- AnaliseView.vue
- outliers.js
- App.vue
- API de leitura
- validacoes.js
- caminhoFixture
- BiometriaUfPanel.vue
- SectionsTable.vue
- routes/index.js
- status.js
- UfPanel.vue
- VotosPorEstadoPanel.vue
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- geo-carregar.js
- versoes-bu.js
- useSelecaoEleicao
- concentracao.js
- CoberturaBlock.vue
- status-secao.js
- criarCache
- benford.js
- BenfordPanel.vue
- lib.test.js
- PlacarRanking.vue
- criarDb
- schema.test.js
- corte.js
- registrarRotas
- RedisFalso
- KpiCards.vue
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- lote.test.js
- importarArquivo
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md
- Arquitetura
- Blueprint — regras de domínio
- partido-cor.test.js
- totais.js
- integration/ordenacao.test.js
- api.test.js
- consistencia.js
- RelatorioView.vue
- duplicacao.js
- migracoes.test.js

## God Nodes (most connected - your core abstractions)
1. `registrarRotas()` - 49 edges
2. `importarArquivo()` - 41 edges
3. `caminhoFixture()` - 31 edges
4. `criarDb()` - 30 edges
5. `formatarNumero()` - 30 edges
6. `useFiltersStore` - 23 edges
7. `aplicarFiltroCorte()` - 22 edges
8. `aplicarEscopo()` - 21 edges
9. `useSelecaoEleicao()` - 21 edges
10. `formatarPercentual()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `contarCorte()` --calls--> `aplicarFiltroCorte()`  [EXTRACTED]
  backend/tests/integration/corte.test.js → backend/src/modules/apuracao/corte.js
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `pontosPercentuais()` --calls--> `formatarNumero()`  [EXTRACTED]
  frontend/src/components/ComparacaoLocalPanel.vue → frontend/src/lib/format.js
- `pontosPercentuais()` --calls--> `formatarNumero()`  [EXTRACTED]
  frontend/src/components/ConcentracaoPanel.vue → frontend/src/lib/format.js
- `diferenca()` --calls--> `formatarNumero()`  [EXTRACTED]
  frontend/src/components/ConsistenciaPanel.vue → frontend/src/lib/format.js

## Import Cycles
- None detected.

## Communities (89 total, 7 thin omitted)

### Community 0 - "formatarNumero"
Cohesion: 0.15
Nodes (12): campos, camposAusentes, camposNaoInformados, numero(), props, { t }, biometria, fatias (+4 more)

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
Cohesion: 0.08
Nodes (38): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+30 more)

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
Cohesion: 0.16
Nodes (20): useAnalise(), useAnomalias(), useComparacaoLocal(), useConcentracao(), useConsistencia(), useEleicoes(), useEstatisticas(), useMapa() (+12 more)

### Community 14 - "AppError"
Cohesion: 0.33
Nodes (4): AppError, CODIGOS, validar(), buscarEleicao()

### Community 15 - "MapTable.vue"
Cohesion: 0.13
Nodes (14): aoClicarLinha(), emit, linhas, linhasBase, linhasPagina, nomeCandidato(), ordenacao, pagina (+6 more)

### Community 16 - "formatarPercentual"
Cohesion: 0.11
Nodes (16): cobertura, emit, grupos, percentual(), pontosPercentuais(), props, { t }, cobertura (+8 more)

### Community 17 - "Plano — Correções de UX + Code review completo"
Cohesion: 0.20
Nodes (9): Contexto, Ordem de execução, Plano — Correções de UX + Code review completo, Tarefa 1 — Mapa com Governador (bug), Tarefa 2 — Ordenação padronizada no servidor, Tarefa 3 — Larguras fixas das colunas, Tarefa 4 — Code review completo (somente leitura → board), Tarefa 5 — Backtrace de features não rastreadas + documentação (+1 more)

### Community 18 - "env.js"
Cohesion: 0.18
Nodes (12): migracoesPendentes(), apiSchema, booleanEnv, carregar(), databaseEnv, loadApiEnv(), logLevel, migrateSchema (+4 more)

### Community 19 - "aplicarFiltroCorte"
Cohesion: 0.32
Nodes (10): concentracao(), base(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), aplicarEscopo(), aplicarFiltroCorte(), metadadosCorte() (+2 more)

### Community 20 - "colors.js"
Cohesion: 0.20
Nodes (15): legenda, clarear(), COR_NEUTRA, COR_SEM_DADOS, corDaArea(), corDoLider(), corPartido(), corPercentual() (+7 more)

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
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "app.js"
Cohesion: 0.12
Nodes (16): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), app, db, importar(), app (+8 more)

### Community 26 - "AnaliseView.vue"
Cohesion: 0.11
Nodes (14): emit, blocos, escopo, estatisticasQuery, inteiro(), { locale }, props, temDoisTurnos (+6 more)

### Community 27 - "outliers.js"
Cohesion: 0.27
Nodes (13): amostraLof(), amostrar(), caminhoEsperado(), comprimento(), construirArvore(), FEATURES, isolationForest(), localOutlierFactor() (+5 more)

### Community 28 - "App.vue"
Cohesion: 0.28
Nodes (5): {
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
}, resumoQuery, definirLocale(), i18n, SUPORTADOS

### Community 29 - "API de leitura"
Cohesion: 0.12
Nodes (16): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections`, GET /api/estatisticas (+8 more)

### Community 30 - "validacoes.js"
Cohesion: 0.20
Nodes (15): alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), criarValidador(), encodingSuspeito() (+7 more)

### Community 31 - "caminhoFixture"
Cohesion: 0.11
Nodes (19): contar(), limparBanco(), caminhoFixture(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync (+11 more)

### Community 32 - "BiometriaUfPanel.vue"
Cohesion: 0.17
Nodes (10): agregado, agrupar, agruparRegiao, base, emit, linhas, ordenacao, props (+2 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.18
Nodes (11): contexto, emit, irPara(), irParaUltima(), itens, pagina, props, statusDisponiveis (+3 more)

### Community 34 - "routes/index.js"
Cohesion: 0.07
Nodes (28): baseSchema, buDaSecao(), cacheDeCorte(), CHAVES_BIOMETRIA_MUNICIPIOS, CHAVES_BIOMETRIA_SECOES, CHAVES_ENCERRAMENTO_MUNICIPIOS, CHAVES_ENCERRAMENTO_SECOES, COLUNAS_BENFORD (+20 more)

### Community 35 - "status.js"
Cohesion: 0.22
Nodes (8): lista, props, avisoInfo(), AVISOS, MOTIVOS, opcoesStatus(), STATUS_KEYS, STATUS_SECAO

### Community 36 - "UfPanel.vue"
Cohesion: 0.18
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

### Community 40 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 41 - "versoes-bu.js"
Cohesion: 0.36
Nodes (9): ausente(), CAMPOS, chaveVotavel(), compararVersoes(), diferencaNumerica(), extrairVotaveis(), iguais(), normalizar() (+1 more)

### Community 42 - "useSelecaoEleicao"
Cohesion: 0.29
Nodes (6): useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara()

### Community 43 - "concentracao.js"
Cohesion: 0.08
Nodes (36): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+28 more)

### Community 44 - "CoberturaBlock.vue"
Cohesion: 0.17
Nodes (7): coberturaEfetiva, entradas, limitacoesEfetivas, props, { t }, grupos, props

### Community 45 - "status-secao.js"
Cohesion: 0.31
Nodes (6): classificarStatusSecao(), diaEmSaoPaulo(), horarios(), iso(), resultado(), STATUS_POR_TIPO_URNA

### Community 46 - "criarCache"
Cohesion: 0.23
Nodes (4): criarDependencias(), criarCache(), criarLogger(), params

### Community 47 - "benford.js"
Cohesion: 0.39
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 48 - "BenfordPanel.vue"
Cohesion: 0.12
Nodes (16): candidatos, mad(), props, ativo, candidatos, emit, formatarMad(), minimo (+8 more)

### Community 49 - "lib.test.js"
Cohesion: 0.22
Nodes (17): nomeDaFeicao(), prepararFeatures(), areaPorCodigo(), candidatoDaArea(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas() (+9 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.25
Nodes (8): candidatos, deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 51 - "criarDb"
Cohesion: 0.17
Nodes (10): criarDb(), loadWorkerEnv(), db, env, main(), cores, db, env (+2 more)

### Community 52 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 53 - "corte.js"
Cohesion: 0.33
Nodes (9): avisosCorte(), baseEscopo(), contarAtivos(), contarExcluidosPorPrecisao(), corteResposta(), corteSchema, dataValida(), resolverCorte() (+1 more)

### Community 55 - "registrarRotas"
Cohesion: 0.27
Nodes (12): base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato(), biometriaPorUf(), composicaoBiometria(), consultarBaseSecaoCandidato(), consultasBaseSecaoEmVoo (+4 more)

### Community 58 - "KpiCards.vue"
Cohesion: 0.33
Nodes (5): participacao, percentualDoCandidato, props, validos, votosDoCandidato

### Community 59 - "PainelView.vue"
Cohesion: 0.16
Nodes (13): candidatos, candidatosNominais(), candidatos, analiseQuery, avisos, candidatos, candidatoSelecionado, mapaUfQuery (+5 more)

### Community 61 - "lote.test.js"
Cohesion: 0.22
Nodes (8): carimbo(), carregarPasta(), gerarRelatorioLote(), main(), copiaAlterada(), db, fixture, juntar()

### Community 62 - "importarArquivo"
Cohesion: 0.18
Nodes (13): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), app (+5 more)

### Community 75 - "Arquitetura"
Cohesion: 0.40
Nodes (4): Arquitetura, Backend, Fluxo de análise, Frontend

### Community 77 - "Blueprint — regras de domínio"
Cohesion: 0.40
Nodes (4): Análise e cobertura, Blueprint — regras de domínio, Endpoints de análise, Limitações conhecidas

### Community 79 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 81 - "totais.js"
Cohesion: 0.70
Nodes (4): base(), somarMetricasSecao(), somarVotos(), totaisPorArea()

### Community 82 - "integration/ordenacao.test.js"
Cohesion: 0.50
Nodes (4): app, db, json(), obter()

### Community 83 - "api.test.js"
Cohesion: 0.50
Nodes (3): app, db, importar()

### Community 84 - "consistencia.js"
Cohesion: 0.36
Nodes (6): ausente(), consistenciaPorSecao(), REGRAS, validarConsistenciaBu(), buOk, resultadosOk

### Community 85 - "RelatorioView.vue"
Cohesion: 0.12
Nodes (15): queryClient, router, comparacaoLocalQuery, { store }, alvo, cargoSelecionado, cobertura, consistencia (+7 more)

### Community 86 - "duplicacao.js"
Cohesion: 0.18
Nodes (13): comparar(), lerOrdenacao(), nulo(), ordenacaoSchema(), ordenarLista(), ordenarSql(), agruparAssinaturas(), chaveMunicipio() (+5 more)

### Community 88 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

## Knowledge Gaps
- **497 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+492 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 647 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `registrarRotas()` connect `registrarRotas` to `routes/index.js`, `versoes-bu.js`, `concentracao.js`, `status-secao.js`, `AppError`, `totais.js`, `env.js`, `aplicarFiltroCorte`, `consistencia.js`, `corte.js`, `duplicacao.js`, `api.test.js`, `integration/ordenacao.test.js`, `app.js`, `outliers.js`, `importarArquivo`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `criarCache`, `partido-cor.test.js`, `integration/ordenacao.test.js`, `api.test.js`, `app.js`, `lote.test.js`, `importarArquivo`, `caminhoFixture`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `formatarNumero()` connect `formatarNumero` to `MapPanel.vue`, `SecaoView.vue`, `PlotDia.vue`, `BiometriaView.vue`, `EncerramentoView.vue`, `MapTable.vue`, `formatarPercentual`, `format.js`, `ConsistenciaPanel.vue`, `AnaliseView.vue`, `BiometriaUfPanel.vue`, `SectionsTable.vue`, `UfPanel.vue`, `VotosPorEstadoPanel.vue`, `BenfordPanel.vue`, `lib.test.js`, `PlacarRanking.vue`, `KpiCards.vue`, `RelatorioView.vue`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `registrarRotas()` (e.g. with `main()` and `api.test.js`) actually correct?**
  _`registrarRotas()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _497 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0782608695652174 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._