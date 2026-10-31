# Graph Report - doomsdayvote  (2026-10-31)

## Corpus Check
- 210 files · ~177,126 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1325 nodes · 2828 edges · 92 communities (68 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d17caa82`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- EncerramentoView.vue
- ler-arquivo.js
- scripts
- dependencies
- MapPanel.vue
- MapaFalso
- SecaoView.vue
- persistir-bus.js
- PlotDia.vue
- Doomsday Vote
- Design System: Doomsday Vote
- BiometriaView.vue
- app.js
- queries.js
- outliers.js
- MapTable.vue
- formatarPercentual
- Plano — Decisões da rodada de perguntas + arquitetura e performance
- env.js
- aplicarFiltroCorte
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- useOrdenacao
- ConsistenciaPanel.vue
- regressao-apuracao.test.js
- components.test.js
- status-secao.test.js
- caminhoFixture
- API de leitura
- AnaliseView.vue
- criarDb
- geo-carregar.js
- SectionsTable.vue
- routes/secoes.js
- schema.test.js
- UfPanel.vue
- formatarNumero
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- validacoes.js
- versoes-bu.js
- useSelecaoEleicao
- concentracao.js
- RedisFalso
- App.vue
- criarCache
- benford.js
- EstatisticaPanel.vue
- lib.test.js
- PlacarRanking.vue
- StateBlock.vue
- corte.js
- analise.js
- Tabelas
- lote.test.js
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- importarArquivo
- resolverCorte
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md
- Arquitetura
- Blueprint — regras de domínio
- migracoes.test.js
- routes/index.js
- format.js
- server.js
- consistencia.js
- RelatorioView.vue
- ordenarLista
- partido-cor.test.js
- filters.js
- integration/corte.test.js
- integration/ordenacao.test.js

## God Nodes (most connected - your core abstractions)
1. `importarArquivo()` - 42 edges
2. `useOrdenacao()` - 41 edges
3. `caminhoFixture()` - 32 edges
4. `criarDb()` - 31 edges
5. `aplicarFiltroCorte()` - 31 edges
6. `formatarNumero()` - 29 edges
7. `registrarAnalise()` - 26 edges
8. `useFiltersStore` - 25 edges
9. `aplicarEscopo()` - 23 edges
10. `useSelecaoEleicao()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `padronizarRobusto()` --indirect_call--> `mediana()`  [INFERRED]
  backend/src/modules/analise/outliers.js → backend/src/modules/analise/estatistica-basica.js
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `candidatos` --calls--> `candidatosNominais()`  [EXTRACTED]
  frontend/src/App.vue → frontend/src/lib/agregacoes.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordNiveisPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordPanel.vue → frontend/src/composables/ordenacao.js

## Import Cycles
- None detected.

## Communities (92 total, 10 thin omitted)

### Community 0 - "EncerramentoView.vue"
Cohesion: 0.09
Nodes (18): api, ApiError, montarQuery(), obter(), carregandoMunicipios, carregandoSecoes, carregandoUrnas, municipios (+10 more)

### Community 1 - "ler-arquivo.js"
Cohesion: 0.08
Nodes (44): ALIASES, CAMPOS_2014_31, CAMPOS_2018_42, CAMPOS_45, CAMPOS_CANONICOS, tipoDoCampo(), detectarLeiaute(), detectarLeiauteDeCampos() (+36 more)

### Community 2 - "scripts"
Cohesion: 0.05
Nodes (42): dependencies, fastify, ioredis, kysely, pg, pg-copy-streams, pino, zod (+34 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (38): chart.js, dependencies, chart.js, maplibre-gl, pinia, @tanstack/vue-query, vue, vue-chartjs (+30 more)

### Community 4 - "MapPanel.vue"
Cohesion: 0.09
Nodes (37): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+29 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.06
Nodes (34): lista, props, avisoInfo(), AVISOS, MOTIVOS, motivoSecao(), opcoesStatus(), STATUS_KEYS (+26 more)

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
Cohesion: 0.09
Nodes (17): queryClient, router, analiseQuery, carregandoMunicipios, carregandoSecoes, municipios, municipioSelecionado, ordemMunicipios (+9 more)

### Community 12 - "app.js"
Cohesion: 0.21
Nodes (10): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), app, db, importar(), app (+2 more)

### Community 13 - "queries.js"
Cohesion: 0.42
Nodes (19): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoLocal(), useComparacaoLocalSecoes() (+11 more)

### Community 14 - "outliers.js"
Cohesion: 0.26
Nodes (14): amostraLof(), amostrar(), caminhoEsperado(), comprimento(), construirArvore(), FEATURES, isolationForest(), localOutlierFactor() (+6 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.15
Nodes (13): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+5 more)

### Community 16 - "formatarPercentual"
Cohesion: 0.20
Nodes (10): percentual(), cobertura, emit, percentual(), percentualRazao(), pontosPercentuais(), props, topMargem (+2 more)

### Community 17 - "Plano — Decisões da rodada de perguntas + arquitetura e performance"
Cohesion: 0.22
Nodes (8): Decisões de execução (2026-10-31), Decisões do usuário (2026-10-31), Execução e validação, Parte A — Cards já decididos (um commit por card), Parte B — `916d` Organização das rotas e módulos (proposta para aprovação), Parte C — `a620` Paginação no banco e flags de heap/stack (medir antes de decidir), Parte C — Resultado da medição e decisões (2026-10-31), Plano — Decisões da rodada de perguntas + arquitetura e performance

### Community 18 - "env.js"
Cohesion: 0.12
Nodes (16): apiSchema, booleanEnv, carregar(), databaseEnv, loadWorkerEnv(), logLevel, migrateSchema, nodeEnv (+8 more)

### Community 19 - "aplicarFiltroCorte"
Cohesion: 0.27
Nodes (14): aplicarEscopo(), aplicarFiltroCorte(), contarSecoesComBu(), linhaDoTempo(), areasComDeltaEntreCortes(), base(), somarMetricasSecao(), totaisPorArea() (+6 more)

### Community 20 - "colors.js"
Cohesion: 0.20
Nodes (15): legenda, clarear(), COR_NEUTRA, COR_SEM_DADOS, corDaArea(), corDoLider(), corPartido(), corPercentual() (+7 more)

### Community 21 - "MapaView.vue"
Cohesion: 0.09
Nodes (16): alterarNivel(), avisos, limparParaBrasil(), mapaQuery, mapaTabelaQuery, mapaUfQuery, ordemMapa, ordemSecoes (+8 more)

### Community 22 - "Plano de evolução da auditoria de votos"
Cohesion: 0.13
Nodes (14): 1. Consistência aritmética por seção, 2. Comparação entre seções semelhantes, 3. Diferenças entre versões de BU, 4. Indicadores de concentração e margem, 5. Cobertura e limitações dos dados, 6. Revisão dos indicadores existentes, Critérios de conclusão, Dependências e decisões pendentes para a implementação (+6 more)

### Community 23 - "useOrdenacao"
Cohesion: 0.10
Nodes (17): agregado, agrupar, agruparRegiao, base, emit, props, REGIAO, grupos (+9 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "regressao-apuracao.test.js"
Cohesion: 0.17
Nodes (9): somarVotos(), atualizarViews(), app, db, importar(), db, importar(), db (+1 more)

### Community 26 - "components.test.js"
Cohesion: 0.14
Nodes (10): biometria, fatias, participacao, props, { t }, candidatos, ControleFalso, eleicoes (+2 more)

### Community 27 - "status-secao.test.js"
Cohesion: 0.29
Nodes (5): app, db, importar(), itemDaSecao(), itens()

### Community 28 - "caminhoFixture"
Cohesion: 0.19
Nodes (9): caminhoFixture(), app, db, importar(), app, db, importar(), db (+1 more)

### Community 29 - "API de leitura"
Cohesion: 0.12
Nodes (16): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections`, GET /api/estatisticas (+8 more)

### Community 30 - "AnaliseView.vue"
Cohesion: 0.20
Nodes (9): analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery, ordemConsistencia, ordemMargem, ordemShare, ordenacoes (+1 more)

### Community 31 - "criarDb"
Cohesion: 0.17
Nodes (13): criarDb(), contar(), limparBanco(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync (+5 more)

### Community 32 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.18
Nodes (12): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+4 more)

### Community 34 - "routes/secoes.js"
Cohesion: 0.24
Nodes (16): buDaSecao(), buscarSecao(), COLUNAS_SECOES, detalheDoBoletim(), itemSecao(), listarSecoes(), motivoSql(), statusSql() (+8 more)

### Community 35 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 36 - "UfPanel.vue"
Cohesion: 0.14
Nodes (16): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+8 more)

### Community 37 - "formatarNumero"
Cohesion: 0.10
Nodes (17): campos, camposAusentes, camposNaoInformados, props, { t }, aberto, consulta, nivel (+9 more)

### Community 38 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 39 - "AGENTS.md — SYSTEM DIRECTIVES"
Cohesion: 0.18
Nodes (10): 0. INITIALIZATION, 1. COMMUNICATION & OUTPUT FORMAT, 2. WORKFLOW & PROCESS CONTROL, 3. FILE MODIFICATION & SHELL RESTRICTIONS, 4. CODE STYLE & COMMENTING RULES, 5. SINGLE-SOURCE-OF-TRUTH DOCUMENTATION, 6. FRONTEND DEVELOPMENT, 7. DATABASE INTEGRITY & SAFETY (+2 more)

### Community 40 - "validacoes.js"
Cohesion: 0.18
Nodes (16): TIPOS, alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), criarValidador() (+8 more)

### Community 41 - "versoes-bu.js"
Cohesion: 0.36
Nodes (9): ausente(), CAMPOS, chaveVotavel(), compararVersoes(), diferencaNumerica(), extrairVotaveis(), iguais(), normalizar() (+1 more)

### Community 42 - "useSelecaoEleicao"
Cohesion: 0.23
Nodes (8): useEleicoes(), useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara(), formatarCargo()

### Community 43 - "concentracao.js"
Cohesion: 0.08
Nodes (43): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+35 more)

### Community 45 - "App.vue"
Cohesion: 0.15
Nodes (10): candidatos, {
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
}, resumoQuery, emit, municipioAtivo, props, UFS, definirLocale() (+2 more)

### Community 47 - "benford.js"
Cohesion: 0.17
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 48 - "EstatisticaPanel.vue"
Cohesion: 0.14
Nodes (13): candidatos, mad(), props, formatarMad(), { alternar, ariaSort, seta, params }, blocos, escopo, estatisticasQuery (+5 more)

### Community 49 - "lib.test.js"
Cohesion: 0.21
Nodes (18): indiceAreas, nomeDaFeicao(), prepararFeatures(), areaPorCodigo(), candidatoDaArea(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto() (+10 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.29
Nodes (7): deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 52 - "StateBlock.vue"
Cohesion: 0.15
Nodes (9): emit, ativo, candidatos, emit, minimo, props, coberturaEfetiva, entradas (+1 more)

### Community 53 - "corte.js"
Cohesion: 0.26
Nodes (12): avisosCorte(), baseEscopo(), contarAtivos(), contarExcluidosPorPrecisao(), corteSchema, dataValida(), metadadosCorte(), baseSchema (+4 more)

### Community 55 - "analise.js"
Cohesion: 0.14
Nodes (23): base(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato() (+15 more)

### Community 56 - "Tabelas"
Cohesion: 0.33
Nodes (5): Cabeçalho ordenável, Grupos recolhíveis (Comparação local), Recarga, Tabelas, Valor nulo

### Community 58 - "lote.test.js"
Cohesion: 0.18
Nodes (10): atualizarViewsMaterializadas(), VIEWS_MATERIALIZADAS, carimbo(), carregarPasta(), gerarRelatorioLote(), main(), copiaAlterada(), db (+2 more)

### Community 59 - "PainelView.vue"
Cohesion: 0.14
Nodes (15): candidatos, candidatosNominais(), candidatos, analiseQuery, avisos, candidatos, candidatoSelecionado, mapaUfQuery (+7 more)

### Community 61 - "importarArquivo"
Cohesion: 0.32
Nodes (10): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), app (+2 more)

### Community 62 - "resolverCorte"
Cohesion: 0.27
Nodes (10): agregadosRelatorio(), metricas(), relatorioDaEleicao(), CARGO_EM_ESCOPO, resolverCorte(), buscarEleicao(), colunasRelatorio(), diferencaPct() (+2 more)

### Community 75 - "Arquitetura"
Cohesion: 0.40
Nodes (4): Arquitetura, Backend, Fluxo de análise, Frontend

### Community 77 - "Blueprint — regras de domínio"
Cohesion: 0.40
Nodes (4): Análise e cobertura, Blueprint — regras de domínio, Endpoints de análise, Limitações conhecidas

### Community 79 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

### Community 81 - "routes/index.js"
Cohesion: 0.39
Nodes (3): AppError, validar(), registrarRotas()

### Community 82 - "format.js"
Cohesion: 0.15
Nodes (16): participacao, percentualDoCandidato, props, validos, votosDoCandidato, recebimento(), deInputSaoPaulo(), formatadorOffset (+8 more)

### Community 83 - "server.js"
Cohesion: 0.46
Nodes (5): criarDependencias(), migracoesPendentes(), loadApiEnv(), criarLogger(), main()

### Community 84 - "consistencia.js"
Cohesion: 0.36
Nodes (6): ausente(), consistenciaPorSecao(), REGRAS, validarConsistenciaBu(), buOk, resultadosOk

### Community 85 - "RelatorioView.vue"
Cohesion: 0.15
Nodes (11): { alternar, ariaSort, seta, params }, alvo, cargoSelecionado, cobertura, consistencia, linhas, percentualCobertura, referencias (+3 more)

### Community 86 - "ordenarLista"
Cohesion: 0.16
Nodes (24): comparar(), lerOrdenacao(), nulo(), ordenacaoSchema(), ordenarLista(), ordenarSql(), biometriaPorMunicipio(), biometriaPorSecao() (+16 more)

### Community 88 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 89 - "filters.js"
Cohesion: 0.39
Nodes (6): cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

### Community 91 - "integration/ordenacao.test.js"
Cohesion: 0.50
Nodes (4): app, db, json(), obter()

## Knowledge Gaps
- **491 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+486 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 633 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `integration/corte.test.js`, `status-secao.test.js`, `concentracao.js`, `app.js`, `env.js`, `server.js`, `partido-cor.test.js`, `regressao-apuracao.test.js`, `lote.test.js`, `integration/ordenacao.test.js`, `caminhoFixture`, `importarArquivo`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `useOrdenacao()` connect `useOrdenacao` to `EncerramentoView.vue`, `SectionsTable.vue`, `UfPanel.vue`, `formatarNumero`, `SecaoView.vue`, `BiometriaView.vue`, `MapTable.vue`, `EstatisticaPanel.vue`, `formatarPercentual`, `StateBlock.vue`, `MapaView.vue`, `RelatorioView.vue`, `ConsistenciaPanel.vue`, `components.test.js`, `PainelView.vue`, `AnaliseView.vue`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `useSelecaoEleicao()` connect `useSelecaoEleicao` to `EncerramentoView.vue`, `BiometriaView.vue`, `queries.js`, `App.vue`, `MapaView.vue`, `RelatorioView.vue`, `filters.js`, `PainelView.vue`, `AnaliseView.vue`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _491 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EncerramentoView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.08615384615384615 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08056265984654731 - nodes in this community are weakly interconnected._