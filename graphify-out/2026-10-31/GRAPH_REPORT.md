# Graph Report - doomsdayvote  (2026-10-31)

## Corpus Check
- 192 files · ~173,855 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1259 nodes · 2514 edges · 92 communities (69 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a62eedf3`
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
- Plano — Correção dos Technical Debts do code review
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
- validacoes.js
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
- StateBlock.vue
- corte.js
- integration/ordenacao.test.js
- estatisticas.js
- Tabelas
- lote.test.js
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- criarDb
- integration/corte.test.js
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md
- Arquitetura
- Blueprint — regras de domínio
- migracoes.test.js
- status.js
- KpiCards.vue
- formatarDataHora
- consistencia.js
- RelatorioView.vue
- duplicacao.js
- importacao-fora-de-ordem.test.js
- filters.js
- regressao-apuracao.test.js
- motivoSecao

## God Nodes (most connected - your core abstractions)
1. `registrarRotas()` - 50 edges
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

## Communities (92 total, 11 thin omitted)

### Community 0 - "components.test.js"
Cohesion: 0.14
Nodes (10): biometria, fatias, participacao, props, { t }, candidatos, ControleFalso, eleicoes (+2 more)

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
Cohesion: 0.09
Nodes (37): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+29 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.08
Nodes (22): boletim, consulta, dados, emit, fechar(), habilitado, id, lote (+14 more)

### Community 7 - "persistir-bus.js"
Cohesion: 0.17
Nodes (18): dataOrigem(), FUSO_ORIGEM_BWEB, instanteOrigemSql(), localOrigem(), categorizar(), normalizarTexto(), dataHora(), hashConteudoBu() (+10 more)

### Community 8 - "PlotDia.vue"
Cohesion: 0.07
Nodes (34): candidatos, {
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
}, resumoQuery, emit, municipioAtivo, props, UFS, animar() (+26 more)

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
Cohesion: 0.43
Nodes (18): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoLocal(), useConcentracao() (+10 more)

### Community 14 - "AppError"
Cohesion: 0.39
Nodes (3): AppError, validar(), buscarEleicao()

### Community 15 - "MapTable.vue"
Cohesion: 0.16
Nodes (12): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+4 more)

### Community 16 - "formatarPercentual"
Cohesion: 0.11
Nodes (16): cobertura, emit, grupos, percentual(), pontosPercentuais(), props, { t }, cobertura (+8 more)

### Community 17 - "Plano — Correção dos Technical Debts do code review"
Cohesion: 0.25
Nodes (7): Cards parciais, Contexto, Delegação e limites, Execução (ordem, um commit por card), Fora do escopo (dependem de decisão), Plano — Correção dos Technical Debts do code review, Validação

### Community 18 - "env.js"
Cohesion: 0.18
Nodes (12): migracoesPendentes(), apiSchema, booleanEnv, carregar(), databaseEnv, loadApiEnv(), logLevel, migrateSchema (+4 more)

### Community 19 - "registrarRotas"
Cohesion: 0.22
Nodes (17): concentracao(), base(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), aplicarEscopo(), aplicarFiltroCorte(), metadadosCorte() (+9 more)

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
Cohesion: 0.11
Nodes (14): agregado, agrupar, agruparRegiao, base, emit, props, REGIAO, grupos (+6 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "importarArquivo"
Cohesion: 0.21
Nodes (12): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), app (+4 more)

### Community 26 - "formatarNumero"
Cohesion: 0.12
Nodes (15): campos, camposAusentes, camposNaoInformados, numero(), props, { t }, { alternar, ariaSort, seta, params }, blocos (+7 more)

### Community 27 - "outliers.js"
Cohesion: 0.27
Nodes (12): amostraLof(), amostrar(), caminhoEsperado(), comprimento(), construirArvore(), FEATURES, isolationForest(), localOutlierFactor() (+4 more)

### Community 28 - "app.js"
Cohesion: 0.16
Nodes (13): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), app, db, importar(), app (+5 more)

### Community 29 - "API de leitura"
Cohesion: 0.12
Nodes (16): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections`, GET /api/estatisticas (+8 more)

### Community 30 - "AnaliseView.vue"
Cohesion: 0.14
Nodes (13): router, analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery, ordemConsistencia, ordemMargem, ordemShare (+5 more)

### Community 31 - "fixtures.js"
Cohesion: 0.19
Nodes (12): contar(), limparBanco(), FIXTURES, LINHAS_POR_FIXTURE, app, db, backendDir, db (+4 more)

### Community 32 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.18
Nodes (12): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+4 more)

### Community 34 - "routes/index.js"
Cohesion: 0.07
Nodes (30): baseSchema, buDaSecao(), cacheDeCorte(), CHAVES_BIOMETRIA_MUNICIPIOS, CHAVES_BIOMETRIA_SECOES, CHAVES_ENCERRAMENTO_MUNICIPIOS, CHAVES_ENCERRAMENTO_SECOES, COLUNAS_BENFORD (+22 more)

### Community 35 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 36 - "UfPanel.vue"
Cohesion: 0.14
Nodes (16): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+8 more)

### Community 37 - "caminhoFixture"
Cohesion: 0.18
Nodes (9): caminhoFixture(), importar(), app, db, importar(), db, importar(), db (+1 more)

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
Nodes (23): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+15 more)

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
Cohesion: 0.16
Nodes (12): candidatos, mad(), props, parametros, props, score(), secoes, formatadorOffset (+4 more)

### Community 49 - "lib.test.js"
Cohesion: 0.21
Nodes (18): indiceAreas, nomeDaFeicao(), prepararFeatures(), areaPorCodigo(), candidatoDaArea(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto() (+10 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.18
Nodes (12): candidatos, deltas, emit, escolher(), props, validos, validosAte1715, validosTardios (+4 more)

### Community 51 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 52 - "StateBlock.vue"
Cohesion: 0.14
Nodes (10): emit, ativo, candidatos, emit, formatarMad(), minimo, props, coberturaEfetiva (+2 more)

### Community 53 - "corte.js"
Cohesion: 0.29
Nodes (10): avisosCorte(), baseEscopo(), CARGO_EM_ESCOPO, contarAtivos(), contarExcluidosPorPrecisao(), corteResposta(), corteSchema, dataValida() (+2 more)

### Community 54 - "integration/ordenacao.test.js"
Cohesion: 0.50
Nodes (4): app, db, json(), obter()

### Community 55 - "estatisticas.js"
Cohesion: 0.14
Nodes (11): base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato(), biometriaPorUf(), composicaoBiometria(), consultarBaseSecaoCandidato(), consultasBaseSecaoEmVoo (+3 more)

### Community 56 - "Tabelas"
Cohesion: 0.50
Nodes (3): Cabeçalho ordenável, Recarga, Tabelas

### Community 58 - "lote.test.js"
Cohesion: 0.24
Nodes (7): carimbo(), carregarPasta(), gerarRelatorioLote(), copiaAlterada(), db, fixture, juntar()

### Community 59 - "PainelView.vue"
Cohesion: 0.18
Nodes (10): analiseQuery, avisos, candidatoSelecionado, ordemVotosEstado, resumoQuery, resumoTabelaQuery, {
  store,
  aoCandidato,
  aoCorte,
}, timelineAvisos (+2 more)

### Community 61 - "criarDb"
Cohesion: 0.25
Nodes (9): criarDb(), loadWorkerEnv(), main(), db, env, main(), cores, db (+1 more)

### Community 62 - "integration/corte.test.js"
Cohesion: 0.29
Nodes (3): contarCorte(), db, importar()

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
Cohesion: 0.18
Nodes (10): lista, props, avisoInfo(), AVISOS, MOTIVOS, opcoesStatus(), STATUS_KEYS, STATUS_SECAO (+2 more)

### Community 82 - "KpiCards.vue"
Cohesion: 0.33
Nodes (5): participacao, percentualDoCandidato, props, validos, votosDoCandidato

### Community 83 - "formatarDataHora"
Cohesion: 0.53
Nodes (6): recebimento(), formatarCorte(), formatarData(), formatarDataHora(), localeAtual(), recebimento()

### Community 84 - "consistencia.js"
Cohesion: 0.36
Nodes (6): ausente(), consistenciaPorSecao(), REGRAS, validarConsistenciaBu(), buOk, resultadosOk

### Community 85 - "RelatorioView.vue"
Cohesion: 0.15
Nodes (11): { alternar, ariaSort, seta, params }, alvo, cargoSelecionado, cobertura, consistencia, linhas, percentualCobertura, referencias (+3 more)

### Community 86 - "duplicacao.js"
Cohesion: 0.18
Nodes (13): comparar(), lerOrdenacao(), nulo(), ordenacaoSchema(), ordenarLista(), ordenarSql(), agruparAssinaturas(), chaveMunicipio() (+5 more)

### Community 89 - "filters.js"
Cohesion: 0.29
Nodes (8): deInputSaoPaulo(), offsetSaoPaulo(), cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

## Knowledge Gaps
- **485 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+480 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 626 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `registrarRotas()` connect `registrarRotas` to `routes/index.js`, `caminhoFixture`, `versoes-bu.js`, `concentracao.js`, `status-secao.js`, `AppError`, `env.js`, `consistencia.js`, `corte.js`, `duplicacao.js`, `estatisticas.js`, `integration/ordenacao.test.js`, `importarArquivo`, `outliers.js`, `app.js`, `fixtures.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `MapaFalso` connect `MapaFalso` to `components.test.js`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `useOrdenacao()` connect `useOrdenacao` to `components.test.js`, `SectionsTable.vue`, `UfPanel.vue`, `SecaoView.vue`, `BiometriaView.vue`, `EncerramentoView.vue`, `MapTable.vue`, `format.js`, `formatarPercentual`, `StateBlock.vue`, `MapaView.vue`, `RelatorioView.vue`, `ConsistenciaPanel.vue`, `formatarNumero`, `PainelView.vue`, `AnaliseView.vue`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `registrarRotas()` (e.g. with `main()` and `api.test.js`) actually correct?**
  _`registrarRotas()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _485 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._