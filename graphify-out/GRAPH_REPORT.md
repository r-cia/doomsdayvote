# Graph Report - doomsdayvote  (2026-10-31)

## Corpus Check
- 197 files · ~176,091 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1289 nodes · 2612 edges · 85 communities (64 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3918f0f1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- criarDb
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
- duplicacao.js
- queries.js
- outliers.js
- MapTable.vue
- formatarNumero
- Plano — Decisões da rodada de perguntas + arquitetura e performance
- env.js
- aplicarFiltroCorte
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- useOrdenacao
- ConsistenciaPanel.vue
- caminhoFixture
- mv-secao-candidato.test.js
- status-secao.test.js
- app.js
- API de leitura
- AnaliseView.vue
- db-teste.js
- geo-carregar.js
- SectionsTable.vue
- routes/index.js
- schema.test.js
- UfPanel.vue
- ComparacaoLocalPanel.vue
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
- registrarRotas
- Tabelas
- lote.test.js
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- importarArquivo
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md
- Arquitetura
- Blueprint — regras de domínio
- migracoes.test.js
- format.js
- RelatorioView.vue
- lib/ordenacao.js
- filters.js

## God Nodes (most connected - your core abstractions)
1. `registrarRotas()` - 53 edges
2. `importarArquivo()` - 42 edges
3. `useOrdenacao()` - 41 edges
4. `caminhoFixture()` - 32 edges
5. `criarDb()` - 31 edges
6. `formatarNumero()` - 29 edges
7. `useFiltersStore` - 25 edges
8. `useSelecaoEleicao()` - 23 edges
9. `aplicarFiltroCorte()` - 22 edges
10. `aplicarEscopo()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `padronizarRobusto()` --indirect_call--> `mediana()`  [INFERRED]
  backend/src/modules/analise/outliers.js → backend/src/modules/analise/estatistica-basica.js
- `contarCorte()` --calls--> `aplicarFiltroCorte()`  [EXTRACTED]
  backend/tests/integration/corte.test.js → backend/src/modules/apuracao/corte.js
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `candidatos` --calls--> `candidatosNominais()`  [EXTRACTED]
  frontend/src/App.vue → frontend/src/lib/agregacoes.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordNiveisPanel.vue → frontend/src/composables/ordenacao.js

## Import Cycles
- None detected.

## Communities (85 total, 7 thin omitted)

### Community 0 - "criarDb"
Cohesion: 0.20
Nodes (11): criarDb(), atualizarViewsMaterializadas(), VIEWS_MATERIALIZADAS, loadWorkerEnv(), main(), db, env, main() (+3 more)

### Community 1 - "ler-arquivo.js"
Cohesion: 0.08
Nodes (45): ALIASES, CAMPOS_2014_31, CAMPOS_2018_42, CAMPOS_45, CAMPOS_CANONICOS, tipoDoCampo(), TIPOS, detectarLeiaute() (+37 more)

### Community 2 - "scripts"
Cohesion: 0.05
Nodes (42): dependencies, fastify, ioredis, kysely, pg, pg-copy-streams, pino, zod (+34 more)

### Community 3 - "dependencies"
Cohesion: 0.05
Nodes (38): chart.js, dependencies, chart.js, maplibre-gl, pinia, @tanstack/vue-query, vue, vue-chartjs (+30 more)

### Community 4 - "MapPanel.vue"
Cohesion: 0.08
Nodes (40): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+32 more)

### Community 5 - "components.test.js"
Cohesion: 0.10
Nodes (6): candidatos, ControleFalso, eleicoes, filtros, LimitesFalsos, MapaFalso

### Community 6 - "SecaoView.vue"
Cohesion: 0.05
Nodes (37): lista, props, definirLocale(), i18n, SUPORTADOS, avisoInfo(), AVISOS, MOTIVOS (+29 more)

### Community 7 - "persistir-bus.js"
Cohesion: 0.17
Nodes (18): dataOrigem(), FUSO_ORIGEM_BWEB, instanteOrigemSql(), localOrigem(), categorizar(), normalizarTexto(), dataHora(), hashConteudoBu() (+10 more)

### Community 8 - "PlotDia.vue"
Cohesion: 0.06
Nodes (37): animar(), aoApontar(), aoIndice(), aoMover(), aoPressionar(), area, canvas, desenhar() (+29 more)

### Community 9 - "Doomsday Vote"
Cohesion: 0.08
Nodes (23): 10. Scripts úteis, 11. Estrutura do projeto, 12. Troubleshooting, 13. Testes, 14. Licença e observações, 1. Stack, 2. Pré-requisitos, 3. Clonar o projeto (+15 more)

### Community 10 - "Design System: Doomsday Vote"
Cohesion: 0.09
Nodes (22): Buttons, Cards / Containers, Chips, Colors, Components, Design System: Doomsday Vote, Do:, Do's and Don'ts (+14 more)

### Community 11 - "BiometriaView.vue"
Cohesion: 0.10
Nodes (16): api, ApiError, montarQuery(), obter(), analiseQuery, carregandoMunicipios, carregandoSecoes, municipios (+8 more)

### Community 12 - "duplicacao.js"
Cohesion: 0.26
Nodes (11): secoesPelaMv(), agruparAssinaturas(), agruparComVencedorDeZona(), chaveMunicipio(), chaveZona(), COLUNAS_DUPLICACAO, duplicacaoPelaMv(), duplicacaoPorAssinatura() (+3 more)

### Community 13 - "queries.js"
Cohesion: 0.42
Nodes (19): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoLocal(), useComparacaoLocalSecoes() (+11 more)

### Community 14 - "outliers.js"
Cohesion: 0.27
Nodes (12): amostraLof(), amostrar(), caminhoEsperado(), comprimento(), construirArvore(), FEATURES, isolationForest(), localOutlierFactor() (+4 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.15
Nodes (13): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+5 more)

### Community 16 - "formatarNumero"
Cohesion: 0.09
Nodes (23): biometria, fatias, participacao, props, { t }, aberto, consulta, nivel (+15 more)

### Community 17 - "Plano — Decisões da rodada de perguntas + arquitetura e performance"
Cohesion: 0.22
Nodes (8): Decisões de execução (2026-10-31), Decisões do usuário (2026-10-31), Execução e validação, Parte A — Cards já decididos (um commit por card), Parte B — `916d` Organização das rotas e módulos (proposta para aprovação), Parte C — `a620` Paginação no banco e flags de heap/stack (medir antes de decidir), Parte C — Resultado da medição e decisões (2026-10-31), Plano — Decisões da rodada de perguntas + arquitetura e performance

### Community 18 - "env.js"
Cohesion: 0.18
Nodes (12): migracoesPendentes(), apiSchema, booleanEnv, carregar(), databaseEnv, loadApiEnv(), logLevel, migrateSchema (+4 more)

### Community 19 - "aplicarFiltroCorte"
Cohesion: 0.17
Nodes (17): ausente(), consistenciaPorSecao(), REGRAS, validarConsistenciaBu(), base(), eleicoesDoAno(), estatisticasDaEleicao(), numero() (+9 more)

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
Cohesion: 0.09
Nodes (18): agregado, agrupar, agruparRegiao, base, emit, props, REGIAO, grupos (+10 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "caminhoFixture"
Cohesion: 0.10
Nodes (17): atualizarViews(), caminhoFixture(), app, db, importar(), app, db, importar() (+9 more)

### Community 26 - "mv-secao-candidato.test.js"
Cohesion: 0.32
Nodes (6): db, FINAL, normalizarGrupos(), ordenarListas(), POR_TABELAS, porTexto()

### Community 27 - "status-secao.test.js"
Cohesion: 0.29
Nodes (5): app, db, importar(), itemDaSecao(), itens()

### Community 28 - "app.js"
Cohesion: 0.15
Nodes (14): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), app, db, importar(), app (+6 more)

### Community 29 - "API de leitura"
Cohesion: 0.12
Nodes (16): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections`, GET /api/estatisticas (+8 more)

### Community 30 - "AnaliseView.vue"
Cohesion: 0.13
Nodes (14): queryClient, router, analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery, ordemConsistencia, ordemMargem (+6 more)

### Community 31 - "db-teste.js"
Cohesion: 0.12
Nodes (18): contar(), limparBanco(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync, db (+10 more)

### Community 32 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.18
Nodes (12): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+4 more)

### Community 34 - "routes/index.js"
Cohesion: 0.07
Nodes (32): metadadosCorte(), horariosDoBu(), iso(), baseSchema, buDaSecao(), cacheDeCorte(), CHAVES_BIOMETRIA_MUNICIPIOS, CHAVES_BIOMETRIA_SECOES (+24 more)

### Community 35 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 36 - "UfPanel.vue"
Cohesion: 0.14
Nodes (16): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+8 more)

### Community 37 - "ComparacaoLocalPanel.vue"
Cohesion: 0.40
Nodes (4): cobertura, emit, grupos, props

### Community 38 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 39 - "AGENTS.md — SYSTEM DIRECTIVES"
Cohesion: 0.18
Nodes (10): 0. INITIALIZATION, 1. COMMUNICATION & OUTPUT FORMAT, 2. WORKFLOW & PROCESS CONTROL, 3. FILE MODIFICATION & SHELL RESTRICTIONS, 4. CODE STYLE & COMMENTING RULES, 5. SINGLE-SOURCE-OF-TRUTH DOCUMENTATION, 6. FRONTEND DEVELOPMENT, 7. DATABASE INTEGRITY & SAFETY (+2 more)

### Community 40 - "validacoes.js"
Cohesion: 0.20
Nodes (15): alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), criarValidador(), encodingSuspeito() (+7 more)

### Community 41 - "versoes-bu.js"
Cohesion: 0.36
Nodes (9): ausente(), CAMPOS, chaveVotavel(), compararVersoes(), diferencaNumerica(), extrairVotaveis(), iguais(), normalizar() (+1 more)

### Community 42 - "useSelecaoEleicao"
Cohesion: 0.23
Nodes (8): useEleicoes(), useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara(), formatarCargo()

### Community 43 - "concentracao.js"
Cohesion: 0.16
Nodes (25): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+17 more)

### Community 45 - "App.vue"
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

### Community 46 - "criarCache"
Cohesion: 0.23
Nodes (4): criarDependencias(), criarCache(), criarLogger(), params

### Community 47 - "benford.js"
Cohesion: 0.39
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 48 - "EstatisticaPanel.vue"
Cohesion: 0.15
Nodes (12): candidatos, mad(), props, { alternar, ariaSort, seta, params }, blocos, escopo, estatisticasQuery, numero() (+4 more)

### Community 49 - "lib.test.js"
Cohesion: 0.27
Nodes (14): areaPorCodigo(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas(), linhasMapa(), mapaPartidos(), normalizarCodigo() (+6 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.29
Nodes (7): deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 52 - "StateBlock.vue"
Cohesion: 0.14
Nodes (10): emit, ativo, candidatos, emit, formatarMad(), minimo, props, coberturaEfetiva (+2 more)

### Community 53 - "corte.js"
Cohesion: 0.17
Nodes (13): AppError, validar(), avisosCorte(), baseEscopo(), CARGO_EM_ESCOPO, contarAtivos(), contarExcluidosPorPrecisao(), corteResposta() (+5 more)

### Community 55 - "registrarRotas"
Cohesion: 0.12
Nodes (18): base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato(), biometriaPorUf(), composicaoBiometria(), consultarBaseSecaoCandidato(), consultasBaseSecaoEmVoo (+10 more)

### Community 56 - "Tabelas"
Cohesion: 0.33
Nodes (5): Cabeçalho ordenável, Grupos recolhíveis (Comparação local), Recarga, Tabelas, Valor nulo

### Community 58 - "lote.test.js"
Cohesion: 0.24
Nodes (7): carimbo(), carregarPasta(), gerarRelatorioLote(), copiaAlterada(), db, fixture, juntar()

### Community 59 - "PainelView.vue"
Cohesion: 0.14
Nodes (15): candidatos, candidatosNominais(), candidatos, analiseQuery, avisos, candidatos, candidatoSelecionado, mapaUfQuery (+7 more)

### Community 61 - "importarArquivo"
Cohesion: 0.23
Nodes (13): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), app (+5 more)

### Community 75 - "Arquitetura"
Cohesion: 0.40
Nodes (4): Arquitetura, Backend, Fluxo de análise, Frontend

### Community 77 - "Blueprint — regras de domínio"
Cohesion: 0.40
Nodes (4): Análise e cobertura, Blueprint — regras de domínio, Endpoints de análise, Limitações conhecidas

### Community 79 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

### Community 82 - "format.js"
Cohesion: 0.11
Nodes (19): campos, camposAusentes, camposNaoInformados, props, { t }, participacao, percentualDoCandidato, props (+11 more)

### Community 85 - "RelatorioView.vue"
Cohesion: 0.15
Nodes (11): { alternar, ariaSort, seta, params }, alvo, cargoSelecionado, cobertura, consistencia, linhas, percentualCobertura, referencias (+3 more)

### Community 86 - "lib/ordenacao.js"
Cohesion: 0.31
Nodes (8): comparar(), lerOrdenacao(), nulo(), ordenacaoSchema(), ordenarLista(), ordenarSql(), colunas, lista

### Community 89 - "filters.js"
Cohesion: 0.29
Nodes (8): deInputSaoPaulo(), offsetSaoPaulo(), cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

## Knowledge Gaps
- **495 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+490 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 637 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `registrarRotas()` connect `registrarRotas` to `routes/index.js`, `versoes-bu.js`, `concentracao.js`, `duplicacao.js`, `outliers.js`, `env.js`, `aplicarFiltroCorte`, `corte.js`, `lib/ordenacao.js`, `caminhoFixture`, `status-secao.test.js`, `app.js`, `importarArquivo`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `formatarNumero()` connect `formatarNumero` to `SectionsTable.vue`, `MapPanel.vue`, `ComparacaoLocalPanel.vue`, `UfPanel.vue`, `SecaoView.vue`, `PlotDia.vue`, `BiometriaView.vue`, `MapTable.vue`, `EstatisticaPanel.vue`, `lib.test.js`, `format.js`, `PlacarRanking.vue`, `StateBlock.vue`, `RelatorioView.vue`, `useOrdenacao`, `ConsistenciaPanel.vue`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `mv-secao-candidato.test.js`, `criarCache`, `caminhoFixture`, `lote.test.js`, `status-secao.test.js`, `app.js`, `importarArquivo`, `db-teste.js`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `registrarRotas()` (e.g. with `itemSecao()` and `main()`) actually correct?**
  _`registrarRotas()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _495 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07867494824016563 - nodes in this community are weakly interconnected._