# Graph Report - doomsdayvote  (2026-10-31)

## Corpus Check
- 190 files · ~173,219 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1247 nodes · 2489 edges · 88 communities (66 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c6e8ed3`
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
- EncerramentoView.vue
- server.js
- queries.js
- AppError
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
- importarArquivo
- AnaliseCobertura.vue
- registrarRotas
- caminhoFixture
- API de leitura
- AnaliseView.vue
- fixtures.js
- geo-carregar.js
- SectionsTable.vue
- routes/index.js
- schema.test.js
- UfPanel.vue
- i18n/index.js
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- validacoes.js
- versoes-bu.js
- useSelecaoEleicao
- concentracao.js
- RedisFalso
- FilterBar.vue
- criarCache
- benford.js
- TabelaScroll.vue
- lib.test.js
- PlacarRanking.vue
- partido-cor.test.js
- StateBlock.vue
- corte.js
- integration/ordenacao.test.js
- estatisticas.js
- Tabelas
- criarDb
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- versoes.test.js
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
- format.js
- consistencia.js
- RelatorioView.vue
- duplicacao.js
- filters.js

## God Nodes (most connected - your core abstractions)
1. `registrarRotas()` - 52 edges
2. `useOrdenacao()` - 41 edges
3. `importarArquivo()` - 39 edges
4. `criarDb()` - 29 edges
5. `caminhoFixture()` - 29 edges
6. `formatarNumero()` - 28 edges
7. `useFiltersStore` - 24 edges
8. `useSelecaoEleicao()` - 23 edges
9. `aplicarFiltroCorte()` - 22 edges
10. `aplicarEscopo()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `erroDe()` --calls--> `resolverCorte()`  [EXTRACTED]
  backend/tests/unit/corte.test.js → backend/src/modules/apuracao/corte.js
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordNiveisPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/ConsistenciaPanel.vue → frontend/src/composables/ordenacao.js

## Import Cycles
- None detected.

## Communities (88 total, 10 thin omitted)

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
Cohesion: 0.08
Nodes (40): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+32 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.08
Nodes (24): motivoSecao(), boletim, consulta, dados, emit, fechar(), habilitado, id (+16 more)

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

### Community 11 - "EncerramentoView.vue"
Cohesion: 0.05
Nodes (30): api, ApiError, montarQuery(), obter(), analiseQuery, carregandoMunicipios, carregandoSecoes, municipios (+22 more)

### Community 12 - "server.js"
Cohesion: 0.46
Nodes (5): criarDependencias(), migracoesPendentes(), loadApiEnv(), criarLogger(), main()

### Community 13 - "queries.js"
Cohesion: 0.43
Nodes (18): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoLocal(), useConcentracao() (+10 more)

### Community 14 - "AppError"
Cohesion: 0.39
Nodes (3): AppError, validar(), buscarEleicao()

### Community 15 - "MapTable.vue"
Cohesion: 0.14
Nodes (14): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+6 more)

### Community 16 - "formatarNumero"
Cohesion: 0.13
Nodes (15): cobertura, emit, grupos, percentual(), pontosPercentuais(), { t }, cobertura, emit (+7 more)

### Community 17 - "Plano — Decisões da rodada de perguntas + arquitetura e performance"
Cohesion: 0.25
Nodes (7): Decisões de execução (2026-10-31), Decisões do usuário (2026-10-31), Execução e validação, Parte A — Cards já decididos (um commit por card), Parte B — `916d` Organização das rotas e módulos (proposta para aprovação), Parte C — `a620` Paginação no banco e flags de heap/stack (medir antes de decidir), Plano — Decisões da rodada de perguntas + arquitetura e performance

### Community 18 - "env.js"
Cohesion: 0.12
Nodes (16): apiSchema, booleanEnv, carregar(), databaseEnv, loadWorkerEnv(), logLevel, migrateSchema, nodeEnv (+8 more)

### Community 19 - "aplicarFiltroCorte"
Cohesion: 0.26
Nodes (12): concentracao(), base(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), aplicarEscopo(), aplicarFiltroCorte(), contarSecoesComBu() (+4 more)

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
Nodes (15): agregado, agrupar, agruparRegiao, base, emit, props, REGIAO, props (+7 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "importarArquivo"
Cohesion: 0.16
Nodes (15): resolverCorte(), somarVotos(), escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote() (+7 more)

### Community 26 - "AnaliseCobertura.vue"
Cohesion: 0.33
Nodes (5): campos, camposAusentes, camposNaoInformados, props, { t }

### Community 27 - "registrarRotas"
Cohesion: 0.38
Nodes (7): escopoDaEleicao(), escopoDe(), motivoSql(), registrarRotas(), resumoPartidoVencedor(), statusSql(), tamanhoPagina()

### Community 28 - "caminhoFixture"
Cohesion: 0.13
Nodes (20): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), caminhoFixture(), app, db, importar() (+12 more)

### Community 29 - "API de leitura"
Cohesion: 0.12
Nodes (16): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections`, GET /api/estatisticas (+8 more)

### Community 30 - "AnaliseView.vue"
Cohesion: 0.13
Nodes (14): queryClient, router, analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery, ordemConsistencia, ordemMargem (+6 more)

### Community 31 - "fixtures.js"
Cohesion: 0.18
Nodes (11): contar(), limparBanco(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync, db (+3 more)

### Community 32 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.18
Nodes (12): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+4 more)

### Community 34 - "routes/index.js"
Cohesion: 0.07
Nodes (30): horariosDoBu(), iso(), baseSchema, buDaSecao(), cacheDeCorte(), CHAVES_BIOMETRIA_MUNICIPIOS, CHAVES_BIOMETRIA_SECOES, CHAVES_ENCERRAMENTO_MUNICIPIOS (+22 more)

### Community 35 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 36 - "UfPanel.vue"
Cohesion: 0.14
Nodes (16): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+8 more)

### Community 37 - "i18n/index.js"
Cohesion: 0.40
Nodes (3): definirLocale(), i18n, SUPORTADOS

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
Cohesion: 0.10
Nodes (35): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+27 more)

### Community 45 - "FilterBar.vue"
Cohesion: 0.40
Nodes (4): emit, municipioAtivo, props, UFS

### Community 47 - "benford.js"
Cohesion: 0.39
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 48 - "TabelaScroll.vue"
Cohesion: 0.11
Nodes (17): candidatos, mad(), props, formatarMad(), { alternar, ariaSort, seta, params }, blocos, escopo, estatisticasQuery (+9 more)

### Community 49 - "lib.test.js"
Cohesion: 0.27
Nodes (14): areaPorCodigo(), CATEGORIAS_VALIDAS, chaveArea(), codigoMunicipioCurto(), indexarAreas(), linhasMapa(), mapaPartidos(), normalizarCodigo() (+6 more)

### Community 50 - "PlacarRanking.vue"
Cohesion: 0.25
Nodes (8): candidatos, deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 51 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 52 - "StateBlock.vue"
Cohesion: 0.15
Nodes (9): emit, ativo, candidatos, emit, minimo, props, coberturaEfetiva, entradas (+1 more)

### Community 53 - "corte.js"
Cohesion: 0.24
Nodes (11): avisosCorte(), baseEscopo(), CARGO_EM_ESCOPO, contarAtivos(), contarExcluidosPorPrecisao(), corteResposta(), corteSchema, dataValida() (+3 more)

### Community 54 - "integration/ordenacao.test.js"
Cohesion: 0.50
Nodes (4): app, db, json(), obter()

### Community 55 - "estatisticas.js"
Cohesion: 0.14
Nodes (11): base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato(), biometriaPorUf(), composicaoBiometria(), consultarBaseSecaoCandidato(), consultasBaseSecaoEmVoo (+3 more)

### Community 56 - "Tabelas"
Cohesion: 0.40
Nodes (4): Cabeçalho ordenável, Recarga, Tabelas, Valor nulo

### Community 58 - "criarDb"
Cohesion: 0.18
Nodes (10): criarDb(), carimbo(), carregarPasta(), gerarRelatorioLote(), main(), copiaAlterada(), db, fixture (+2 more)

### Community 59 - "PainelView.vue"
Cohesion: 0.12
Nodes (17): candidatos, {
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
}, resumoQuery, candidatosNominais(), candidatos, analiseQuery, avisos, candidatos (+9 more)

### Community 61 - "versoes.test.js"
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
Cohesion: 0.18
Nodes (10): lista, props, avisoInfo(), AVISOS, MOTIVOS, opcoesStatus(), STATUS_KEYS, STATUS_SECAO (+2 more)

### Community 82 - "format.js"
Cohesion: 0.15
Nodes (16): participacao, percentualDoCandidato, props, validos, votosDoCandidato, recebimento(), deInputSaoPaulo(), formatadorOffset (+8 more)

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
Cohesion: 0.39
Nodes (6): cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

## Knowledge Gaps
- **482 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+477 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 618 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `registrarRotas()` connect `registrarRotas` to `routes/index.js`, `versoes-bu.js`, `concentracao.js`, `server.js`, `AppError`, `aplicarFiltroCorte`, `consistencia.js`, `corte.js`, `duplicacao.js`, `estatisticas.js`, `integration/ordenacao.test.js`, `importarArquivo`, `caminhoFixture`, `versoes.test.js`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `useOrdenacao()` connect `useOrdenacao` to `components.test.js`, `SectionsTable.vue`, `UfPanel.vue`, `SecaoView.vue`, `EncerramentoView.vue`, `MapTable.vue`, `TabelaScroll.vue`, `formatarNumero`, `StateBlock.vue`, `MapaView.vue`, `RelatorioView.vue`, `ConsistenciaPanel.vue`, `PainelView.vue`, `AnaliseView.vue`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `server.js`, `env.js`, `partido-cor.test.js`, `integration/ordenacao.test.js`, `importarArquivo`, `caminhoFixture`, `versoes.test.js`, `integration/corte.test.js`, `fixtures.js`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `registrarRotas()` (e.g. with `itemSecao()` and `main()`) actually correct?**
  _`registrarRotas()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _482 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components.test.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._