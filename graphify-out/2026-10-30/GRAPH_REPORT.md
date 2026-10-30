# Graph Report - doomsdayvote  (2026-10-30)

## Corpus Check
- 182 files · ~168,990 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1196 nodes · 2251 edges · 77 communities (58 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e3fd24bf`
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
- corte.js
- MapTable.vue
- formatarPercentual
- Plano atual
- env.js
- regressao-apuracao.test.js
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- format.js
- ConsistenciaPanel.vue
- AnaliseView.vue
- outliers.js
- PainelView.vue
- API de leitura
- validacoes.js
- formatarNumero
- BiometriaUfPanel.vue
- SectionsTable.vue
- server.js
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
- schema.test.js
- consistencia.js
- aplicarFiltroCorte
- estatisticas.js
- RedisFalso
- migracoes.test.js
- 0002_resultado_votavel_colunas.js
- importarArquivo
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md
- Arquitetura
- Blueprint — regras de domínio
- BiometriaPanel.vue

## God Nodes (most connected - your core abstractions)
1. `registrarRotas()` - 43 edges
2. `importarArquivo()` - 40 edges
3. `caminhoFixture()` - 30 edges
4. `criarDb()` - 29 edges
5. `formatarNumero()` - 29 edges
6. `aplicarFiltroCorte()` - 22 edges
7. `useFiltersStore` - 22 edges
8. `aplicarEscopo()` - 19 edges
9. `useSelecaoEleicao()` - 19 edges
10. `formatarPercentual()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `contarCorte()` --calls--> `aplicarFiltroCorte()`  [EXTRACTED]
  backend/tests/integration/corte.test.js → backend/src/modules/apuracao/corte.js
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `diferenca()` --calls--> `formatarNumero()`  [EXTRACTED]
  frontend/src/components/ConsistenciaPanel.vue → frontend/src/lib/format.js
- `inteiro()` --calls--> `formatarNumero()`  [EXTRACTED]
  frontend/src/components/EstatisticaPanel.vue → frontend/src/lib/format.js
- `validos` --calls--> `votosValidos()`  [EXTRACTED]
  frontend/src/components/KpiCards.vue → frontend/src/lib/agregacoes.js

## Import Cycles
- None detected.

## Communities (77 total, 8 thin omitted)

### Community 0 - "routes/index.js"
Cohesion: 0.19
Nodes (14): AppError, CODIGOS, eleicoesDoAno(), estatisticasDaEleicao(), numero(), baseSchema, buDaSecao(), buscarEleicao() (+6 more)

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
Nodes (40): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+32 more)

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

### Community 14 - "corte.js"
Cohesion: 0.28
Nodes (10): validar(), avisosCorte(), baseEscopo(), contarAtivos(), contarExcluidosPorPrecisao(), corteResposta(), corteSchema, dataValida() (+2 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.13
Nodes (15): aoClicarLinha(), emit, linhas, linhasBase, linhasPagina, nomeCandidato(), ordenacao, pagina (+7 more)

### Community 16 - "formatarPercentual"
Cohesion: 0.13
Nodes (14): percentual(), cobertura, emit, percentual(), percentualRazao(), props, topMargem, topShare (+6 more)

### Community 17 - "Plano atual"
Cohesion: 0.20
Nodes (9): Alterações, Etapas propostas, Evidências, Implementação, Limites, Objetivo, Plano atual, Plano de otimização de banco e cache (+1 more)

### Community 18 - "env.js"
Cohesion: 0.12
Nodes (16): apiSchema, booleanEnv, carregar(), databaseEnv, loadWorkerEnv(), logLevel, migrateSchema, nodeEnv (+8 more)

### Community 19 - "regressao-apuracao.test.js"
Cohesion: 0.27
Nodes (6): base(), somarMetricasSecao(), somarVotos(), totaisPorArea(), db, db

### Community 20 - "colors.js"
Cohesion: 0.20
Nodes (15): legenda, clarear(), COR_NEUTRA, COR_SEM_DADOS, corDaArea(), corDoLider(), corPartido(), corPercentual() (+7 more)

### Community 21 - "MapaView.vue"
Cohesion: 0.12
Nodes (9): avisos, candidatos, mapaQuery, mapaUfQuery, resumoQuery, router, secaoModalId, secoesQuery (+1 more)

### Community 22 - "Plano de evolução da auditoria de votos"
Cohesion: 0.13
Nodes (14): 1. Consistência aritmética por seção, 2. Comparação entre seções semelhantes, 3. Diferenças entre versões de BU, 4. Indicadores de concentração e margem, 5. Cobertura e limitações dos dados, 6. Revisão dos indicadores existentes, Critérios de conclusão, Dependências e decisões pendentes para a implementação (+6 more)

### Community 23 - "format.js"
Cohesion: 0.18
Nodes (14): recebimento(), comparacao, props, versoes, deInputSaoPaulo(), formatadorOffset, formatadorPartes, formatarCorte() (+6 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 26 - "AnaliseView.vue"
Cohesion: 0.10
Nodes (15): emit, blocos, escopo, estatisticasQuery, inteiro(), { locale }, props, temDoisTurnos (+7 more)

### Community 27 - "outliers.js"
Cohesion: 0.27
Nodes (13): amostraLof(), amostrar(), caminhoEsperado(), comprimento(), construirArvore(), FEATURES, isolationForest(), localOutlierFactor() (+5 more)

### Community 28 - "PainelView.vue"
Cohesion: 0.12
Nodes (18): candidatos, {
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
}, resumoQuery, candidatos, votosUf, candidatosNominais(), queryClient, router (+10 more)

### Community 29 - "API de leitura"
Cohesion: 0.13
Nodes (14): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections`, GET /api/estatisticas (+6 more)

### Community 30 - "validacoes.js"
Cohesion: 0.20
Nodes (15): alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), criarValidador(), encodingSuspeito() (+7 more)

### Community 31 - "formatarNumero"
Cohesion: 0.12
Nodes (14): campos, camposAusentes, camposNaoInformados, numero(), props, { t }, cobertura, emit (+6 more)

### Community 32 - "BiometriaUfPanel.vue"
Cohesion: 0.17
Nodes (10): agregado, agrupar, agruparRegiao, base, emit, linhas, ordenacao, props (+2 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.18
Nodes (11): contexto, emit, irPara(), irParaUltima(), itens, pagina, props, statusDisponiveis (+3 more)

### Community 34 - "server.js"
Cohesion: 0.46
Nodes (5): criarDependencias(), migracoesPendentes(), loadApiEnv(), criarLogger(), main()

### Community 35 - "status.js"
Cohesion: 0.15
Nodes (11): lista, props, definirLocale(), i18n, SUPORTADOS, avisoInfo(), AVISOS, MOTIVOS (+3 more)

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
Cohesion: 0.09
Nodes (34): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), criarGrupo(), media() (+26 more)

### Community 44 - "CoberturaBlock.vue"
Cohesion: 0.17
Nodes (7): coberturaEfetiva, entradas, limitacoesEfetivas, props, { t }, grupos, props

### Community 45 - "status-secao.js"
Cohesion: 0.31
Nodes (6): classificarStatusSecao(), diaEmSaoPaulo(), horarios(), iso(), resultado(), STATUS_POR_TIPO_URNA

### Community 47 - "benford.js"
Cohesion: 0.39
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 48 - "BenfordPanel.vue"
Cohesion: 0.12
Nodes (15): candidatos, mad(), props, ativo, candidatos, emit, formatarMad(), minimo (+7 more)

### Community 49 - "lib.test.js"
Cohesion: 0.29
Nodes (13): areaPorCodigo(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas(), mapaPartidos(), normalizarCodigo(), percentualDaArea() (+5 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.29
Nodes (7): deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 52 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 53 - "consistencia.js"
Cohesion: 0.36
Nodes (6): ausente(), consistenciaPorSecao(), REGRAS, validarConsistenciaBu(), buOk, resultadosOk

### Community 54 - "aplicarFiltroCorte"
Cohesion: 0.24
Nodes (12): comparacaoLocal(), concentracao(), base(), agruparAssinaturas(), chaveMunicipio(), chaveZona(), duplicacaoPorAssinatura(), aplicarEscopo() (+4 more)

### Community 55 - "estatisticas.js"
Cohesion: 0.14
Nodes (11): base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato(), biometriaPorUf(), composicaoBiometria(), consultarBaseSecaoCandidato(), consultasBaseSecaoEmVoo (+3 more)

### Community 59 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

### Community 62 - "importarArquivo"
Cohesion: 0.05
Nodes (66): buildApp(), detalhesFastify(), detalhesZod(), criarDb(), isProduction(), carimbo(), carregarPasta(), escaparCopy() (+58 more)

### Community 75 - "Arquitetura"
Cohesion: 0.40
Nodes (4): Arquitetura, Backend, Fluxo de análise, Frontend

### Community 77 - "Blueprint — regras de domínio"
Cohesion: 0.40
Nodes (4): Análise e cobertura, Blueprint — regras de domínio, Endpoints de análise, Limitações conhecidas

### Community 81 - "BiometriaPanel.vue"
Cohesion: 0.33
Nodes (5): biometria, fatias, participacao, props, { t }

## Knowledge Gaps
- **457 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+452 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 606 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `formatarNumero()` connect `formatarNumero` to `BiometriaUfPanel.vue`, `SectionsTable.vue`, `MapPanel.vue`, `UfPanel.vue`, `VotosPorEstadoPanel.vue`, `SecaoView.vue`, `PlotDia.vue`, `BiometriaView.vue`, `EncerramentoView.vue`, `MapTable.vue`, `BenfordPanel.vue`, `BiometriaPanel.vue`, `formatarPercentual`, `PlacarRanking.vue`, `lib.test.js`, `format.js`, `ConsistenciaPanel.vue`, `AnaliseView.vue`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `registrarRotas()` connect `routes/index.js` to `server.js`, `versoes-bu.js`, `status-secao.js`, `corte.js`, `regressao-apuracao.test.js`, `consistencia.js`, `aplicarFiltroCorte`, `estatisticas.js`, `outliers.js`, `importarArquivo`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `criarDb()` connect `importarArquivo` to `geo-carregar.js`, `regressao-apuracao.test.js`, `server.js`, `env.js`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `registrarRotas()` (e.g. with `main()` and `api.test.js`) actually correct?**
  _`registrarRotas()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _457 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0782608695652174 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._