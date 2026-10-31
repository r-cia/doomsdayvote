# Graph Report - doomsdayvote  (2026-10-31)

## Corpus Check
- 224 files · ~187,493 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1458 nodes · 3087 edges · 92 communities (69 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2dc60285`
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
- StateBlock.vue
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
- caminhoFixture
- RelatorioView.vue
- API de leitura
- AnaliseView.vue
- resolverCorte
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
- components.test.js
- concentracao.js
- server.js
- useSelecaoEleicao
- criarCache
- RedisFalso
- routes/index.js
- integration/ordenacao.test.js
- BiometriaUfPanel.vue
- lote.test.js
- importarArquivo
- Tabelas
- PainelView.vue
- 0002_resultado_votavel_colunas.js
- apuracao.js
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
- benford.js
- consistencia.js
- aplicarFiltroCorte
- partido-cor.test.js
- filters.js
- integration/corte.test.js
- BiometriaPanel.vue
- 0011_sg_partido_2014.js
- migracoes.test.js
- format.js

## God Nodes (most connected - your core abstractions)
1. `importarArquivo()` - 44 edges
2. `useOrdenacao()` - 41 edges
3. `caminhoFixture()` - 34 edges
4. `criarDb()` - 33 edges
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
- `candidatos` --calls--> `candidatosNominais()`  [EXTRACTED]
  frontend/src/App.vue → frontend/src/lib/agregacoes.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordNiveisPanel.vue → frontend/src/composables/ordenacao.js
- `props` --calls--> `useOrdenacao()`  [EXTRACTED]
  frontend/src/components/BenfordPanel.vue → frontend/src/composables/ordenacao.js

## Import Cycles
- None detected.

## Communities (92 total, 9 thin omitted)

### Community 0 - "EncerramentoView.vue"
Cohesion: 0.05
Nodes (35): api, ApiError, montarQuery(), obter(), analiseQuery, carregandoMunicipios, carregandoSecoes, erroMunicipios (+27 more)

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
Nodes (35): lista, props, formatarSha(), avisoInfo(), AVISOS, MOTIVOS, motivoSecao(), opcoesStatus() (+27 more)

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

### Community 13 - "StateBlock.vue"
Cohesion: 0.08
Nodes (23): emit, candidatos, mad(), props, ativo, candidatos, emit, formatarMad() (+15 more)

### Community 14 - "queries.js"
Cohesion: 0.39
Nodes (20): chaveBase(), filtrosBase(), habilitadoBase(), paramsDe(), useAnalise(), useAnomalias(), useComparacaoAnos(), useComparacaoLocal() (+12 more)

### Community 15 - "MapTable.vue"
Cohesion: 0.13
Nodes (16): aoClicarLinha(), colunaRotulo, emit, linhas, linhasPagina, nomeCandidato(), pagina, partidoPorNumero (+8 more)

### Community 16 - "formatarNumero"
Cohesion: 0.12
Nodes (18): aberto, consulta, nivel, percentual(), pontosPercentuais(), props, secoes, { t } (+10 more)

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
Cohesion: 0.21
Nodes (17): itensGradiente(), legenda, clarear(), corDaArea(), corDoLider(), corPartido(), corPercentual(), corTextoContraste() (+9 more)

### Community 21 - "MapaView.vue"
Cohesion: 0.09
Nodes (16): alterarNivel(), avisos, limparParaBrasil(), mapaQuery, mapaTabelaQuery, mapaUfQuery, ordemMapa, ordemSecoes (+8 more)

### Community 22 - "Plano de evolução da auditoria de votos"
Cohesion: 0.13
Nodes (14): 1. Consistência aritmética por seção, 2. Comparação entre seções semelhantes, 3. Diferenças entre versões de BU, 4. Indicadores de concentração e margem, 5. Cobertura e limitações dos dados, 6. Revisão dos indicadores existentes, Critérios de conclusão, Dependências e decisões pendentes para a implementação (+6 more)

### Community 23 - "useOrdenacao"
Cohesion: 0.10
Nodes (14): coberturaEfetiva, entradas, props, cobertura, emit, grupos, props, grupos (+6 more)

### Community 24 - "ConsistenciaPanel.vue"
Cohesion: 0.15
Nodes (10): cobertura, diferenca(), emit, itens, props, resumo, rotuloRegra, router (+2 more)

### Community 25 - "schema.test.js"
Cohesion: 0.24
Nodes (6): DIRETORIO_MIGRACOES, loadMigrateEnv(), main(), db, migrator, TABELAS

### Community 26 - "criarDb"
Cohesion: 0.15
Nodes (15): criarDb(), contar(), limparBanco(), FIXTURES, LINHAS_POR_FIXTURE, backendDir, db, execFileAsync (+7 more)

### Community 27 - "caminhoFixture"
Cohesion: 0.14
Nodes (21): buildApp(), detalhesFastify(), detalhesZod(), isProduction(), atualizarViews(), caminhoFixture(), app, db (+13 more)

### Community 28 - "RelatorioView.vue"
Cohesion: 0.15
Nodes (11): { alternar, ariaSort, seta, params }, alvo, cargoSelecionado, cobertura, consistencia, linhas, percentualCobertura, referencias (+3 more)

### Community 29 - "API de leitura"
Cohesion: 0.11
Nodes (17): API de leitura, `GET /api/analysis`, `GET /api/anomalies`, `GET /api/comparacao-anos`, `GET /api/comparacao-local`, `GET /api/concentracao`, `GET /api/consistencia`, `GET /api/elections` (+9 more)

### Community 30 - "AnaliseView.vue"
Cohesion: 0.13
Nodes (14): queryClient, router, analiseQuery, anomaliasQuery, concentracaoQuery, consistenciaQuery, ordemConsistencia, ordemMargem (+6 more)

### Community 31 - "resolverCorte"
Cohesion: 0.27
Nodes (10): agregadosRelatorio(), metricas(), relatorioDaEleicao(), CARGO_EM_ESCOPO, resolverCorte(), escopoDe(), colunasRelatorio(), diferencaPct() (+2 more)

### Community 32 - "geo-carregar.js"
Cohesion: 0.17
Nodes (11): correspondencia, db, env, geoDir, ibge, linhas, malhas, manifesto (+3 more)

### Community 33 - "SectionsTable.vue"
Cohesion: 0.18
Nodes (12): alternar(), contexto, emit, irPara(), irParaUltima(), itens, pagina, props (+4 more)

### Community 34 - "App.vue"
Cohesion: 0.24
Nodes (6): candidatos, {
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

### Community 35 - "Entre anos"
Cohesion: 0.33
Nodes (5): Entre anos, Estados, Gráficos, Seleção de anos, Tabela de correlação

### Community 36 - "UfPanel.vue"
Cohesion: 0.13
Nodes (17): agrupar, grupos, linhas, partidoPorNumero, props, regiaoDe(), REGIOES, votosUf (+9 more)

### Community 37 - "analise.js"
Cohesion: 0.09
Nodes (25): COLUNAS_CONCENTRACAO, base(), eleicoesDoAno(), estatisticasDaEleicao(), numero(), base(), baseSecaoCandidato(), benfordDosNiveis() (+17 more)

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

### Community 42 - "components.test.js"
Cohesion: 0.11
Nodes (14): emit, municipioAtivo, props, UFS, participacao, percentualDoCandidato, props, validos (+6 more)

### Community 43 - "concentracao.js"
Cohesion: 0.08
Nodes (49): agruparPor(), agruparSecoes(), aplicarEscala(), chaveLocal(), chaveMunicipio(), chaveZona(), comparacaoLocal(), criarGrupo() (+41 more)

### Community 44 - "server.js"
Cohesion: 0.46
Nodes (5): criarDependencias(), migracoesPendentes(), loadApiEnv(), criarLogger(), main()

### Community 45 - "useSelecaoEleicao"
Cohesion: 0.23
Nodes (8): useEleicoes(), useSelecaoEleicao(), aoAno(), aoCargo(), aoTurno(), aplicarEleicao(), eleicaoPara(), formatarCargo()

### Community 48 - "routes/index.js"
Cohesion: 0.39
Nodes (3): AppError, validar(), registrarRotas()

### Community 49 - "integration/ordenacao.test.js"
Cohesion: 0.50
Nodes (4): app, db, json(), obter()

### Community 52 - "BiometriaUfPanel.vue"
Cohesion: 0.25
Nodes (7): agregado, agrupar, agruparRegiao, base, emit, props, REGIAO

### Community 53 - "lote.test.js"
Cohesion: 0.18
Nodes (10): atualizarViewsMaterializadas(), VIEWS_MATERIALIZADAS, carimbo(), carregarPasta(), gerarRelatorioLote(), main(), copiaAlterada(), db (+2 more)

### Community 55 - "importarArquivo"
Cohesion: 0.23
Nodes (12): escaparCopy(), importarArquivo(), armazenarOriginal(), calcularSha256(), concluirLote(), falharLote(), iniciarLote(), app (+4 more)

### Community 56 - "Tabelas"
Cohesion: 0.29
Nodes (6): Cabeçalho ordenável, Estados: carregando, erro, sem dados, dados, Grupos recolhíveis (Comparação local), Recarga, Tabelas, Valor nulo

### Community 59 - "PainelView.vue"
Cohesion: 0.14
Nodes (15): candidatos, candidatosNominais(), candidatos, analiseQuery, avisos, candidatos, candidatoSelecionado, mapaUfQuery (+7 more)

### Community 61 - "apuracao.js"
Cohesion: 0.15
Nodes (15): aplicarEscopo(), contarSecoesComBu(), linhaDoTempo(), areasComDeltaEntreCortes(), base(), somarMetricasSecao(), somarVotos(), totaisPorArea() (+7 more)

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
Cohesion: 0.23
Nodes (17): buDaSecao(), buscarSecao(), COLUNAS_SECOES, detalheDoBoletim(), itemSecao(), listarSecoes(), motivoSql(), statusSql() (+9 more)

### Community 82 - "lib.test.js"
Cohesion: 0.12
Nodes (25): indiceAreas, nomeDaFeicao(), prepararFeatures(), deltas, emit, escolher(), props, validos (+17 more)

### Community 84 - "benford.js"
Cohesion: 0.39
Nodes (6): calcularBenford(), classificarMad(), DIGITOS, ESPERADO_BENFORD, LIMIAR_MAD, primeiroDigito()

### Community 85 - "consistencia.js"
Cohesion: 0.36
Nodes (6): ausente(), consistenciaPorSecao(), REGRAS, validarConsistenciaBu(), buOk, resultadosOk

### Community 86 - "aplicarFiltroCorte"
Cohesion: 0.16
Nodes (27): comparar(), lerOrdenacao(), nulo(), ordenacaoSchema(), ordenarLista(), ordenarSql(), biometriaPorMunicipio(), biometriaPorSecao() (+19 more)

### Community 88 - "partido-cor.test.js"
Cohesion: 0.32
Nodes (6): ambiente(), backendDir, cores, db, execFileAsync, semear()

### Community 89 - "filters.js"
Cohesion: 0.39
Nodes (6): cargoPadrao(), cargosPermitidos(), ehPresidente(), ORDEM_CARGOS, ordemCargo(), eleicoes

### Community 90 - "integration/corte.test.js"
Cohesion: 0.29
Nodes (3): contarCorte(), db, importar()

### Community 92 - "BiometriaPanel.vue"
Cohesion: 0.29
Nodes (6): biometria, emit, fatias, participacao, props, { t }

### Community 93 - "0011_sg_partido_2014.js"
Cohesion: 0.52
Nodes (6): down(), recriarSecaoCandidatoFinal(), recriarTotaisArea(), recriarViews(), recriarVotosFinal(), up()

### Community 94 - "migracoes.test.js"
Cohesion: 0.50
Nodes (3): db, diretorio, migrator

### Community 95 - "format.js"
Cohesion: 0.16
Nodes (15): campos, camposAusentes, camposNaoInformados, props, { t }, recebimento(), deInputSaoPaulo(), formatadorOffset (+7 more)

## Knowledge Gaps
- **549 isolated node(s):** `name`, `version`, `private`, `type`, `node` (+544 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 696 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `criarDb()` connect `criarDb` to `geo-carregar.js`, `server.js`, `status-secao.test.js`, `integration/ordenacao.test.js`, `env.js`, `mv-secao-candidato.test.js`, `lote.test.js`, `importarArquivo`, `partido-cor.test.js`, `integration/corte.test.js`, `caminhoFixture`, `apuracao.js`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `useOrdenacao()` connect `useOrdenacao` to `EncerramentoView.vue`, `SectionsTable.vue`, `UfPanel.vue`, `SecaoView.vue`, `components.test.js`, `StateBlock.vue`, `MapTable.vue`, `formatarNumero`, `BiometriaUfPanel.vue`, `MapaView.vue`, `ConsistenciaPanel.vue`, `PainelView.vue`, `RelatorioView.vue`, `AnaliseView.vue`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `formatarNumero()` connect `formatarNumero` to `EncerramentoView.vue`, `SectionsTable.vue`, `MapPanel.vue`, `UfPanel.vue`, `SecaoView.vue`, `PlotDia.vue`, `components.test.js`, `EntreAnosView.vue`, `StateBlock.vue`, `RelatorioView.vue`, `MapTable.vue`, `lib.test.js`, `BiometriaUfPanel.vue`, `useOrdenacao`, `ConsistenciaPanel.vue`, `BiometriaPanel.vue`, `format.js`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useOrdenacao()` (e.g. with `alternar()` and `ariaSort()`) actually correct?**
  _`useOrdenacao()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _549 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `EncerramentoView.vue` be split into smaller, more focused modules?**
  _Cohesion score 0.04521276595744681 - nodes in this community are weakly interconnected._
- **Should `ler-arquivo.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08056265984654731 - nodes in this community are weakly interconnected._