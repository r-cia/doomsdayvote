# Graph Report - doomsdayvote  (2026-10-30)

## Corpus Check
- 191 files · ~176,023 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1269 nodes · 2477 edges · 87 communities (67 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `56208da0`
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
- validacoes.js
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
- importarArquivo
- formatarNumero
- outliers.js
- app.js
- API de leitura
- AnaliseView.vue
- fixtures.js
- geo-carregar.js
- SectionsTable.vue
- routes/index.js
- schema.test.js
- UfPanel.vue
- caminhoFixture
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- ComparacaoLocalPanel.vue
- versoes-bu.js
- useSelecaoEleicao
- concentracao.js
- RedisFalso
- status-secao.js
- criarCache
- benford.js
- format.js
- lib.test.js
- PlacarRanking.vue
- partido-cor.test.js
- App.vue
- corte.js
- integration/ordenacao.test.js
- estatisticas.js
- Tabelas
- api.test.js
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- criarDb
- integration/concentracao.test.js
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md
- Arquitetura
- Blueprint — regras de domínio
- migracoes.test.js
- status.js
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
7. `useFiltersStore` - 24 edges
8. `useSelecaoEleicao()` - 23 edges
9. `aplicarFiltroCorte()` - 22 edges
10. `aplicarEscopo()` - 21 edges

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

## Communities (87 total, 8 thin omitted)

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
Nodes (38): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+30 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.08
Nodes (26): motivoSecao(), statusSecao(), boletim, consulta, dados, emit, fechar(), habilitado (+18 more)

### Community 7 - "validacoes.js"
Cohesion: 0.09
Nodes (33): dataOrigem(), FUSO_ORIGEM_BWEB, instanteOrigemSql(), localOrigem(), categorizar(), normalizarTexto(), dataHora(), hashConteudoBu() (+25 more)

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
Cohesion: 0.15
Nodes (13): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+5 more)

### Community 16 - "formatarPercentual"
Cohesion: 0.20
Nodes (10): percentual(), cobertura, emit, percentual(), percentualRazao(), pontosPercentuais(), props, topMargem (+2 more)

### Community 17 - "Plano — Correções de UX + Code review completo"
Cohesion: 0.20
Nodes (9): Contexto, Ordem de execução, Plano — Correções de UX + Code review completo, Tarefa 1 — Mapa com Governador (bug), Tarefa 2 — Ordenação padronizada no servidor, Tarefa 3 — Larguras fixas das colunas, Tarefa 4 — Code review completo (somente leitura → board), Tarefa 5 — Backtrace de features não rastreadas + documentação (+1 more)

### Community 18 - "env.js"
Cohesion: 0.18
Nodes (12): migracoesPendentes(), apiSchema, booleanEnv, carregar(), databaseEnv, loadApiEnv(), logLevel, migrateSchema (+4 more)

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
Cohesion: 0.12
Nodes (13): agregado, agrupar, agruparRegiao, base, emit, props, REGIAO, grupos (+5 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "importarArquivo"
Cohesion: 0.18
Nodes (13): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), contarCorte() (+5 more)

### Community 26 - "formatarNumero"
Cohesion: 0.12
Nodes (15): campos, camposAusentes, camposNaoInformados, numero(), props, { t }, { alternar, ariaSort, seta, params }, blocos (+7 more)

### Community 27 - "outliers.js"
Cohesion: 0.27
Nodes (13): amostraLof(), amostrar(), caminhoEsperado(), comprimento(), construirArvore(), FEATURES, isolationForest(), localOutlierFactor() (+5 more)

### Community 28 - "app.js"
Cohesion: 0.15
Nodes (13): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), app, db, importar(), app (+5 more)

### Community 29 - "API de leitura"
Cohesion: 0.12
Nodes (16): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections`, GET /api/estatisticas (+8 more)

### Community 30 - "AnaliseView.vue"
Cohesion: 0.12
Nodes (13): emit, coberturaEfetiva, entradas, props, analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery (+5 more)

### Community 31 - "fixtures.js"
Cohesion: 0.16
Nodes (12): contar(), limparBanco(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync, db (+4 more)

### Community 32 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.10
Nodes (23): participacao, percentualDoCandidato, props, validos, votosDoCandidato, alternar(), contexto, emit (+15 more)

### Community 34 - "routes/index.js"
Cohesion: 0.08
Nodes (26): baseSchema, buDaSecao(), cacheDeCorte(), CHAVES_BIOMETRIA_MUNICIPIOS, CHAVES_BIOMETRIA_SECOES, CHAVES_ENCERRAMENTO_MUNICIPIOS, CHAVES_ENCERRAMENTO_SECOES, COLUNAS_BENFORD (+18 more)

### Community 35 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 36 - "UfPanel.vue"
Cohesion: 0.14
Nodes (16): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+8 more)

### Community 37 - "caminhoFixture"
Cohesion: 0.13
Nodes (9): caminhoFixture(), db, importar(), db, importar(), db, importar(), db (+1 more)

### Community 38 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 39 - "AGENTS.md — SYSTEM DIRECTIVES"
Cohesion: 0.18
Nodes (10): 0. INITIALIZATION, 1. COMMUNICATION & OUTPUT FORMAT, 2. WORKFLOW & PROCESS CONTROL, 3. FILE MODIFICATION & SHELL RESTRICTIONS, 4. CODE STYLE & COMMENTING RULES, 5. SINGLE-SOURCE-OF-TRUTH DOCUMENTATION, 6. FRONTEND DEVELOPMENT, 7. DATABASE INTEGRITY & SAFETY (+2 more)

### Community 40 - "ComparacaoLocalPanel.vue"
Cohesion: 0.15
Nodes (9): cobertura, emit, grupos, pontosPercentuais(), props, { t }, comparacaoLocalQuery, ordenacao (+1 more)

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

### Community 46 - "criarCache"
Cohesion: 0.23
Nodes (4): criarDependencias(), criarCache(), criarLogger(), params

### Community 47 - "benford.js"
Cohesion: 0.39
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 48 - "format.js"
Cohesion: 0.11
Nodes (18): candidatos, mad(), props, ativo, candidatos, emit, formatarMad(), minimo (+10 more)

### Community 49 - "lib.test.js"
Cohesion: 0.22
Nodes (17): nomeDaFeicao(), prepararFeatures(), areaPorCodigo(), candidatoDaArea(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas() (+9 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.29
Nodes (7): deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 51 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 52 - "App.vue"
Cohesion: 0.13
Nodes (12): candidatos, {
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
}, resumoQuery, emit, municipioAtivo, props, UFS, definirLocale() (+4 more)

### Community 53 - "corte.js"
Cohesion: 0.33
Nodes (9): avisosCorte(), baseEscopo(), contarAtivos(), contarExcluidosPorPrecisao(), corteResposta(), corteSchema, dataValida(), resolverCorte() (+1 more)

### Community 54 - "integration/ordenacao.test.js"
Cohesion: 0.50
Nodes (4): app, db, json(), obter()

### Community 55 - "estatisticas.js"
Cohesion: 0.14
Nodes (11): base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato(), biometriaPorUf(), composicaoBiometria(), consultarBaseSecaoCandidato(), consultasBaseSecaoEmVoo (+3 more)

### Community 56 - "Tabelas"
Cohesion: 0.50
Nodes (3): Cabeçalho ordenável, Recarga, Tabelas

### Community 58 - "api.test.js"
Cohesion: 0.50
Nodes (3): app, db, importar()

### Community 59 - "PainelView.vue"
Cohesion: 0.14
Nodes (15): candidatos, candidatosNominais(), candidatos, analiseQuery, avisos, candidatos, candidatoSelecionado, mapaUfQuery (+7 more)

### Community 61 - "criarDb"
Cohesion: 0.13
Nodes (16): criarDb(), loadWorkerEnv(), carimbo(), carregarPasta(), gerarRelatorioLote(), main(), db, env (+8 more)

### Community 62 - "integration/concentracao.test.js"
Cohesion: 0.50
Nodes (3): app, db, importar()

### Community 75 - "Arquitetura"
Cohesion: 0.40
Nodes (4): Arquitetura, Backend, Fluxo de análise, Frontend

### Community 77 - "Blueprint — regras de domínio"
Cohesion: 0.40
Nodes (4): Análise e cobertura, Blueprint — regras de domínio, Endpoints de análise, Limitações conhecidas

### Community 79 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

### Community 81 - "status.js"
Cohesion: 0.22
Nodes (8): lista, props, avisoInfo(), AVISOS, MOTIVOS, opcoesStatus(), STATUS_KEYS, STATUS_SECAO

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
Cohesion: 0.24
Nodes (9): deInputSaoPaulo(), formatarCargo(), offsetSaoPaulo(), cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo() (+1 more)

## Knowledge Gaps
- **497 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+492 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 641 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useOrdenacao()` connect `useOrdenacao` to `components.test.js`, `SectionsTable.vue`, `UfPanel.vue`, `SecaoView.vue`, `ComparacaoLocalPanel.vue`, `BiometriaView.vue`, `EncerramentoView.vue`, `MapTable.vue`, `format.js`, `formatarPercentual`, `MapaView.vue`, `RelatorioView.vue`, `ConsistenciaPanel.vue`, `formatarNumero`, `PainelView.vue`, `AnaliseView.vue`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `caminhoFixture`, `criarCache`, `partido-cor.test.js`, `integration/ordenacao.test.js`, `importarArquivo`, `api.test.js`, `app.js`, `integration/concentracao.test.js`, `fixtures.js`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `registrarRotas()` connect `registrarRotas` to `routes/index.js`, `versoes-bu.js`, `concentracao.js`, `status-secao.js`, `AppError`, `env.js`, `consistencia.js`, `corte.js`, `duplicacao.js`, `estatisticas.js`, `integration/ordenacao.test.js`, `importarArquivo`, `api.test.js`, `outliers.js`, `app.js`, `integration/concentracao.test.js`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `registrarRotas()` (e.g. with `main()` and `api.test.js`) actually correct?**
  _`registrarRotas()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _497 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._