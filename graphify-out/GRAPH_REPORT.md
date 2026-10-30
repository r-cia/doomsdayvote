# Graph Report - doomsdayvote  (2026-10-30)

## Corpus Check
- 191 files · ~176,032 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1267 nodes · 2465 edges · 83 communities (62 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1d0faac1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components.test.js
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
- EncerramentoView.vue
- queries.js
- AppError
- MapTable.vue
- formatarPercentual
- Plano — Correções de UX + Code review completo
- env.js
- registrarRotas
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- useOrdenacao
- ConsistenciaPanel.vue
- server.js
- EstatisticaPanel.vue
- outliers.js
- lote.test.js
- API de leitura
- validacoes.js
- importarArquivo
- geo-carregar.js
- SectionsTable.vue
- routes/index.js
- schema.test.js
- UfPanel.vue
- formatarNumero
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- format.js
- versoes-bu.js
- useSelecaoEleicao
- concentracao.js
- RedisFalso
- status-secao.js
- criarCache
- benford.js
- StateBlock.vue
- lib.test.js
- PlacarRanking.vue
- seed-cores.js
- AnaliseView.vue
- corte.js
- estatisticas.js
- Tabelas
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- loadWorkerEnv
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md
- Arquitetura
- Blueprint — regras de domínio
- App.vue
- consistencia.js
- RelatorioView.vue
- duplicacao.js
- selecao.js

## God Nodes (most connected - your core abstractions)
1. `registrarRotas()` - 49 edges
2. `importarArquivo()` - 41 edges
3. `useOrdenacao()` - 41 edges
4. `caminhoFixture()` - 31 edges
5. `criarDb()` - 30 edges
6. `formatarNumero()` - 30 edges
7. `useFiltersStore` - 23 edges
8. `aplicarFiltroCorte()` - 22 edges
9. `aplicarEscopo()` - 21 edges
10. `useSelecaoEleicao()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `contarCorte()` --calls--> `aplicarFiltroCorte()`  [EXTRACTED]
  backend/tests/integration/corte.test.js → backend/src/modules/apuracao/corte.js
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

## Communities (83 total, 9 thin omitted)

### Community 0 - "components.test.js"
Cohesion: 0.14
Nodes (10): biometria, fatias, participacao, props, { t }, candidatos, ControleFalso, eleicoes (+2 more)

### Community 1 - "ler-arquivo.js"
Cohesion: 0.08
Nodes (46): ALIASES, CAMPOS_2014_31, CAMPOS_2018_42, CAMPOS_45, CAMPOS_CANONICOS, LEIAUTES, tipoDoCampo(), TIPOS (+38 more)

### Community 2 - "scripts"
Cohesion: 0.05
Nodes (42): dependencies, fastify, ioredis, kysely, pg, pg-copy-streams, pino, zod (+34 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (38): chart.js, dependencies, chart.js, maplibre-gl, pinia, @tanstack/vue-query, vue, vue-chartjs (+30 more)

### Community 4 - "MapPanel.vue"
Cohesion: 0.08
Nodes (40): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+32 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.06
Nodes (35): lista, props, formatarSha(), avisoInfo(), AVISOS, MOTIVOS, motivoSecao(), opcoesStatus() (+27 more)

### Community 7 - "persistir-bus.js"
Cohesion: 0.17
Nodes (18): dataOrigem(), FUSO_ORIGEM_BWEB, instanteOrigemSql(), localOrigem(), categorizar(), normalizarTexto(), dataHora(), hashConteudoBu() (+10 more)

### Community 8 - "PlotDia.vue"
Cohesion: 0.09
Nodes (26): animar(), aoApontar(), aoIndice(), aoMover(), aoPressionar(), area, canvas, desenhar() (+18 more)

### Community 9 - "Doomsday Vote"
Cohesion: 0.08
Nodes (23): 10. Scripts úteis, 11. Estrutura do projeto, 12. Troubleshooting, 13. Testes, 14. Licença e observações, 1. Stack, 2. Pré-requisitos, 3. Clonar o projeto (+15 more)

### Community 10 - "Design System: Doomsday Vote"
Cohesion: 0.09
Nodes (22): Buttons, Cards / Containers, Chips, Colors, Components, Design System: Doomsday Vote, Do:, Do's and Don'ts (+14 more)

### Community 11 - "BiometriaView.vue"
Cohesion: 0.10
Nodes (16): api, ApiError, montarQuery(), obter(), analiseQuery, carregandoMunicipios, carregandoSecoes, municipios (+8 more)

### Community 12 - "EncerramentoView.vue"
Cohesion: 0.10
Nodes (14): carregandoMunicipios, carregandoSecoes, carregandoUrnas, municipios, municipioSelecionado, ordemMunicipios, ordemSecoes, ordemUrnas (+6 more)

### Community 13 - "queries.js"
Cohesion: 0.31
Nodes (16): paramsDe(), useAnalise(), useAnomalias(), useComparacaoLocal(), useConcentracao(), useConsistencia(), useEleicoes(), useEstatisticas() (+8 more)

### Community 14 - "AppError"
Cohesion: 0.33
Nodes (4): AppError, CODIGOS, validar(), buscarEleicao()

### Community 15 - "MapTable.vue"
Cohesion: 0.14
Nodes (14): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+6 more)

### Community 16 - "formatarPercentual"
Cohesion: 0.20
Nodes (10): percentual(), cobertura, emit, percentual(), percentualRazao(), pontosPercentuais(), props, topMargem (+2 more)

### Community 17 - "Plano — Correções de UX + Code review completo"
Cohesion: 0.20
Nodes (9): Contexto, Ordem de execução, Plano — Correções de UX + Code review completo, Tarefa 1 — Mapa com Governador (bug), Tarefa 2 — Ordenação padronizada no servidor, Tarefa 3 — Larguras fixas das colunas, Tarefa 4 — Code review completo (somente leitura → board), Tarefa 5 — Backtrace de features não rastreadas + documentação (+1 more)

### Community 18 - "env.js"
Cohesion: 0.15
Nodes (12): apiSchema, booleanEnv, carregar(), databaseEnv, loadMigrateEnv(), logLevel, migrateSchema, nodeEnv (+4 more)

### Community 19 - "registrarRotas"
Cohesion: 0.23
Nodes (17): concentracao(), base(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), aplicarEscopo(), aplicarFiltroCorte(), metadadosCorte() (+9 more)

### Community 20 - "colors.js"
Cohesion: 0.20
Nodes (15): legenda, clarear(), COR_NEUTRA, COR_SEM_DADOS, corDaArea(), corDoLider(), corPartido(), corPercentual() (+7 more)

### Community 21 - "MapaView.vue"
Cohesion: 0.09
Nodes (14): avisos, mapaQuery, mapaTabelaQuery, mapaUfQuery, ordemMapa, ordemSecoes, ordemUf, ordemVotosUf (+6 more)

### Community 22 - "Plano de evolução da auditoria de votos"
Cohesion: 0.13
Nodes (14): 1. Consistência aritmética por seção, 2. Comparação entre seções semelhantes, 3. Diferenças entre versões de BU, 4. Indicadores de concentração e margem, 5. Cobertura e limitações dos dados, 6. Revisão dos indicadores existentes, Critérios de conclusão, Dependências e decisões pendentes para a implementação (+6 more)

### Community 23 - "useOrdenacao"
Cohesion: 0.10
Nodes (17): agregado, agrupar, agruparRegiao, base, emit, props, REGIAO, grupos (+9 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "server.js"
Cohesion: 0.33
Nodes (6): criarDependencias(), migracoesPendentes(), loadApiEnv(), criarLogger(), main(), ambienteValido

### Community 26 - "EstatisticaPanel.vue"
Cohesion: 0.18
Nodes (8): { alternar, ariaSort, seta, params }, blocos, escopo, estatisticasQuery, inteiro(), { locale }, props, temDoisTurnos

### Community 27 - "outliers.js"
Cohesion: 0.27
Nodes (13): amostraLof(), amostrar(), caminhoEsperado(), comprimento(), construirArvore(), FEATURES, isolationForest(), localOutlierFactor() (+5 more)

### Community 28 - "lote.test.js"
Cohesion: 0.33
Nodes (4): copiaAlterada(), db, fixture, juntar()

### Community 29 - "API de leitura"
Cohesion: 0.12
Nodes (16): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections`, GET /api/estatisticas (+8 more)

### Community 30 - "validacoes.js"
Cohesion: 0.20
Nodes (15): alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), criarValidador(), encodingSuspeito() (+7 more)

### Community 31 - "importarArquivo"
Cohesion: 0.05
Nodes (65): buildApp(), detalhesFastify(), detalhesZod(), criarDb(), isProduction(), escaparCopy(), importarArquivo(), armazenarOriginal() (+57 more)

### Community 32 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.18
Nodes (12): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+4 more)

### Community 34 - "routes/index.js"
Cohesion: 0.08
Nodes (26): baseSchema, buDaSecao(), cacheDeCorte(), CHAVES_BIOMETRIA_MUNICIPIOS, CHAVES_BIOMETRIA_SECOES, CHAVES_ENCERRAMENTO_MUNICIPIOS, CHAVES_ENCERRAMENTO_SECOES, COLUNAS_BENFORD (+18 more)

### Community 35 - "schema.test.js"
Cohesion: 0.18
Nodes (7): DIRETORIO_MIGRACOES, db, diretorio, migrator, db, migrator, TABELAS

### Community 36 - "UfPanel.vue"
Cohesion: 0.14
Nodes (16): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+8 more)

### Community 37 - "formatarNumero"
Cohesion: 0.13
Nodes (13): campos, camposAusentes, camposNaoInformados, numero(), props, { t }, cobertura, emit (+5 more)

### Community 38 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 39 - "AGENTS.md — SYSTEM DIRECTIVES"
Cohesion: 0.18
Nodes (10): 0. INITIALIZATION, 1. COMMUNICATION & OUTPUT FORMAT, 2. WORKFLOW & PROCESS CONTROL, 3. FILE MODIFICATION & SHELL RESTRICTIONS, 4. CODE STYLE & COMMENTING RULES, 5. SINGLE-SOURCE-OF-TRUTH DOCUMENTATION, 6. FRONTEND DEVELOPMENT, 7. DATABASE INTEGRITY & SAFETY (+2 more)

### Community 40 - "format.js"
Cohesion: 0.18
Nodes (13): participacao, percentualDoCandidato, props, validos, votosDoCandidato, recebimento(), formatadorOffset, formatadorPartes (+5 more)

### Community 41 - "versoes-bu.js"
Cohesion: 0.36
Nodes (9): ausente(), CAMPOS, chaveVotavel(), compararVersoes(), diferencaNumerica(), extrairVotaveis(), iguais(), normalizar() (+1 more)

### Community 42 - "useSelecaoEleicao"
Cohesion: 0.29
Nodes (6): useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara()

### Community 43 - "concentracao.js"
Cohesion: 0.08
Nodes (36): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+28 more)

### Community 45 - "status-secao.js"
Cohesion: 0.31
Nodes (6): classificarStatusSecao(), diaEmSaoPaulo(), horarios(), iso(), resultado(), STATUS_POR_TIPO_URNA

### Community 47 - "benford.js"
Cohesion: 0.39
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 48 - "StateBlock.vue"
Cohesion: 0.11
Nodes (15): emit, candidatos, mad(), props, ativo, candidatos, emit, formatarMad() (+7 more)

### Community 49 - "lib.test.js"
Cohesion: 0.27
Nodes (14): areaPorCodigo(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas(), linhasMapa(), mapaPartidos(), normalizarCodigo() (+6 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.25
Nodes (8): candidatos, deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 51 - "seed-cores.js"
Cohesion: 0.50
Nodes (3): cores, db, env

### Community 52 - "AnaliseView.vue"
Cohesion: 0.13
Nodes (14): queryClient, router, analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery, ordemConsistencia, ordemMargem (+6 more)

### Community 53 - "corte.js"
Cohesion: 0.33
Nodes (9): avisosCorte(), baseEscopo(), contarAtivos(), contarExcluidosPorPrecisao(), corteResposta(), corteSchema, dataValida(), resolverCorte() (+1 more)

### Community 55 - "estatisticas.js"
Cohesion: 0.14
Nodes (11): base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato(), biometriaPorUf(), composicaoBiometria(), consultarBaseSecaoCandidato(), consultasBaseSecaoEmVoo (+3 more)

### Community 56 - "Tabelas"
Cohesion: 0.50
Nodes (3): Cabeçalho ordenável, Recarga, Tabelas

### Community 59 - "PainelView.vue"
Cohesion: 0.15
Nodes (14): candidatosNominais(), candidatos, analiseQuery, avisos, candidatos, candidatoSelecionado, mapaUfQuery, ordemVotosEstado (+6 more)

### Community 61 - "loadWorkerEnv"
Cohesion: 0.46
Nodes (5): loadWorkerEnv(), carimbo(), carregarPasta(), gerarRelatorioLote(), main()

### Community 75 - "Arquitetura"
Cohesion: 0.40
Nodes (4): Arquitetura, Backend, Fluxo de análise, Frontend

### Community 77 - "Blueprint — regras de domínio"
Cohesion: 0.40
Nodes (4): Análise e cobertura, Blueprint — regras de domínio, Endpoints de análise, Limitações conhecidas

### Community 81 - "App.vue"
Cohesion: 0.22
Nodes (7): candidatos, {
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
}, resumoQuery, emit, municipioAtivo, props, UFS

### Community 84 - "consistencia.js"
Cohesion: 0.36
Nodes (6): ausente(), consistenciaPorSecao(), REGRAS, validarConsistenciaBu(), buOk, resultadosOk

### Community 85 - "RelatorioView.vue"
Cohesion: 0.15
Nodes (11): { alternar, ariaSort, seta, params }, alvo, cargoSelecionado, cobertura, consistencia, linhas, percentualCobertura, referencias (+3 more)

### Community 86 - "duplicacao.js"
Cohesion: 0.18
Nodes (13): comparar(), lerOrdenacao(), nulo(), ordenacaoSchema(), ordenarLista(), ordenarSql(), agruparAssinaturas(), chaveMunicipio() (+5 more)

### Community 89 - "selecao.js"
Cohesion: 0.22
Nodes (7): ORDEM_CARGOS, deInputSaoPaulo(), offsetSaoPaulo(), cargoPadrao(), CARGOS_PERMITIDOS, cargosPermitidos(), eleicoes

## Knowledge Gaps
- **498 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+493 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 642 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useOrdenacao()` connect `useOrdenacao` to `components.test.js`, `SectionsTable.vue`, `UfPanel.vue`, `formatarNumero`, `SecaoView.vue`, `BiometriaView.vue`, `EncerramentoView.vue`, `MapTable.vue`, `StateBlock.vue`, `formatarPercentual`, `AnaliseView.vue`, `MapaView.vue`, `RelatorioView.vue`, `ConsistenciaPanel.vue`, `EstatisticaPanel.vue`, `PainelView.vue`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `criarDb()` connect `importarArquivo` to `geo-carregar.js`, `env.js`, `seed-cores.js`, `server.js`, `lote.test.js`, `loadWorkerEnv`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `registrarRotas()` connect `registrarRotas` to `routes/index.js`, `versoes-bu.js`, `concentracao.js`, `status-secao.js`, `AppError`, `consistencia.js`, `corte.js`, `duplicacao.js`, `estatisticas.js`, `server.js`, `outliers.js`, `importarArquivo`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `registrarRotas()` (e.g. with `main()` and `api.test.js`) actually correct?**
  _`registrarRotas()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _498 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._