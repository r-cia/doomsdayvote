# Graph Report - doomsdayvote  (2026-10-31)

## Corpus Check
- 223 files · ~186,527 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1453 nodes · 3069 edges · 98 communities (73 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d5f05e4`
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
- comparar.js
- EntreAnosView.vue
- format.js
- queries.js
- MapTable.vue
- formatarNumero
- Plano — Decisões da rodada de perguntas + arquitetura e performance
- env.js
- mv-secao-candidato.test.js
- colors.js
- MapaView.vue
- Plano de evolução da auditoria de votos
- useOrdenacao
- ConsistenciaPanel.vue
- schema.test.js
- criarDb
- registrarRotas
- RelatorioView.vue
- API de leitura
- StateBlock.vue
- caminhoFixture
- geo-carregar.js
- SectionsTable.vue
- App.vue
- Entre anos
- UfPanel.vue
- analise.js
- Product
- AGENTS.md — SYSTEM DIRECTIVES
- validacoes.js
- versoes-bu.js
- TabelaScroll.vue
- concentracao.js
- server.js
- useSelecaoEleicao
- criarCache
- RedisFalso
- status.js
- duplicacao.js
- EstatisticaPanel.vue
- BiometriaUfPanel.vue
- lote.test.js
- importarArquivo
- Tabelas
- BiometriaView.vue
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- aplicarFiltroCorte
- corte.js
- buweb-2014.md
- buweb-2018.md
- ~~qT~~
- buweb-2026.md
- frontend.md
- Arquitetura
- Blueprint — regras de domínio
- status-secao.test.js
- routes/secoes.js
- lib.test.js
- PlacarRanking.vue
- benford.js
- consistencia.js
- ordenarLista
- partido-cor.test.js
- filters.js
- integration/corte.test.js
- BiometriaPanel.vue
- 0011_sg_partido_2014.js
- migracoes.test.js
- formatarDataHora
- FilterBar.vue
- motivoSecao

## God Nodes (most connected - your core abstractions)
1. `importarArquivo()` - 43 edges
2. `useOrdenacao()` - 41 edges
3. `caminhoFixture()` - 33 edges
4. `criarDb()` - 32 edges
5. `aplicarFiltroCorte()` - 31 edges
6. `formatarNumero()` - 31 edges
7. `registrarAnalise()` - 26 edges
8. `useFiltersStore` - 26 edges
9. `useSelecaoEleicao()` - 24 edges
10. `aplicarEscopo()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `contarCorte()` --calls--> `aplicarFiltroCorte()`  [EXTRACTED]
  backend/tests/integration/corte.test.js → backend/src/modules/apuracao/corte.js
- `main()` --indirect_call--> `registrarRotas()`  [INFERRED]
  backend/src/server.js → backend/src/routes/index.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordNiveisPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BiometriaUfPanel.vue → frontend/src/composables/ordenacao.js

## Import Cycles
- None detected.

## Communities (98 total, 10 thin omitted)

### Community 0 - "EncerramentoView.vue"
Cohesion: 0.08
Nodes (21): api, ApiError, montarQuery(), obter(), carregandoMunicipios, carregandoSecoes, carregandoUrnas, erroMunicipios (+13 more)

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
Cohesion: 0.08
Nodes (39): ajustarVisao(), aoClicar(), aoMover(), areaDaFeicao(), arquivoMalha(), atualizarFonte(), cacheMalhas, CAMPOS_MUNICIPIO (+31 more)

### Community 6 - "SecaoView.vue"
Cohesion: 0.08
Nodes (22): boletim, consulta, dados, emit, fechar(), habilitado, id, lote (+14 more)

### Community 7 - "persistir-bus.js"
Cohesion: 0.17
Nodes (18): dataOrigem(), FUSO_ORIGEM_BWEB, instanteOrigemSql(), localOrigem(), categorizar(), normalizarTexto(), dataHora(), hashConteudoBu() (+10 more)

### Community 8 - "PlotDia.vue"
Cohesion: 0.12
Nodes (23): animar(), aoApontar(), aoIndice(), aoMover(), aoPressionar(), area, canvas, desenhar() (+15 more)

### Community 9 - "Doomsday Vote"
Cohesion: 0.06
Nodes (30): 10. Scripts úteis, 11. Estrutura do projeto, 12. Troubleshooting, 13. Testes, 14.1 Servidor Postgres 16, 14.2 Conexões da aplicação (`backend/src/db/index.js`), 14.3 Índices, 14.4 Estatísticas estendidas (+22 more)

### Community 10 - "Design System: Doomsday Vote"
Cohesion: 0.09
Nodes (22): Buttons, Cards / Containers, Chips, Colors, Components, Design System: Doomsday Vote, Do:, Do's and Don'ts (+14 more)

### Community 11 - "comparar.js"
Cohesion: 0.14
Nodes (23): alinhar(), compararAnos(), formatarTurno(), paresDeAnos(), turnoDoAno(), candidatosDoTurno(), CARGO_PRESIDENTE, eleicoesPresidente() (+15 more)

### Community 12 - "EntreAnosView.vue"
Cohesion: 0.06
Nodes (46): caminhoDe(), desenhavel(), dominioY, figura, formatarY(), largura, limitesX, linhaZero (+38 more)

### Community 13 - "format.js"
Cohesion: 0.10
Nodes (18): candidatos, mad(), props, ativo, candidatos, emit, formatarMad(), minimo (+10 more)

### Community 14 - "queries.js"
Cohesion: 0.39
Nodes (20): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoAnos(), useComparacaoLocal() (+12 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.15
Nodes (13): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+5 more)

### Community 16 - "formatarNumero"
Cohesion: 0.11
Nodes (19): aberto, consulta, nivel, percentual(), pontosPercentuais(), props, secoes, { t } (+11 more)

### Community 17 - "Plano — Decisões da rodada de perguntas + arquitetura e performance"
Cohesion: 0.12
Nodes (15): Ajustes dos gráficos (2026-10-31), Cores e siglas de partidos 2014/2018 (2026-10-31), Correção — refresh das views na carga (2026-10-31), Decisões da segunda rodada, Decisões de execução (2026-10-31), Decisões do usuário, Decisões do usuário (2026-10-31), Execução e validação (+7 more)

### Community 18 - "env.js"
Cohesion: 0.12
Nodes (16): apiSchema, booleanEnv, carregar(), databaseEnv, loadWorkerEnv(), logLevel, migrateSchema, nodeEnv (+8 more)

### Community 19 - "mv-secao-candidato.test.js"
Cohesion: 0.32
Nodes (6): db, FINAL, normalizarGrupos(), ordenarListas(), POR_TABELAS, porTexto()

### Community 20 - "colors.js"
Cohesion: 0.18
Nodes (19): itensGradiente(), legenda, clarear(), COR_NEUTRA, COR_SEM_DADOS, corDaArea(), corDoLider(), corPartido() (+11 more)

### Community 21 - "MapaView.vue"
Cohesion: 0.09
Nodes (16): alterarNivel(), avisos, limparParaBrasil(), mapaQuery, mapaTabelaQuery, mapaUfQuery, ordemMapa, ordemSecoes (+8 more)

### Community 22 - "Plano de evolução da auditoria de votos"
Cohesion: 0.13
Nodes (14): 1. Consistência aritmética por seção, 2. Comparação entre seções semelhantes, 3. Diferenças entre versões de BU, 4. Indicadores de concentração e margem, 5. Cobertura e limitações dos dados, 6. Revisão dos indicadores existentes, Critérios de conclusão, Dependências e decisões pendentes para a implementação (+6 more)

### Community 23 - "useOrdenacao"
Cohesion: 0.17
Nodes (7): cobertura, emit, grupos, props, grupos, props, useOrdenacao()

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.17
Nodes (9): cobertura, emit, itens, props, resumo, rotuloRegra, router, store (+1 more)

### Community 25 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 26 - "criarDb"
Cohesion: 0.17
Nodes (13): criarDb(), contar(), limparBanco(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync (+5 more)

### Community 27 - "registrarRotas"
Cohesion: 0.13
Nodes (17): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), registrarRotas(), app, db, importar() (+9 more)

### Community 28 - "RelatorioView.vue"
Cohesion: 0.15
Nodes (11): { alternar, ariaSort, seta, params }, alvo, cargoSelecionado, cobertura, consistencia, linhas, percentualCobertura, referencias (+3 more)

### Community 29 - "API de leitura"
Cohesion: 0.11
Nodes (17): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-anos`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections` (+9 more)

### Community 30 - "StateBlock.vue"
Cohesion: 0.09
Nodes (18): campos, camposAusentes, camposNaoInformados, props, { t }, emit, coberturaEfetiva, entradas (+10 more)

### Community 31 - "caminhoFixture"
Cohesion: 0.12
Nodes (17): atualizarViews(), caminhoFixture(), app, db, importar(), app, db, importar() (+9 more)

### Community 32 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.18
Nodes (12): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+4 more)

### Community 34 - "App.vue"
Cohesion: 0.16
Nodes (10): {
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
}, resumoQuery, definirLocale(), i18n, SUPORTADOS, queryClient, router, comparacaoLocalQuery (+2 more)

### Community 35 - "Entre anos"
Cohesion: 0.33
Nodes (5): Entre anos, Estados, Gráficos, Seleção de anos, Tabela de correlação

### Community 36 - "UfPanel.vue"
Cohesion: 0.15
Nodes (15): agrupar, grupos, partidoPorNumero, props, REGIOES, votosUf, delta(), deltaTotal() (+7 more)

### Community 37 - "analise.js"
Cohesion: 0.14
Nodes (23): base(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), base(), baseSecaoCandidato(), benfordDosNiveis(), benfordPorCandidato() (+15 more)

### Community 38 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 39 - "AGENTS.md — SYSTEM DIRECTIVES"
Cohesion: 0.18
Nodes (10): 0. INITIALIZATION, 1. COMMUNICATION & OUTPUT FORMAT, 2. WORKFLOW & PROCESS CONTROL, 3. FILE MODIFICATION & SHELL RESTRICTIONS, 4. CODE STYLE & COMMENTING RULES, 5. SINGLE-SOURCE-OF-TRUTH DOCUMENTATION, 6. FRONTEND DEVELOPMENT, 7. DATABASE INTEGRITY & SAFETY (+2 more)

### Community 40 - "validacoes.js"
Cohesion: 0.19
Nodes (13): TIPOS, alerta(), cargoEmEscopo(), CARGOS_EM_ESCOPO, CHAVE_NATURAL, chaveBu(), chaveNatural(), normalizar() (+5 more)

### Community 41 - "versoes-bu.js"
Cohesion: 0.36
Nodes (9): ausente(), CAMPOS, chaveVotavel(), compararVersoes(), diferencaNumerica(), extrairVotaveis(), iguais(), normalizar() (+1 more)

### Community 42 - "TabelaScroll.vue"
Cohesion: 0.14
Nodes (9): comparacao, emit, props, versoes, candidatos, ControleFalso, eleicoes, filtros (+1 more)

### Community 43 - "concentracao.js"
Cohesion: 0.09
Nodes (43): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+35 more)

### Community 44 - "server.js"
Cohesion: 0.46
Nodes (5): criarDependencias(), migracoesPendentes(), loadApiEnv(), criarLogger(), main()

### Community 45 - "useSelecaoEleicao"
Cohesion: 0.23
Nodes (8): useEleicoes(), useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara(), formatarCargo()

### Community 48 - "status.js"
Cohesion: 0.18
Nodes (10): lista, props, avisoInfo(), AVISOS, MOTIVOS, opcoesStatus(), STATUS_KEYS, STATUS_SECAO (+2 more)

### Community 49 - "duplicacao.js"
Cohesion: 0.33
Nodes (8): agruparAssinaturas(), agruparComVencedorDeZona(), chaveMunicipio(), chaveZona(), COLUNAS_DUPLICACAO, duplicacaoPelaMv(), duplicacaoPorAssinatura(), vencedorDaSecao()

### Community 50 - "EstatisticaPanel.vue"
Cohesion: 0.22
Nodes (7): { alternar, ariaSort, seta, params }, blocos, escopo, estatisticasQuery, numero(), props, temDoisTurnos

### Community 52 - "BiometriaUfPanel.vue"
Cohesion: 0.25
Nodes (7): agregado, agrupar, agruparRegiao, base, emit, props, REGIAO

### Community 53 - "lote.test.js"
Cohesion: 0.18
Nodes (10): atualizarViewsMaterializadas(), VIEWS_MATERIALIZADAS, carimbo(), carregarPasta(), gerarRelatorioLote(), main(), copiaAlterada(), db (+2 more)

### Community 55 - "importarArquivo"
Cohesion: 0.26
Nodes (13): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), criarValidador() (+5 more)

### Community 56 - "Tabelas"
Cohesion: 0.29
Nodes (6): Cabeçalho ordenável, Estados: carregando, erro, sem dados, dados, Grupos recolhíveis (Comparação local), Recarga, Tabelas, Valor nulo

### Community 58 - "BiometriaView.vue"
Cohesion: 0.11
Nodes (14): analiseQuery, carregandoMunicipios, carregandoSecoes, erroMunicipios, erroSecoes, municipios, municipioSelecionado, ordemMunicipios (+6 more)

### Community 59 - "PainelView.vue"
Cohesion: 0.13
Nodes (16): candidatos, candidatos, candidatosNominais(), candidatos, analiseQuery, avisos, candidatos, candidatoSelecionado (+8 more)

### Community 61 - "aplicarFiltroCorte"
Cohesion: 0.22
Nodes (18): agregadosRelatorio(), metricas(), relatorioDaEleicao(), aplicarEscopo(), aplicarFiltroCorte(), CARGO_EM_ESCOPO, contarSecoesComBu(), linhaDoTempo() (+10 more)

### Community 62 - "corte.js"
Cohesion: 0.26
Nodes (12): avisosCorte(), baseEscopo(), contarAtivos(), contarExcluidosPorPrecisao(), corteSchema, dataValida(), metadadosCorte(), baseSchema (+4 more)

### Community 75 - "Arquitetura"
Cohesion: 0.40
Nodes (4): Arquitetura, Backend, Fluxo de análise, Frontend

### Community 77 - "Blueprint — regras de domínio"
Cohesion: 0.29
Nodes (6): Análise e cobertura, Blueprint — regras de domínio, Endpoints de análise, Entre anos, Limitações conhecidas, Siglas e cores de partidos

### Community 79 - "status-secao.test.js"
Cohesion: 0.29
Nodes (5): app, db, importar(), itemDaSecao(), itens()

### Community 81 - "routes/secoes.js"
Cohesion: 0.17
Nodes (18): AppError, validar(), buDaSecao(), buscarSecao(), COLUNAS_SECOES, detalheDoBoletim(), itemSecao(), listarSecoes() (+10 more)

### Community 82 - "lib.test.js"
Cohesion: 0.14
Nodes (24): participacao, percentualDoCandidato, props, validos, votosDoCandidato, nomeDaFeicao(), prepararFeatures(), linhas (+16 more)

### Community 83 - "PlacarRanking.vue"
Cohesion: 0.29
Nodes (7): deltas, emit, escolher(), props, validos, validosAte1715, validosTardios

### Community 84 - "benford.js"
Cohesion: 0.39
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 85 - "consistencia.js"
Cohesion: 0.36
Nodes (6): ausente(), consistenciaPorSecao(), REGRAS, validarConsistenciaBu(), buOk, resultadosOk

### Community 86 - "ordenarLista"
Cohesion: 0.14
Nodes (30): comparar(), lerOrdenacao(), nulo(), ordenacaoSchema(), ordenarLista(), ordenarSql(), biometriaPorMunicipio(), biometriaPorSecao() (+22 more)

### Community 88 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 89 - "filters.js"
Cohesion: 0.29
Nodes (8): deInputSaoPaulo(), offsetSaoPaulo(), cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

### Community 90 - "integration/corte.test.js"
Cohesion: 0.29
Nodes (3): contarCorte(), db, importar()

### Community 92 - "BiometriaPanel.vue"
Cohesion: 0.29
Nodes (6): biometria, emit, fatias, participacao, props, { t }

### Community 93 - "0011_sg_partido_2014.js"
Cohesion: 0.83
Nodes (3): atualizarViews(), down(), up()

### Community 94 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

### Community 95 - "formatarDataHora"
Cohesion: 0.53
Nodes (6): recebimento(), formatarCorte(), formatarData(), formatarDataHora(), localeAtual(), recebimento()

### Community 96 - "FilterBar.vue"
Cohesion: 0.40
Nodes (4): emit, municipioAtivo, props, UFS

## Knowledge Gaps
- **548 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+543 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 695 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `server.js`, `status-secao.test.js`, `env.js`, `mv-secao-candidato.test.js`, `lote.test.js`, `importarArquivo`, `partido-cor.test.js`, `integration/corte.test.js`, `registrarRotas`, `caminhoFixture`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `useOrdenacao()` connect `useOrdenacao` to `EncerramentoView.vue`, `SectionsTable.vue`, `App.vue`, `UfPanel.vue`, `SecaoView.vue`, `TabelaScroll.vue`, `format.js`, `MapTable.vue`, `formatarNumero`, `EstatisticaPanel.vue`, `BiometriaUfPanel.vue`, `MapaView.vue`, `ConsistenciaPanel.vue`, `BiometriaView.vue`, `PainelView.vue`, `RelatorioView.vue`, `StateBlock.vue`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `formatarNumero()` connect `formatarNumero` to `EncerramentoView.vue`, `MapPanel.vue`, `SecaoView.vue`, `PlotDia.vue`, `EntreAnosView.vue`, `format.js`, `MapTable.vue`, `useOrdenacao`, `ConsistenciaPanel.vue`, `RelatorioView.vue`, `StateBlock.vue`, `SectionsTable.vue`, `UfPanel.vue`, `EstatisticaPanel.vue`, `BiometriaUfPanel.vue`, `BiometriaView.vue`, `lib.test.js`, `PlacarRanking.vue`, `BiometriaPanel.vue`, `formatarDataHora`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _548 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EncerramentoView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.07635467980295567 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08056265984654731 - nodes in this community are weakly interconnected._